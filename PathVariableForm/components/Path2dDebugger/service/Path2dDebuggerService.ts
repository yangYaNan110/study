import { Vector3 as ThreeVector3 } from "three";
import { ArcSegment } from "@/three/src/object/bim/math/ArcSegment";
import { LineSegment } from "@/three/src/object/bim/math/LineSegment";
import { PolylineSegment } from "@/three/src/object/bim/math/PolylineSegment";
import type { ExpressionContext } from "@/three/src/object/bim/expression/Expression";
import { ExpressionUtil } from "@/three/src/interface/modelEditor/util/ExpressionUtil";
import { EditorDataUtil } from "@/three/src/interface/modelEditor/util/EditorDataUtil";
import { EProjection } from "@/three/src/object/bim/variable/PathInfo";
import type {
  PathIssue,
  PathPoint2d,
  PathPoint3d,
  PathSegmentModel,
  ProjectedBounds,
} from "../store";

type DynamicObject = Record<string, unknown>;

export interface PathLabelPlacement {
  point: PathPoint2d;
  normal: PathPoint2d;
}

/** 路径平面识别结果，供 Store 和调试器界面复用。 */
export interface PathProjectionInfo {
  projectionLabel: EProjection;
  normal?: PathPoint3d;
  error?: string;
}

/** Path2D 调试器的业务计算服务，不持有 Vue 状态和 Pixi 对象。 */
export class Path2dDebuggerService {
  public static getProjectedBounds(models: readonly PathSegmentModel[]): ProjectedBounds {
    const points = models.flatMap(model => model.projectedPoints);
    return this.getPointsBounds(points);
  }

  /** 根据二维点集合计算包围盒，供视图适配和定位复用。 */
  public static getPointsBounds(points: readonly PathPoint2d[]): ProjectedBounds {
    const finitePoints = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

    if (!finitePoints.length) {
      return {
        minX: -100,
        maxX: 100,
        minY: -100,
        maxY: 100,
        width: 200,
        height: 200,
        centerX: 0,
        centerY: 0,
      };
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

  /** 按旧版规则计算 1:1 视图应该定位的包围盒。 */
  public static getResetViewBounds(
    models: readonly PathSegmentModel[],
    selectedIndex: number,
    canvasWidth: number,
    canvasHeight: number,
    scale = 1,
  ): ProjectedBounds {
    const selected = models.find(model => model.index === selectedIndex);
    if (selected) {
      return this.getPointsBounds(selected.projectedPoints);
    }

    const pathBounds = this.getProjectedBounds(models);
    const fitsPath =
      pathBounds.width * scale <= canvasWidth * 0.92 &&
      pathBounds.height * scale <= canvasHeight * 0.92;

    if (fitsPath) return pathBounds;

    const firstSegment = models[0];
    return this.getPointsBounds(firstSegment?.projectedPoints || []);
  }

  /** 计算折线中点及其朝向外侧的标签位置。 */
  public static getPolylineLabelPlacement(
    points: readonly PathPoint2d[],
  ): PathLabelPlacement | null {
    const finitePoints = points.filter(
      point => Number.isFinite(point.x) && Number.isFinite(point.y),
    );
    if (!finitePoints.length) return null;
    if (finitePoints.length === 1) {
      return { point: finitePoints[0], normal: { x: 0, y: -1 } };
    }

    const totalLength = this.getPolylineLength(finitePoints);
    if (totalLength <= 0) {
      return { point: finitePoints[0], normal: { x: 0, y: -1 } };
    }

    const targetLength = totalLength / 2;
    let walkedLength = 0;

    for (let index = 1; index < finitePoints.length; index += 1) {
      const start = finitePoints[index - 1];
      const end = finitePoints[index];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length <= 0) continue;

      if (walkedLength + length >= targetLength) {
        const ratio = (targetLength - walkedLength) / length;
        return {
          point: {
            x: start.x + dx * ratio,
            y: start.y + dy * ratio,
          },
          normal: this.getPreferredNormal(dx / length, dy / length),
        };
      }

      walkedLength += length;
    }

    return {
      point: finitePoints[finitePoints.length - 1],
      normal: { x: 0, y: -1 },
    };
  }

  public static getPolylineLength(points: readonly PathPoint2d[]): number {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      total += Math.sqrt(
        (current.x - previous.x) ** 2 + (current.y - previous.y) ** 2,
      );
    }
    return total;
  }

  public static getPreferredNormal(tangentX: number, tangentY: number): PathPoint2d {
    let normal = { x: -tangentY, y: tangentX };
    if (normal.y > 0 || (Math.abs(normal.y) < 0.001 && normal.x < 0)) {
      normal = { x: -normal.x, y: -normal.y };
    }
    return normal;
  }

  public static buildSegmentModels(segments: readonly unknown[]): PathSegmentModel[] {
    const context = this.getExpressionContext();
    return segments
      .filter(segment => this.isVisibleSegment(segment))
      .map((segment, index) => this.createSegmentModel(segment, index, context))
      .filter((model): model is PathSegmentModel => model !== null);
  }

  /** 根据三维路径点识别标准投影平面或斜面状态。 */
  public static detectProjection(
    models: readonly PathSegmentModel[],
  ): PathProjectionInfo {
    const points = this.getFiniteUniquePoints(
      models.flatMap(model => model.points),
    );
    if (points.length < 3) {
      return {
        projectionLabel: EProjection.nothingness,
        error: "投影面未知：有效点不足三个",
      };
    }

    const origin = points[0];
    let normal: PathPoint3d | undefined;
    const crossTolerance = 1e-12;

    for (let firstIndex = 1; firstIndex < points.length - 1 && !normal; firstIndex += 1) {
      const firstDirection = this.subtract3(points[firstIndex], origin);
      for (let secondIndex = firstIndex + 1; secondIndex < points.length; secondIndex += 1) {
        const candidate = this.cross3(
          firstDirection,
          this.subtract3(points[secondIndex], origin),
        );
        const length = this.length3(candidate);
        if (length > crossTolerance) {
          normal = {
            x: candidate.x / length,
            y: candidate.y / length,
            z: candidate.z / length,
          };
          break;
        }
      }
    }

    if (!normal) {
      return {
        projectionLabel: EProjection.nothingness,
        error: "投影面未知：路径点共线，法线不唯一",
      };
    }

    const planeTolerance = 1e-6;
    for (const point of points) {
      const distanceToPlane = Math.abs(this.dot3(this.subtract3(point, origin), normal));
      if (distanceToPlane > planeTolerance) {
        return {
          projectionLabel: EProjection.nothingness,
          normal,
          error: "投影面未知：路径点不共面",
        };
      }
    }

    return {
      projectionLabel: this.getProjectionLabel(normal),
      normal,
    };
  }

  /** 使用指定标准投影面重新生成所有线段的二维点。 */
  public static projectSegmentModels(
    models: readonly PathSegmentModel[],
    projection: EProjection,
  ): PathSegmentModel[] {
    return models.map(model => ({
      ...model,
      projectedPoints: model.points.map(point => this.projectPoint(point, projection)),
      projectedCenter: model.center
        ? this.projectPoint(model.center, projection)
        : undefined,
    }));
  }

  public static validatePath(models: readonly PathSegmentModel[]): PathIssue[] {
    const issues: PathIssue[] = [];
    const tolerance = 0.01;

    for (const segment of models) {
      if (!segment.valid || segment.error) {
        issues.push({
          id: "invalid-" + segment.index,
          level: "error",
          message: "段 " + (segment.index + 1) + " " + (segment.error || "参数非法"),
          segmentIndex: segment.index,
        });
      }
    }

    for (let index = 0; index < models.length - 1; index += 1) {
      const distance = this.distance3(models[index].end, models[index + 1].start);
      if (distance > tolerance) {
        issues.push({
          id: "gap-" + index + "-" + (index + 1),
          level: "warning",
          message: "段 " + (index + 1) + " -> " + (index + 2) + " 不连续，距离 " + distance.toFixed(2),
          segmentIndex: index + 1,
        });
      }
    }

    if (models.length > 1) {
      const last = models[models.length - 1];
      const closeDistance = this.distance3(last.end, models[0].start);
      if (closeDistance > tolerance) {
        issues.push({
          id: "not-closed",
          level: "warning",
          message: "路径未闭合，首尾距离 " + closeDistance.toFixed(2),
          segmentIndex: last.index,
        });
      }
    }
    return issues;
  }

  private static createSegmentModel(
    source: unknown,
    index: number,
    context?: ExpressionContext,
  ): PathSegmentModel | null {
    try {
      const type = this.getSegmentType(source);
      if (source instanceof LineSegment || type === "line") {
        return this.createLineModel(source, index, context);
      }
      if (source instanceof ArcSegment || type === "arc") {
        return this.createArcModel(this.createArcSegmentForPreview(source), index, context);
      }
      if (source instanceof PolylineSegment || type === "polyline") {
        return this.createPolylineModel(source, index, context);
      }
    } catch (error) {
      const object = this.toObject(source);
      const start = this.readPoint(object.startPoint, context);
      const end = this.readPoint(object.endPoint, context);
      return {
        index,
        type: String(object.type || "unknown"),
        start,
        end,
        points: [start, end],
        projectedPoints: [this.projectPoint(start), this.projectPoint(end)],
        length: this.distance3(start, end),
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
    return null;
  }

  private static createLineModel(source: unknown, index: number, context?: ExpressionContext): PathSegmentModel {
    const object = this.toObject(source);
    const start = this.readPoint(object.startPoint, context);
    const end = this.readPoint(object.endPoint, context);
    const length = this.distance3(start, end);
    const points = [start, end];
    return {
      index,
      type: "line",
      start,
      end,
      points,
      projectedPoints: points.map(point => this.projectPoint(point)),
      length,
      valid: length > 0.01,
      error: length <= 0.01 ? "零长度线段" : undefined,
    };
  }

  private static createArcModel(segment: ArcSegment, index: number, context?: ExpressionContext): PathSegmentModel {
    const start = this.readPoint(segment.startPoint, context);
    const end = this.readPoint(segment.endPoint, context);
    const radius = this.readNumber(segment.radius, context);
    const count = this.clamp(Math.round(this.readNumber(segment.count, context) || 24), 8, 128);
    segment.radius.value = radius;
    segment.count.value = count;
    if (!Number.isFinite(radius) || radius <= 0) throw new Error("圆弧半径非法");

    // 基础圆形模板已携带完整圆弧几何，优先保留其法线和角度，避免 XY/YZ 平面被固定 Y 法线覆盖。
    const hasExplicitGeometry =
      Number.isFinite(segment.normal.x) &&
      Number.isFinite(segment.normal.y) &&
      Number.isFinite(segment.normal.z) &&
      segment.normal.length() > 1e-9 &&
      Number.isFinite(segment.startAngle) &&
      Number.isFinite(segment.endAngle) &&
      Math.abs(segment.endAngle - segment.startAngle) > 1e-9;

    if (!hasExplicitGeometry) {
      const planeNormal = EditorDataUtil.getPlaneNormalByPoints(start, end, new ThreeVector3(0, 1, 0));
      const bulgeDirection = EditorDataUtil.getArcDirection(
        { startPoint: start, endPoint: end, arcDirection: segment.arcDirection },
        planeNormal,
      );
      segment.createFromPoints(
        new ThreeVector3(start.x, start.y, start.z),
        new ThreeVector3(end.x, end.y, end.z),
        radius,
        bulgeDirection,
        true,
      );
    }

    const points = segment.samplePoints(count).map(point => ({ x: point.x, y: point.y, z: point.z }));
    const center = { x: segment.center.x, y: segment.center.y, z: segment.center.z };
    const valid = segment.valid();
    return {
      index,
      type: "arc",
      start,
      end,
      points,
      projectedPoints: points.map(point => this.projectPoint(point)),
      center,
      projectedCenter: this.projectPoint(center),
      radius,
      length: Number.isFinite(segment.getLength()) ? segment.getLength() : this.distance3(start, end),
      valid,
      error: valid ? undefined : "圆弧参数非法",
    };
  }

  private static createPolylineModel(source: unknown, index: number, context?: ExpressionContext): PathSegmentModel {
    const points = this.getPolylinePoints(source, context);
    const start = points[0] || { x: 0, y: 0, z: 0 };
    const end = points[points.length - 1] || start;
    const length = points.reduce(
      (sum, point, pointIndex) => pointIndex === 0 ? sum : sum + this.distance3(points[pointIndex - 1], point),
      0,
    );
    return {
      index,
      type: "polyline",
      start,
      end,
      points,
      projectedPoints: points.map(point => this.projectPoint(point)),
      length,
      valid: points.length >= 2 && length > 0.01,
      error: points.length < 2 || length <= 0.01 ? "折线点数不足" : undefined,
    };
  }

  private static getPolylinePoints(source: unknown, context?: ExpressionContext): PathPoint3d[] {
    const object = this.toObject(source);
    if (Array.isArray(object.points) && object.points.length) {
      return object.points.map(point => this.readPoint(point, context));
    }
    if (!Array.isArray(object.segments)) return [];
    const points: PathPoint3d[] = [];
    for (let index = 0; index < object.segments.length; index += 1) {
      const segment = this.toObject(object.segments[index]);
      if (index === 0) points.push(this.readPoint(segment.startPoint, context));
      points.push(this.readPoint(segment.endPoint, context));
    }
    return points;
  }

  private static createArcSegmentForPreview(source: unknown): ArcSegment {
    const object = this.toObject(source);
    return new ArcSegment({
      id: String(object.id ?? ""),
      type: "arc",
      center: this.readVectorOption(object.center),
      normal: this.readVectorOption(object.normal),
      startPoint: this.readPointOption(object.startPoint),
      endPoint: this.readPointOption(object.endPoint),
      arcDirection: Boolean(object.arcDirection),
      radius: this.readExpressionText(object.radius, "1"),
      startAngle: String(object.startAngle ?? 0),
      endAngle: String(object.endAngle ?? 0),
      count: this.readExpressionText(object.count, "24"),
    });
  }

  private static getSegmentType(source: unknown): string {
    const object = this.toObject(source);
    const type = String(object.__type || object.type || "").toLowerCase();
    if (type === "linesegment") return "line";
    if (type === "arcsegment") return "arc";
    if (type === "polylinesegment") return "polyline";
    if (!type && (Array.isArray(object.points) || Array.isArray(object.segments))) return "polyline";
    return type;
  }

  private static getExpressionContext(): ExpressionContext | undefined {
    try {
      return ExpressionUtil.getCurrentContext();
    } catch {
      return undefined;
    }
  }

  private static isVisibleSegment(source: unknown): boolean {
    if (!source || typeof source !== "object") return false;
    return !this.toObject(source).isMergeRow;
  }

  private static readPoint(source: unknown, context?: ExpressionContext): PathPoint3d {
    const object = this.toObject(source);
    return {
      x: this.readNumber(object.x, context),
      y: this.readNumber(object.y, context),
      z: this.readNumber(object.z, context),
    };
  }

  private static readPointOption(source: unknown): DynamicObject {
    const object = this.toObject(source);
    return {
      x: this.readExpressionText(object.x, "0"),
      y: this.readExpressionText(object.y, "0"),
      z: this.readExpressionText(object.z, "0"),
    };
  }

  private static readVectorOption(source: unknown): DynamicObject | undefined {
    if (!source || typeof source !== "object") return undefined;
    const object = this.toObject(source);
    return { x: String(object.x ?? 0), y: String(object.y ?? 0), z: String(object.z ?? 0) };
  }

  private static readExpressionText(source: unknown, fallback = "0"): string {
    if (source && typeof source === "object") {
      const object = this.toObject(source);
      if ("content" in object) return String(object.content ?? fallback);
      if ("value" in object) return String(object.value ?? fallback);
    }
    return String(source ?? fallback);
  }

  private static readNumber(source: unknown, context?: ExpressionContext): number {
    const content = this.readExpressionText(source, "");
    if (Number.isFinite(Number(content))) return Number(content);
    if (context && content) {
      try {
        const result = ExpressionUtil.calculateResult(content, context);
        if (Number.isFinite(Number(result))) return Number(result);
      } catch {
        // 表达式暂时无法计算时返回 NaN，由上层模型标记为非法。
      }
    }
    const object = this.toObject(source);
    return Number.isFinite(Number(object.value)) ? Number(object.value) : Number.NaN;
  }

  /** 将三维点转换为指定标准平面的二维坐标；xyz 暂时沿用 XZ 兼容显示。 */
  private static projectPoint(
    point: PathPoint3d,
    projection: EProjection = EProjection.xz,
  ): PathPoint2d {
    if (projection === EProjection.xy) {
      return { x: point.x, y: point.y };
    }
    if (projection === EProjection.yz) {
      return { x: point.y, y: point.z };
    }
    return { x: point.x, y: point.z };
  }

  private static getProjectionLabel(normal: PathPoint3d): EProjection {
    const tolerance = 1e-6;
    const x = Math.abs(normal.x);
    const y = Math.abs(normal.y);
    const z = Math.abs(normal.z);

    if (x <= tolerance && y <= tolerance) return EProjection.xy;
    if (x <= tolerance && z <= tolerance) return EProjection.xz;
    if (y <= tolerance && z <= tolerance) return EProjection.yz;
    return EProjection.xyz;
  }

  private static getFiniteUniquePoints(points: readonly PathPoint3d[]): PathPoint3d[] {
    const uniquePoints: PathPoint3d[] = [];
    const tolerance = 1e-7;
    for (const point of points) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
        continue;
      }
      if (
        uniquePoints.some(existing => this.distance3(existing, point) <= tolerance)
      ) {
        continue;
      }
      uniquePoints.push(point);
    }
    return uniquePoints;
  }

  private static subtract3(a: PathPoint3d, b: PathPoint3d): PathPoint3d {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private static cross3(a: PathPoint3d, b: PathPoint3d): PathPoint3d {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  private static dot3(a: PathPoint3d, b: PathPoint3d): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private static length3(point: PathPoint3d): number {
    return Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2);
  }

  private static distance3(a: PathPoint3d, b: PathPoint3d): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private static toObject(source: unknown): DynamicObject {
    return source && typeof source === "object" ? source as DynamicObject : {};
  }
}
