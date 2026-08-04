// 渲染控制器 -- 整个场景的渲染管理器 用于控制场景的渲染和后处理部分 
import * as THREE from "three";
import { Actor } from './Actor';
export class RenderController {
    constructor() {
        this.addEffectPass(this.renderPass);
    }
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer= new THREE.WebGLRenderer({antialias: true});
    scene = new THREE.Scene();
    composer = new THREE.EffectComposer(this.renderer);
    actors:Actor[] = [];
    renderPass = new THREE.RenderPass(this.scene, this.camera); 
    addRenderable(object:THREE.Object3D){
        this.scene.add(object);
        return ()=>{
            this.scene.remove(object);
        }
    }
    //按照优先级添加后处理pass
    addEffectPass(pass:THREE.Pass, priority=0){
        this.composer?.addPass(pass, priority);
        return ()=>{
            this.composer?.removePass(pass);
        }
    }
    addActor(actor:Actor){
        if(!actor){
            return;
        }
        this.actors.push(actor);
        actor.begin();
        return ()=>{
            const index = this.actors.indexOf(actor);
            if (index !== -1) {
                this.actors.splice(index, 1);
                actor.destroy();
            }
        }
    }
    render(){
        //处理actor副作用 1. 调用tick 2. 收集需要渲染的对象和后处理pass
        this.actors.forEach(actor => {
            actor.tick();
        });
        this.composer?.render();
    }
}