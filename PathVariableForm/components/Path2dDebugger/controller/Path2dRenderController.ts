import { bus } from "@/utils/bus";
import { PixiRenderer } from "@render2d/editor";
import { Container } from "pixi.js";

export interface ViewBounds {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/** 画布被 DOM 覆盖层占用的边距，用于将路径适配到实际可视区域。 */
export interface ViewInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

// 渲染控制器 能添加渲染片段 以及控制渲染
export class RenderController {
  constructor() {}
  //   画布
  canvas: HTMLCanvasElement | null = null;
  //渲染容器
  renderContainer: HTMLElement | null = null;
  //渲染器
  renderer: PixiRenderer | null = null;

  //   初始化
  async init(renderContainer: HTMLElement): Promise<void> {
    this.renderContainer = renderContainer;
    this.renderer = new PixiRenderer();
    console.log("pixiRenderer::::", this.renderer);
    await this.renderer.initializeAsync(this.renderContainer);
    this.canvas = this.renderer.getCanvas();
    bus.emit("onRenderControllerInitEnd");
  }

  createLayer(zIndex: number): Container {
    if (!this.renderer) {
      throw new Error("RenderController is not initialized");
    }

    const root = this.renderer.getRoot();
    const layer = new Container();
    layer.zIndex = zIndex;
    root?.addChild(layer);
    return layer;
  }
  clearLayer(layer: Container): void {
    layer.removeChildren().forEach(child => child.destroy({ children: true }));
  }

  removeLayer(layer: Container): void {
    layer.removeFromParent();
    layer.destroy({ children: true });
  }

  /** 将 Pixi 画布尺寸同步到容器的 CSS 尺寸和设备像素比。 */
  resizeToContainer(): void {
    if (!this.renderer || !this.renderContainer) return;

    const rect = this.renderContainer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    this.renderer.resize(Math.round(rect.width * dpr), Math.round(rect.height * dpr));
  }

  /** 开关 Pixi 内置相机，滚轮缩放和拖拽由 CameraController 处理。 */
  /** 将世界坐标原点移动到画布中心，作为初始化时的默认视角。 */
  centerRoot(): void {
    if (!this.renderer || !this.renderContainer) return;

    const rect = this.renderContainer.getBoundingClientRect();
    const root = this.renderer.getRoot();
    root.position.set(rect.width / 2, rect.height / 2);
  }

  /** 根据路径包围盒自动计算缩放比例，并将路径适配到画布中心。 */
  fitView(bounds: ViewBounds, insets: ViewInsets = {}): void {
    if (!this.renderer || !this.renderContainer) return;

    const rect = this.renderContainer.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return;

    const leftInset = insets.left ?? 0;
    const rightInset = insets.right ?? 0;
    const topInset = insets.top ?? 0;
    const bottomInset = insets.bottom ?? 0;
    const viewportWidth = Math.max(rect.width - leftInset - rightInset, 1);
    const viewportHeight = Math.max(rect.height - topInset - bottomInset, 1);
    const paddingX = Math.max(28, viewportWidth * 0.12);
    const paddingY = Math.max(28, viewportHeight * 0.08);
    const availableWidth = Math.max(viewportWidth - paddingX * 2, 1);
    const availableHeight = Math.max(viewportHeight - paddingY * 2, 1);
    const scale = Math.max(
      0.01,
      Math.min(80, Math.min(availableWidth / bounds.width, availableHeight / bounds.height)),
    );

    const root = this.renderer.getRoot();
    root.scale.set(scale);
    // 保持与旧版 fitView 一致：将路径包围盒中心放到画布中心。
    root.position.set(
      leftInset + viewportWidth / 2 - bounds.centerX * scale,
      topInset + viewportHeight / 2 - bounds.centerY * scale,
    );
  }

  /** 恢复 1:1 视图，并将目标包围盒定位到画布中心。 */
  resetView(bounds: ViewBounds | null = null, insets: ViewInsets = {}): void {
    if (!this.renderer || !this.renderContainer) return;

    const rect = this.renderContainer.getBoundingClientRect();
    const root = this.renderer.getRoot();
    const leftInset = insets.left ?? 0;
    const rightInset = insets.right ?? 0;
    const topInset = insets.top ?? 0;
    const bottomInset = insets.bottom ?? 0;
    const viewportWidth = Math.max(rect.width - leftInset - rightInset, 1);
    const viewportHeight = Math.max(rect.height - topInset - bottomInset, 1);
    root.scale.set(1);

    if (!bounds) {
      root.position.set(leftInset + viewportWidth / 2, topInset + viewportHeight / 2);
      return;
    }

    root.position.set(leftInset + viewportWidth / 2 - bounds.centerX, topInset + viewportHeight / 2 - bounds.centerY);
  }

  /** 保持当前缩放比例，将目标包围盒移动到画布中心。 */
  focusView(bounds: ViewBounds, insets: ViewInsets = {}): void {
    if (!this.renderer || !this.renderContainer) return;

    const rect = this.renderContainer.getBoundingClientRect();
    const root = this.renderer.getRoot();
    const scale = Number.isFinite(root.scale.x) ? root.scale.x : 1;
    const leftInset = insets.left ?? 0;
    const rightInset = insets.right ?? 0;
    const topInset = insets.top ?? 0;
    const bottomInset = insets.bottom ?? 0;
    const viewportWidth = Math.max(rect.width - leftInset - rightInset, 1);
    const viewportHeight = Math.max(rect.height - topInset - bottomInset, 1);

    root.position.set(
      leftInset + viewportWidth / 2 - bounds.centerX * scale,
      topInset + viewportHeight / 2 - bounds.centerY * scale,
    );
  }

  setCameraEnabled(enabled: boolean): void {
    this.renderer?.getCamera().setEnabled(enabled);
  }

  unmount(): void {
    this.renderer?.destroy();
    this.renderer = null;
    this.canvas = null;
    this.renderContainer = null;
  }
}
