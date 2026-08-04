import { Actor } from "./Actor";
import { RenderController } from "./RenderController";

// 组件
export class Component {
    // 组件的名字 用于标识组件
    name='';
    actor:Actor|null = null;
    controller:RenderController|null = null;
    // 组件挂载到对象上
    attach(actor: Actor) {
        this.actor = actor;
        this.controller = actor.controller;
    }
    begin() {
        // 初始化组件
    }
    tick() {
        // 每帧更新组件状态
    }
    destroy() {

    }
}
