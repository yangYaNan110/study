<template>
  <div class="path-debugger">
    <div class="debugger-toolbar">
      <div class="debugger-title">
        <span>2D轮廓调试</span>
        <em>{{ pathStatusText }}</em>
      </div>
      <div class="debugger-actions">
        <el-button size="small" @click="fitView">适应</el-button>
        <el-button size="small" title="原寸显示：1单位=1像素，优先居中选中线段" @click="resetView">1:1</el-button>
        <el-switch v-model="showPoints" size="small" active-text="点" />
        <el-switch v-model="showLabels" size="small" active-text="段号" />
        <el-switch v-model="showGrid" size="small" active-text="网格" />
      </div>
    </div>

    <div ref="canvasRef" class="debugger-canvas">
      <div v-if="!segmentModels.length" class="debugger-empty">暂无可预览线段</div>
      <div class="axis-overlay" aria-hidden="true">
        <span class="axis-origin"></span>
        <span class="axis-line axis-x"><em>+X</em></span>
        <span class="axis-line axis-z"><em>+Z</em></span>
      </div>
    </div>

    <div class="debugger-status">
      <span>{{ selectedStatusText }}</span>
      <span>投影：XZ（+X向右 / +Z向下）</span>
    </div>

    <div class="debugger-checks">
      <button
        v-for="issue in issues"
        :key="issue.id"
        :class="['check-item', issue.level]"
        type="button"
        @click="focusIssue(issue)"
      >
        {{ issue.message }}
      </button>
      <span v-if="!issues.length" class="check-ok">未发现连接异常</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { PixiRenderer } from "@render2d/editor";
import { Container, Graphics, Text } from "pixi.js";
import { Vector3 as ThreeVector3 } from "three";
import { ArcSegment } from "@/three/src/object/bim/math/ArcSegment";
import { LineSegment } from "@/three/src/object/bim/math/LineSegment";
import { PolylineSegment } from "@/three/src/object/bim/math/PolylineSegment";
import type { ExpressionContext } from "@/three/src/object/bim/expression/Expression";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import { EditorDataUtil } from "@/three/src/interface/modelEditor/util/EditorDataUtil";

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Vec2 = {
  x: number;
  y: number;
};

type SegmentModel = {
  index: number;
  type: string;
  start: Vec3;
  end: Vec3;
  points: Vec3[];
  projectedPoints: Vec2[];
  center?: Vec3;
  projectedCenter?: Vec2;
  radius?: number;
  length: number;
  valid: boolean;
  error?: string;
};

type PathIssue = {
  id: string;
  level: "warning" | "error";
  message: string;
  segmentIndex?: number;
};

const props = withDefaults(
  defineProps<{
    segments: any[];
    selectedIndex?: number;
  }>(),
  {
    segments: () => [],
    selectedIndex: -1,
  },
);

const emits = defineEmits<{
  (e: "update:selectedIndex", index: number): void;
  (e: "selectSegment", index: number): void;
}>();

const canvasRef = ref<HTMLDivElement | null>(null);
const showPoints = ref(true);
const showLabels = ref(true);
const showGrid = ref(true);
const segmentModels = ref<SegmentModel[]>([]);
const issues = ref<PathIssue[]>([]);

let renderer: PixiRenderer | null = null;
let root: Container | null = null;
let gridLayer: Container | null = null;
let segmentLayer: Container | null = null;
let pointLayer: Container | null = null;
let labelLayer: Container | null = null;
let resizeObserver: ResizeObserver | null = null;
let fitFrameId: number | null = null;

const currentSelectedIndex = computed(() => props.selectedIndex ?? -1);
const visibleSegments = computed(() => (props.segments || []).filter(segment => segment && !segment.isMergeRow));
const segmentSignature = computed(() => visibleSegments.value.map(createSegmentSignature).join("||"));

const pathStatusText = computed(() => {
  if (!segmentModels.value.length) return "空路径";
  if (issues.value.some(issue => issue.level === "error")) return "存在错误";
  if (issues.value.some(issue => issue.level === "warning")) return "需要检查";
  return "已闭合";
});

const selectedStatusText = computed(() => {
  const selected = segmentModels.value.find(segment => segment.index === currentSelectedIndex.value);
  if (!selected) {
    return "未选择线段";
  }

  const typeText = selected.type === "arc" ? "圆弧" : selected.type === "polyline" ? "折线" : "线段";
  const lengthText = Number.isFinite(selected.length) ? selected.length.toFixed(2) : "--";
  return `段 ${selected.index + 1} | ${typeText} | 长度 ${lengthText}${selected.error ? ` | ${selected.error}` : ""}`;
});

onMounted(async () => {
  await initRenderer();
  rebuildAndDraw(true);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (fitFrameId !== null) {
    cancelAnimationFrame(fitFrameId);
    fitFrameId = null;
  }
  renderer?.destroy();
  renderer = null;
  root = null;
});

watch(segmentSignature, () => rebuildAndDraw(true));

watch(
  () => props.selectedIndex,
  () => draw(),
);

watch([showPoints, showLabels, showGrid], () => draw());

async function initRenderer() {
  if (!canvasRef.value || renderer) return;

  renderer = new PixiRenderer();
  await renderer.initializeAsync(canvasRef.value);

  root = renderer.getRoot();
  gridLayer = createLayer(0);
  segmentLayer = createLayer(10);
  pointLayer = createLayer(20);
  labelLayer = createLayer(30);
  resizeRendererToContainer();

  resizeObserver = new ResizeObserver(() => {
    if (!canvasRef.value || !renderer) return;
    resizeRendererToContainer();
    draw();
    if (segmentModels.value.length) {
      scheduleFitView();
    }
  });
  resizeObserver.observe(canvasRef.value);
}

function createLayer(zIndex: number) {
  const layer = new Container();
  layer.zIndex = zIndex;
  root?.addChild(layer);
  return layer;
}

function rebuildAndDraw(shouldFit = false) {
  const nextModels = buildSegmentModels();
  segmentModels.value = nextModels;
  issues.value = validatePath(nextModels);
  draw();

  if (shouldFit) {
    nextTick(() => {
      scheduleFitView();
    });
  }
}

function buildSegmentModels(): SegmentModel[] {
  const context = getCurrentExpressionContext();

  return visibleSegments.value
    .map((segment, index) => createSegmentModel(segment, index, context))
    .filter(Boolean) as SegmentModel[];
}

function getCurrentExpressionContext(): ExpressionContext | undefined {
  try {
    return ExpressionUtil.getCurrentContext();
  } catch (err) {
    console.warn("[Path2dDebugger] 表达式上下文不可用，使用 segment 当前值预览。", err);
    return undefined;
  }
}

function createSegmentModel(segment: any, index: number, context?: ExpressionContext): SegmentModel | null {
  try {
    const segmentType = getSegmentType(segment);

    if (segment instanceof LineSegment || segmentType === "line") {
      return createLineModel(segment, index, context);
    }

    if (segment instanceof ArcSegment || segmentType === "arc") {
      return createArcModel(createArcSegmentForPreview(segment), index, context);
    }

    if (segment instanceof PolylineSegment || segmentType === "polyline") {
      return createPolylineModel(segment, index, context);
    }
  } catch (err) {
    const start = readPoint(segment?.startPoint, context);
    const end = readPoint(segment?.endPoint, context);
    return {
      index,
      type: segment?.type || "unknown",
      start,
      end,
      points: [start, end],
      projectedPoints: [projectPoint(start), projectPoint(end)],
      length: distance3(start, end),
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return null;
}

function createLineModel(segment: any, index: number, context?: ExpressionContext): SegmentModel {
  const start = readPoint(segment.startPoint, context);
  const end = readPoint(segment.endPoint, context);
  const length = distance3(start, end);
  const points = [start, end];

  return {
    index,
    type: "line",
    start,
    end,
    points,
    projectedPoints: points.map(projectPoint),
    length,
    valid: length > 0.01,
    error: length <= 0.01 ? "零长度线段" : undefined,
  };
}

function createArcModel(segment: ArcSegment, index: number, context?: ExpressionContext): SegmentModel {
  const start = readPoint(segment.startPoint, context);
  const end = readPoint(segment.endPoint, context);
  const radius = readNumber(segment.radius, context);
  const count = clamp(Math.round(readNumber(segment.count, context) || 24), 8, 128);
  segment.radius.value = radius;
  segment.count.value = count;

  if (!Number.isFinite(radius) || radius <= 0) {
    throw new Error("圆弧半径非法");
  }

  recomputeArcGeometry(segment, start, end, radius);

  const points = segment.samplePoints(count).map(point => ({ x: point.x, y: point.y, z: point.z }));
  const length = Number.isFinite(segment.getLength()) ? segment.getLength() : distance3(start, end);
  const center = { x: segment.center.x, y: segment.center.y, z: segment.center.z };

  return {
    index,
    type: "arc",
    start,
    end,
    points,
    projectedPoints: points.map(projectPoint),
    center,
    projectedCenter: projectPoint(center),
    radius,
    length,
    valid: segment.valid(),
    error: segment.valid() ? undefined : "圆弧参数非法",
  };
}

function createPolylineModel(segment: any, index: number, context?: ExpressionContext): SegmentModel {
  const points = getPolylinePoints(segment, context);
  const start = points[0] || { x: 0, y: 0, z: 0 };
  const end = points[points.length - 1] || start;
  const length = points.reduce((sum, point, pointIndex) => {
    if (pointIndex === 0) return sum;
    return sum + distance3(points[pointIndex - 1], point);
  }, 0);

  return {
    index,
    type: "polyline",
    start,
    end,
    points,
    projectedPoints: points.map(projectPoint),
    length,
    valid: points.length >= 2 && length > 0.01,
    error: points.length < 2 || length <= 0.01 ? "折线点数不足" : undefined,
  };
}

function getPolylinePoints(segment: any, context?: ExpressionContext): Vec3[] {
  if (segment.points?.length) {
    return segment.points.map(point => readPlainPoint(point, context));
  }

  if (segment.segments?.length) {
    const points: Vec3[] = [];
    segment.segments.forEach((lineSegment, index) => {
      if (index === 0) {
        points.push(readPoint(lineSegment.startPoint, context));
      }
      points.push(readPoint(lineSegment.endPoint, context));
    });
    return points;
  }

  return [];
}

function recomputeArcGeometry(segment: ArcSegment, start: Vec3, end: Vec3, radius: number) {
  const param = {
    startPoint: start,
    endPoint: end,
    arcDirection: segment.arcDirection,
  };
  const planeNormal = EditorDataUtil.getPlaneNormalByPoints(start, end, new ThreeVector3(0, 1, 0));
  const bulgeDirection = EditorDataUtil.getArcDirection(param, planeNormal);

  segment.createFromPoints(
    new ThreeVector3(start.x, start.y, start.z),
    new ThreeVector3(end.x, end.y, end.z),
    radius,
    bulgeDirection,
    true,
  );
}

function createArcSegmentForPreview(segment: any): ArcSegment {
  return new ArcSegment({
    id: segment?.id,
    type: "arc",
    center: readVectorOption(segment?.center),
    normal: readVectorOption(segment?.normal),
    startPoint: readPointOption(segment?.startPoint),
    endPoint: readPointOption(segment?.endPoint),
    arcDirection: segment?.arcDirection,
    radius: readExpressionText(segment?.radius, "1"),
    startAngle: String(segment?.startAngle ?? 0),
    endAngle: String(segment?.endAngle ?? 0),
    count: readExpressionText(segment?.count, "24"),
  });
}

function getSegmentType(segment: any): string {
  const type = String(segment?.__type || segment?.type || "").toLowerCase();
  if (type === "linesegment") return "line";
  if (type === "arcsegment") return "arc";
  if (type === "polylinesegment") return "polyline";
  if (!type && (Array.isArray(segment?.points) || Array.isArray(segment?.segments))) return "polyline";
  return type;
}

function createSegmentSignature(segment: any): string {
  const type = getSegmentType(segment);
  const startPoint = readPointOption(segment?.startPoint);
  const endPoint = readPointOption(segment?.endPoint);
  const base = [type, startPoint.x, startPoint.y, startPoint.z, endPoint.x, endPoint.y, endPoint.z];

  if (type === "arc") {
    base.push(
      String(segment?.arcDirection),
      readExpressionText(segment?.radius, ""),
      readExpressionText(segment?.count, ""),
    );
  }

  if (type === "polyline") {
    base.push(
      (segment?.points || []).map(point => Object.values(readPointOption(point)).join(",")).join(";"),
      (segment?.segments || []).map(createSegmentSignature).join(";"),
    );
  }

  return base.join("|");
}

function readPoint(point: any, context?: ExpressionContext): Vec3 {
  return {
    x: readNumber(point?.x, context),
    y: readNumber(point?.y, context),
    z: readNumber(point?.z, context),
  };
}

function readPlainPoint(point: any, context?: ExpressionContext): Vec3 {
  return {
    x: readNumber(point?.x, context),
    y: readNumber(point?.y, context),
    z: readNumber(point?.z, context),
  };
}

function readPointOption(point: any) {
  return {
    x: readExpressionText(point?.x, "0"),
    y: readExpressionText(point?.y, "0"),
    z: readExpressionText(point?.z, "0"),
  };
}

function readVectorOption(point: any) {
  if (!point) return undefined;
  return {
    x: String(point.x ?? 0),
    y: String(point.y ?? 0),
    z: String(point.z ?? 0),
  };
}

function readExpressionText(value: any, fallback = "0"): string {
  if (value && typeof value === "object") {
    if ("content" in value) {
      return String(value.content ?? fallback);
    }
    if ("value" in value) {
      return String(value.value ?? fallback);
    }
  }
  return String(value ?? fallback);
}

function readNumber(value: any, context?: ExpressionContext): number {
  const content = readExpressionText(value, "");

  if (Number.isFinite(Number(content))) {
    return Number(content);
  }

  if (context && content !== "") {
    try {
      const calculated = ExpressionUtil.calculateResult(String(content), context);
      if (Number.isFinite(Number(calculated))) {
        return Number(calculated);
      }
    } catch (err) {
      // 输入表达式尚未完整时，预览退回到缓存值或 NaN 状态即可。
    }
  }

  const rawValue = value?.value;
  if (Number.isFinite(Number(rawValue))) {
    return Number(rawValue);
  }

  return Number.NaN;
}

function validatePath(models: SegmentModel[]): PathIssue[] {
  const nextIssues: PathIssue[] = [];
  const tolerance = 0.01;

  models.forEach(segment => {
    if (!segment.valid || segment.error) {
      nextIssues.push({
        id: `invalid-${segment.index}`,
        level: "error",
        message: `段 ${segment.index + 1} ${segment.error || "参数非法"}`,
        segmentIndex: segment.index,
      });
    }
  });

  for (let i = 0; i < models.length - 1; i++) {
    const distance = distance3(models[i].end, models[i + 1].start);
    if (distance > tolerance) {
      nextIssues.push({
        id: `gap-${i}-${i + 1}`,
        level: "warning",
        message: `段 ${i + 1} -> ${i + 2} 不连续，距离 ${distance.toFixed(2)}`,
        segmentIndex: i + 1,
      });
    }
  }

  if (models.length > 1) {
    const closeDistance = distance3(models[models.length - 1].end, models[0].start);
    if (closeDistance > tolerance) {
      nextIssues.push({
        id: "not-closed",
        level: "warning",
        message: `路径未闭合，首尾距离 ${closeDistance.toFixed(2)}`,
        segmentIndex: models.length - 1,
      });
    }
  }

  return nextIssues;
}

function draw() {
  if (!root || !gridLayer || !segmentLayer || !pointLayer || !labelLayer) return;

  clearLayer(gridLayer);
  clearLayer(segmentLayer);
  clearLayer(pointLayer);
  clearLayer(labelLayer);

  if (showGrid.value) {
    drawGrid();
  }

  segmentModels.value.forEach(segment => drawSegment(segment));

  if (showPoints.value) {
    drawPoints();
  }

  if (showLabels.value) {
    drawLabels();
  }
}

function clearLayer(layer: Container) {
  layer.removeChildren().forEach(child => child.destroy({ children: true }));
}

function drawSegment(segment: SegmentModel) {
  const selected = currentSelectedIndex.value === segment.index;
  const hasError = issues.value.some(issue => issue.segmentIndex === segment.index);
  const color = hasError ? 0xf56c6c : selected ? 0x1677ff : 0x409eff;
  const width = selected ? 4 : 2;

  const visiblePath = new Graphics();
  drawPolyline(visiblePath, segment.projectedPoints);
  visiblePath.stroke({ width, color, alpha: selected ? 1 : 0.85 });
  segmentLayer?.addChild(visiblePath);

  const hitPath = new Graphics();
  drawPolyline(hitPath, segment.projectedPoints);
  hitPath.stroke({ width: 16, color: 0xffffff, alpha: 0.001 });
  hitPath.eventMode = "static";
  hitPath.cursor = "pointer";
  hitPath.on("pointertap", () => selectSegment(segment.index));
  segmentLayer?.addChild(hitPath);

  if (selected && segment.type === "arc" && segment.projectedCenter) {
    drawArcHelper(segment);
  }
}

function drawPolyline(graphics: Graphics, points: Vec2[]) {
  if (!points.length) return;
  graphics.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => graphics.lineTo(point.x, point.y));
}

function drawArcHelper(segment: SegmentModel) {
  if (!segment.projectedCenter || !segment.projectedPoints.length) return;

  const helper = new Graphics();
  const center = segment.projectedCenter;
  const start = segment.projectedPoints[0];
  const end = segment.projectedPoints[segment.projectedPoints.length - 1];

  helper.circle(center.x, center.y, 3).fill({ color: 0x303133 });
  helper.moveTo(center.x, center.y).lineTo(start.x, start.y).stroke({ width: 1, color: 0x909399, alpha: 0.8 });
  helper.moveTo(center.x, center.y).lineTo(end.x, end.y).stroke({ width: 1, color: 0x909399, alpha: 0.8 });
  pointLayer?.addChild(helper);
}

function drawPoints() {
  const pointGraphic = new Graphics();
  segmentModels.value.forEach(segment => {
    const hasError = issues.value.some(issue => issue.segmentIndex === segment.index);
    const color = hasError ? 0xf56c6c : currentSelectedIndex.value === segment.index ? 0x1677ff : 0x606266;
    const start = segment.projectedPoints[0];
    const end = segment.projectedPoints[segment.projectedPoints.length - 1];

    if (start) pointGraphic.circle(start.x, start.y, 3.5).fill({ color });
    if (end) pointGraphic.circle(end.x, end.y, 3.5).fill({ color });
  });
  pointLayer?.addChild(pointGraphic);
}

function drawLabels() {
  const viewScale = getViewScale();
  const screenToWorld = 1 / viewScale;
  const fontSize = 14 * screenToWorld;
  const offset = 16 * screenToWorld;
  const paddingX = 6 * screenToWorld;
  const paddingY = 3 * screenToWorld;
  const radius = 4 * screenToWorld;
  const borderWidth = 1 * screenToWorld;

  segmentModels.value.forEach(segment => {
    const placement = getPolylineLabelPlacement(segment.projectedPoints);
    if (!placement) return;

    const selected = currentSelectedIndex.value === segment.index;
    const hasError = issues.value.some(issue => issue.segmentIndex === segment.index);
    const labelColor = hasError ? 0xf56c6c : selected ? 0x1677ff : 0x606266;
    const borderColor = hasError ? 0xf56c6c : selected ? 0x1677ff : 0xdcdfe6;
    const backgroundColor = selected ? 0xeaf2ff : 0xffffff;

    const label = new Text({
      text: `段 ${segment.index + 1}`,
      style: {
        fontSize,
        fill: labelColor,
        fontFamily: "Arial, sans-serif",
        fontWeight: "600",
      },
    });
    label.anchor.set(0.5);

    const background = new Graphics();
    background
      .roundRect(-label.width / 2 - paddingX, -label.height / 2 - paddingY, label.width + paddingX * 2, label.height + paddingY * 2, radius)
      .fill({ color: backgroundColor, alpha: 0.92 })
      .stroke({ width: borderWidth, color: borderColor, alpha: 0.72 });

    const labelGroup = new Container();
    labelGroup.x = placement.point.x + placement.normal.x * offset;
    labelGroup.y = placement.point.y + placement.normal.y * offset;
    labelGroup.eventMode = "none";
    labelGroup.addChild(background);
    labelGroup.addChild(label);
    labelLayer?.addChild(labelGroup);
  });
}

function drawGrid() {
  if (!gridLayer) return;

  const bounds = getProjectedBounds();
  const grid = new Graphics();
  const range = Math.max(bounds.width, bounds.height, 400);
  const step = chooseGridStep(range);
  const minX = Math.floor((bounds.centerX - range) / step) * step;
  const maxX = Math.ceil((bounds.centerX + range) / step) * step;
  const minY = Math.floor((bounds.centerY - range) / step) * step;
  const maxY = Math.ceil((bounds.centerY + range) / step) * step;

  for (let x = minX; x <= maxX; x += step) {
    grid.moveTo(x, minY).lineTo(x, maxY);
  }
  for (let y = minY; y <= maxY; y += step) {
    grid.moveTo(minX, y).lineTo(maxX, y);
  }
  grid.stroke({ width: 1, color: 0xdcdfe6, alpha: 0.45 });

  grid.moveTo(minX, 0).lineTo(maxX, 0).stroke({ width: 1, color: 0xf56c6c, alpha: 0.7 });
  grid.moveTo(0, minY).lineTo(0, maxY).stroke({ width: 1, color: 0x67c23a, alpha: 0.7 });
  gridLayer.addChild(grid);
}

function selectSegment(index: number) {
  emits("update:selectedIndex", index);
  emits("selectSegment", index);
}

function focusIssue(issue: PathIssue) {
  if (typeof issue.segmentIndex === "number") {
    selectSegment(issue.segmentIndex);
    focusSegment(issue.segmentIndex);
  }
}

function focusSegment(index: number) {
  const segment = segmentModels.value.find(item => item.index === index);
  if (!segment || !root || !renderer) return;

  const bounds = getPointsBounds(segment.projectedPoints);
  const { width, height } = getViewportSize();
  const scale = Number.isFinite(root.scale.x) ? root.scale.x : 1;

  root.position.set(width / 2 - bounds.centerX * scale, height / 2 - bounds.centerY * scale);
}

function fitView() {
  if (!root || !segmentModels.value.length) return;

  const bounds = getProjectedBounds();
  const { width: canvasWidth, height: canvasHeight } = getViewportSize();
  if (canvasWidth <= 1 || canvasHeight <= 1) return;

  const paddingX = Math.max(28, canvasWidth * 0.12);
  const paddingY = Math.max(28, canvasHeight * 0.08);
  const availableWidth = Math.max(canvasWidth - paddingX * 2, 1);
  const availableHeight = Math.max(canvasHeight - paddingY * 2, 1);
  const scale = clamp(Math.min(availableWidth / bounds.width, availableHeight / bounds.height), 0.01, 80);

  root.scale.set(scale);
  root.position.set(canvasWidth / 2 - bounds.centerX * scale, canvasHeight / 2 - bounds.centerY * scale);
  draw();
}

function resetView() {
  if (!root) return;
  const { width, height } = getViewportSize();
  const scale = 1;

  root.scale.set(scale);

  if (!segmentModels.value.length) {
    root.position.set(width / 2, height / 2);
    return;
  }

  const bounds = getResetViewBounds(width, height, scale);
  root.position.set(width / 2 - bounds.centerX * scale, height / 2 - bounds.centerY * scale);
  draw();
}

function getResetViewBounds(canvasWidth: number, canvasHeight: number, scale: number) {
  const selected = segmentModels.value.find(segment => segment.index === currentSelectedIndex.value);
  if (selected) {
    return getPointsBounds(selected.projectedPoints);
  }

  const pathBounds = getProjectedBounds();
  const fitsPath = pathBounds.width * scale <= canvasWidth * 0.92 && pathBounds.height * scale <= canvasHeight * 0.92;
  if (fitsPath) {
    return pathBounds;
  }

  const firstSegment = segmentModels.value[0];
  return getPointsBounds(firstSegment ? firstSegment.projectedPoints : []);
}

function getProjectedBounds() {
  const points = segmentModels.value.flatMap(segment => segment.projectedPoints);
  return getPointsBounds(points);
}

function getPointsBounds(points: Vec2[]) {
  const finitePoints = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!finitePoints.length) {
    return { minX: -100, maxX: 100, minY: -100, maxY: 100, width: 200, height: 200, centerX: 0, centerY: 0 };
  }

  const minX = Math.min(...finitePoints.map(point => point.x));
  const maxX = Math.max(...finitePoints.map(point => point.x));
  const minY = Math.min(...finitePoints.map(point => point.y));
  const maxY = Math.max(...finitePoints.map(point => point.y));
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

function getPolylineLabelPlacement(points: Vec2[]) {
  const finitePoints = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!finitePoints.length) return null;
  if (finitePoints.length === 1) {
    return {
      point: finitePoints[0],
      normal: { x: 0, y: -1 },
    };
  }

  const totalLength = getPolylineLength(finitePoints);
  if (totalLength <= 0) {
    return {
      point: finitePoints[0],
      normal: { x: 0, y: -1 },
    };
  }

  const targetLength = totalLength / 2;
  let walkedLength = 0;

  for (let i = 1; i < finitePoints.length; i += 1) {
    const start = finitePoints[i - 1];
    const end = finitePoints[i];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length <= 0) continue;

    if (walkedLength + length >= targetLength) {
      const t = (targetLength - walkedLength) / length;
      const point = {
        x: start.x + dx * t,
        y: start.y + dy * t,
      };
      return {
        point,
        normal: getPreferredNormal(dx / length, dy / length),
      };
    }

    walkedLength += length;
  }

  return {
    point: finitePoints[finitePoints.length - 1],
    normal: { x: 0, y: -1 },
  };
}

function getPolylineLength(points: Vec2[]) {
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    return total + Math.sqrt((point.x - previous.x) ** 2 + (point.y - previous.y) ** 2);
  }, 0);
}

function getPreferredNormal(tangentX: number, tangentY: number) {
  let normal = {
    x: -tangentY,
    y: tangentX,
  };

  if (normal.y > 0 || (Math.abs(normal.y) < 0.001 && normal.x < 0)) {
    normal = {
      x: -normal.x,
      y: -normal.y,
    };
  }

  return normal;
}

function chooseGridStep(range: number) {
  if (range > 3000) return 500;
  if (range > 1200) return 200;
  if (range > 600) return 100;
  if (range > 240) return 50;
  return 20;
}

function projectPoint(point: Vec3): Vec2 {
  return {
    x: point.x,
    y: point.z,
  };
}

function getViewportSize() {
  const screen = renderer?.app?.renderer?.screen;
  if (screen?.width && screen?.height) {
    return { width: screen.width, height: screen.height };
  }

  const rect = canvasRef.value?.getBoundingClientRect();
  return {
    width: rect?.width || 1,
    height: rect?.height || 1,
  };
}

function getViewScale() {
  const scale = root?.scale.x ?? 1;
  return clamp(Math.abs(scale), 0.01, 80);
}

function resizeRendererToContainer() {
  if (!renderer || !canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = window.devicePixelRatio || 1;
  renderer.resize(Math.round(rect.width * dpr), Math.round(rect.height * dpr));
}

function scheduleFitView() {
  if (fitFrameId !== null) {
    cancelAnimationFrame(fitFrameId);
  }

  fitFrameId = requestAnimationFrame(() => {
    fitFrameId = null;
    fitView();
  });
}

function distance3(a: Vec3, b: Vec3) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
</script>

<style scoped lang="scss">
.path-debugger {
  height: 100%;
  min-height: 420px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  background: #fff;
}

.debugger-toolbar {
  min-height: 42px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.debugger-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;

  em {
    font-style: normal;
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
}

.debugger-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.debugger-canvas {
  position: relative;
  min-height: 300px;
  overflow: hidden;
  background: #fafafa;
}

.debugger-canvas :deep(canvas) {
  display: block;
}

.axis-overlay {
  position: absolute;
  left: 18px;
  bottom: 18px;
  width: 82px;
  height: 82px;
  pointer-events: none;
  color: var(--el-text-color-primary);
}

.axis-origin {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #303133;
  transform: translate(-50%, -50%);
}

.axis-line {
  position: absolute;
  left: 10px;
  top: 10px;
  display: block;

  &::after {
    position: absolute;
    content: "";
    width: 0;
    height: 0;
  }

  em {
    position: absolute;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
}

.axis-x {
  width: 54px;
  height: 2px;
  background: #f56c6c;

  &::after {
    right: -1px;
    top: -4px;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid #f56c6c;
  }

  em {
    right: -22px;
    top: -5px;
    color: #c45656;
  }
}

.axis-z {
  width: 2px;
  height: 54px;
  background: #67c23a;
  transform: translateX(-1px);

  &::after {
    left: -4px;
    bottom: -1px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #67c23a;
  }

  em {
    left: -4px;
    bottom: -20px;
    color: #529b2e;
  }
}

.debugger-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}

.debugger-status {
  min-height: 32px;
  padding: 6px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.debugger-checks {
  min-height: 36px;
  padding: 6px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.check-item {
  border: 0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;

  &.warning {
    background: #fdf6ec;
    color: #b88230;
  }

  &.error {
    background: #fef0f0;
    color: #c45656;
  }
}

.check-ok {
  color: var(--el-color-success);
  font-size: 12px;
}
</style>
