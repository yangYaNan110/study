import { computed, ref, type ComputedRef, type Ref } from "vue";
import { EProjection } from "@/three/src/object/bim/variable/PathInfo";
import { Path2dDebuggerService } from "../service/Path2dDebuggerService";
import type { PathProjectionInfo } from "../service/Path2dDebuggerService";

/** 路径点的三维业务数据，运行时投影由渲染组件或模型转换逻辑负责。 */
export interface PathPoint3d {
  x: number;
  y: number;
  z: number;
}

/** 路径点的二维投影数据。 */
export interface PathPoint2d {
  x: number;
  y: number;
}

/** 二维投影路径的包围盒，用于网格和视图适配。 */
export interface ProjectedBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/** 供轮廓、点、标签等渲染组件复用的标准化线段模型。 */
export interface PathSegmentModel {
  index: number;
  type: string;
  start: PathPoint3d;
  end: PathPoint3d;
  points: PathPoint3d[];
  projectedPoints: PathPoint2d[];
  center?: PathPoint3d;
  projectedCenter?: PathPoint2d;
  radius?: number;
  length: number;
  valid: boolean;
  error?: string;
}

/** 路径校验结果，segmentIndex 用于定位对应线段。 */
export interface PathIssue {
  id: string;
  level: "warning" | "error";
  message: string;
  segmentIndex?: number;
}

/** 当前路径的平面识别结果及二维显示方向。 */
export interface PathProjectionAxes {
  horizontal: string;
  vertical: string;
}

/** Path2D 调试器的业务状态和操作入口。 */
export class Path2dDebuggerStore {
  /** 原始路径段数据，保留动态模型对象以兼容现有参数化链路。 */
  public readonly segments: Ref<unknown[]> = ref([]);
  /** 当前选中的路径段索引。 */
  public readonly selectedIndex: Ref<number> = ref(-1);
  /** 是否显示端点、段号和网格。 */
  public readonly showPoints: Ref<boolean> = ref(true);
  public readonly showLabels: Ref<boolean> = ref(true);
  public readonly showGrid: Ref<boolean> = ref(true);
  /** 标准化后的线段模型和路径校验结果。 */
  public readonly segmentModels: Ref<PathSegmentModel[]> = ref([]);
  public readonly issues: Ref<PathIssue[]> = ref([]);
  public readonly projectionLabel: Ref<EProjection> = ref(EProjection.nothingness);
  public readonly projectionNormal: Ref<PathPoint3d | null> = ref(null);
  public readonly projectionError: Ref<string | undefined> = ref(undefined);

  /** 根据实际投影面显示坐标轴标签。 */
  public readonly projectionAxes: ComputedRef<PathProjectionAxes> = computed(() => {
    if (this.projectionLabel.value === EProjection.xy) {
      return { horizontal: "+X", vertical: "+Y" };
    }
    if (this.projectionLabel.value === EProjection.yz) {
      return { horizontal: "+Y", vertical: "+Z" };
    }
    return { horizontal: "+X", vertical: "+Z" };
  });

  /** 供状态栏展示当前识别出的投影平面。 */
  public readonly projectionText: ComputedRef<string> = computed(() => {
    if (this.projectionError.value) return this.projectionError.value;
    return `投影：${this.projectionLabel.value.toUpperCase()}`;
  });

  /** 当前标准化路径的二维投影包围盒。 */
  public readonly projectedBounds: ComputedRef<ProjectedBounds> = computed(() =>
    Path2dDebuggerService.getProjectedBounds(this.segmentModels.value),
  );

  /** 过滤掉合并行后的可视路径段。 */
  public readonly visibleSegments: ComputedRef<unknown[]> = computed(() =>
    this.segments.value.filter(segment => {
      if (!segment || typeof segment !== "object") return false;
      return !(segment as { isMergeRow?: boolean }).isMergeRow;
    }),
  );

  /** 当前路径的状态文本，供调试器 UI 展示。 */
  public readonly pathStatusText: ComputedRef<string> = computed(() => {
    if (!this.segmentModels.value.length) return "空路径";
    if (this.issues.value.some(issue => issue.level === "error")) return "存在错误";
    if (this.issues.value.some(issue => issue.level === "warning")) return "需要检查";
    return "已闭合";
  });

  /** 当前选中线段的状态摘要，供状态栏等界面组件只读展示。 */
  public readonly selectedStatusText: ComputedRef<string> = computed(() => {
    const selected = this.segmentModels.value.find(
      segment => segment.index === this.selectedIndex.value,
    );
    if (!selected) return "未选择线段";

    const typeText =
      selected.type === "arc"
        ? "圆弧"
        : selected.type === "polyline"
          ? "折线"
          : "线段";
    const lengthText = Number.isFinite(selected.length)
      ? selected.length.toFixed(2)
      : "--";
    return `段${selected.index + 1} | ${typeText} | 长度 ${lengthText}${
      selected.error ? ` | ${selected.error}` : ""
    }`;
  });

  /** 更新原始路径段，并清理旧的派生结果。 */
  public setSegments(segments: readonly unknown[]): void {
    this.segments.value = [...segments];
    this.rebuild();
  }

  /** 根据原始路径重新计算标准化模型和校验结果。 */
  public rebuild(): void {
    const models = Path2dDebuggerService.buildSegmentModels(this.segments.value);
    const projection = Path2dDebuggerService.detectProjection(models);
    this.setProjection(projection);
    const projectedModels = Path2dDebuggerService.projectSegmentModels(
      models,
      projection.projectionLabel,
    );
    this.segmentModels.value = projectedModels;
    this.issues.value = Path2dDebuggerService.validatePath(projectedModels);
    if (projection.error) {
      this.issues.value.unshift({
        id: "projection-error",
        level: "error",
        message: projection.error,
      });
    }
  }

  /** 更新当前路径的平面识别结果。 */
  public setProjection(projection: PathProjectionInfo): void {
    this.projectionLabel.value = projection.projectionLabel;
    this.projectionNormal.value = projection.normal ?? null;
    this.projectionError.value = projection.error;
  }

  public setSelectedIndex(index: number): void {
    this.selectedIndex.value = index;
  }

  public setSegmentModels(models: readonly PathSegmentModel[]): void {
    this.segmentModels.value = [...models];
  }

  public setIssues(issues: readonly PathIssue[]): void {
    this.issues.value = [...issues];
  }

  public setShowPoints(value: boolean): void {
    this.showPoints.value = value;
  }

  public setShowLabels(value: boolean): void {
    this.showLabels.value = value;
  }

  public setShowGrid(value: boolean): void {
    this.showGrid.value = value;
  }

  /** 清空当前调试器状态，供切换模型或卸载调试器时使用。 */
  public clear(): void {
    this.segments.value = [];
    this.segmentModels.value = [];
    this.issues.value = [];
    this.selectedIndex.value = -1;
    this.projectionLabel.value = EProjection.nothingness;
    this.projectionNormal.value = null;
    this.projectionError.value = undefined;
  }
}
