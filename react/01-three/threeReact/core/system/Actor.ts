import { Component } from "./Component";

// 场景中的对象
export class Actor {
    // 组件集合 用于存储对象的组件
    components: Component[] = [];
    //actor的名字 用于标识actor对象
    name='';

    addComponent(component: Component) {
        if(!component){
            return;
        }
        this.components.push(component);
        component.attach(this);
        component.begin();
        return ()=>{
            const index = this.components.indexOf(component);
            if (index !== -1) {
                this.components.splice(index, 1);
                component.destroy();
            }
        }
    }
    
    begin() {
       
    }
    tick() {
        // 每帧更新对象状态
        this.components.forEach(component => {
            component.tick();
        });
    }
    // 销毁对象
    destroy(){

    }
}
