import * as THREE from "three";
import { Component } from "../../../../system/Component";
import { EarthStore } from "../../store/EarthStore";
import { TileLoader } from "./TileLoader";
import { TilePriorityQueue } from "./TilePriorityQueue";
import { TileSelector } from "./TileSelector";
import { EarthActor } from "../..";

export class TileSchedulerComponent extends Component {
    name = "tileScheduler";
    private readonly selector = new TileSelector();
    private readonly queue = new TilePriorityQueue();
    private readonly loader = new TileLoader();
    // 在 begin 阶段从所属 EarthActor 获取；destroy 后可清空以解除引用。
    store : EarthStore|null = null;
    camera : THREE.Camera|null = null;
    begin() {
        // Component 被 Actor 挂载后，才能安全读取 Actor 专属的 Store。
        this.store = (this.actor as EarthActor).store || null;
        this.camera = this.actor?.controller?.camera || null;
    }

    tick() {
       // 取局部引用后做空值守卫；回调中使用局部变量可避免可空字段重新变宽。
       const store = this.store;
    const camera = this.camera;

    if (!store || !camera) return;
        store.frame++;
        // 选择本帧需要显示的瓦片，并将该集合重新计算一遍。
        const selected = this.selector.select(store, this.camera);
        const desired = store.tileStore.desired;
        desired.clear();

        selected.forEach(({ key, priority }) => {
            const record = store.tileStore.ensure(key);
            record.priority = priority;
            record.lastUsedFrame = store.frame;
            desired.add(record.id);
            if (record.status === "idle" || record.status === "error") {
                // 只将尚未请求或失败的瓦片放入队列，避免重复排队。
                record.status = "queued";
                this.queue.push({ id: record.id, key, priority });
            }
        });

        this.startQueuedRequests();
        this.evictUnusedTiles();
    }

    private startQueuedRequests() {
        if (!this.store) return;
        let loading = [...this.store.tileStore.tiles.values()].filter(tile => tile.status === "loading").length;
        while (loading < this.store.config.maxConcurrentRequests && this.queue.size) {
            const task = this.queue.pop();
            if (!task) break;
            const record = this.store.tileStore.tiles.get(task.id);
            if (!record || record.status !== "queued") continue;
            record.status = "loading";
            loading++;
            this.loader.load(task.key, this.store.config.source)
                // 异步结果只更新 TileStore；渲染组件在后续 tick 中观察 ready 状态。
                .then(url => { record.textureUrl = url; record.status = "ready"; })
                .catch(error => { record.error = error instanceof Error ? error : new Error(String(error)); record.status = "error"; });
        }
    }

    private evictUnusedTiles() {
        const store = this.store;
        if (!store) return;
        const removable = [...store.tileStore.tiles.values()]
            .filter(tile => !store.tileStore.desired.has(tile.id) && tile.status !== "loading")
            .sort((a, b) => a.lastUsedFrame - b.lastUsedFrame);
        const overflow = store.tileStore.tiles.size - store.config.maxCachedTiles;
        // 只淘汰非本帧所需且不在加载中的最旧瓦片，形成简单的 LRU 策略。
        removable.slice(0, Math.max(0, overflow)).forEach(tile => {
            tile.status = "evicted";
            store.tileStore.tiles.delete(tile.id);
        });
    }
    destroy(){
    }
}
