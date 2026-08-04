import * as THREE from "three";
import { Component } from "../../../../system/Component";
import { EarthStore } from "../../store/EarthStore";
import { TileMeshFactory } from "./TileMeshFactory";
import { EarthActor } from "../..";

interface RenderedTile { mesh: THREE.Mesh; remove?: (() => void) }
/** 四叉树瓦片渲染组件。 */
export class TileRenderComponent extends Component {
    name = "tileRender";
    private readonly factory = new TileMeshFactory();
    // 已注册到 RenderController 的 Mesh；TileStore 本身不持有 Three.js 对象。
    private readonly rendered = new Map<string, RenderedTile>();
    store: EarthStore | null = null;    
    begin(){
        // 渲染组件和调度组件读取同一个 EarthStore。
        this.store = (this.actor as EarthActor).store || null;
    }
    tick() {
        if(!this.store){
            return;
        }
        /** 遍历所有四叉树瓦片，渲染已加载的瓦片。 */
        for (const tile of this.store.tileStore.tiles.values()) {
            /** 资源 ready 后只创建一次 Mesh，之后复用注册结果。 */
            if (tile.status !== "ready" || this.rendered.has(tile.id)) continue;
            const mesh = this.factory.create(tile, this.store);
            this.rendered.set(tile.id, { mesh, remove: this.controller?.addRenderable(mesh) });
        }
        for (const [id, rendered] of this.rendered) {
            // 调度器淘汰记录后，在这里注销场景对象并释放 GPU 资源。
            if (this.store.tileStore.tiles.has(id)) continue;
            rendered.remove?.();
            this.factory.dispose(rendered.mesh);
            this.rendered.delete(id);
        }
    }

    destroy() {
        // Actor 卸载时同样必须释放还在缓存中的渲染资源。
        for (const rendered of this.rendered.values()) {
            rendered.remove?.();
            this.factory.dispose(rendered.mesh);
        }
        this.rendered.clear();
    }
}
