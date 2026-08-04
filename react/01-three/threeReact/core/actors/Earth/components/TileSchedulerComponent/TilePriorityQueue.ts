import { TileTask } from "../../types/TileState";

/** 
 * 瓦片优先队列，用于管理待加载的四叉树瓦片任务。
 */
export class TilePriorityQueue {
    private readonly values: TileTask[] = [];

    /** 获取当前队列中的任务数量*/
    get size() { return this.values.length; }

    /** 将一个任务添加到队列中。 */
    push(task: TileTask) {
        // 新任务先追加到末尾，再向上调整以维持堆顶优先级最高。
        this.values.push(task);
        this.bubbleUp(this.values.length - 1);
    }

    /** 从队列中取出优先级最高的任务。 */
    pop() {
        // 取走堆顶后，让末尾元素下沉恢复二叉堆结构。
        const first = this.values[0];
        const last = this.values.pop();
        if (this.values.length && last) {
            this.values[0] = last;
            this.bubbleDown(0);
        }
        return first;
    }

    /** 向上调整队列中的任务，保持二叉堆结构。 */
    private bubbleUp(index: number) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.values[parent].priority >= this.values[index].priority) return;
            [this.values[parent], this.values[index]] = [this.values[index], this.values[parent]];
            index = parent;
        }
    }

    /** 向下调整队列中的任务，保持二叉堆结构。 */
    private bubbleDown(index: number) {
        while (true) {
            const left = index * 2 + 1;
            const right = left + 1;
            let largest = index;
            if (left < this.values.length && this.values[left].priority > this.values[largest].priority) largest = left;
            if (right < this.values.length && this.values[right].priority > this.values[largest].priority) largest = right;
            if (largest === index) return;
            [this.values[largest], this.values[index]] = [this.values[index], this.values[largest]];
            index = largest;
        }
    }
}
