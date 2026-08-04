// 渲染控制器 -- 整个场景的渲染管理器 用于控制场景的渲染和后处理部分 
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { Pass } from "three/addons/postprocessing/Pass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { Actor } from './Actor';
export class RenderController {
    /**
     * EffectComposer 只认识“顺序”，不认识优先级。
     * 这里保存注册信息，并在变更后把它转换成 composer 中的实际顺序。
     */
    private readonly effectPasses: Array<{ pass: Pass; priority: number; order: number }> = [];
    private nextPassOrder = 0;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer:THREE.WebGLRenderer | null= null;
    scene = new THREE.Scene();
    composer:EffectComposer | null= null;
    actors:Actor[] = [];
    renderPass = new RenderPass(this.scene, this.camera); 

    init(options){

        const canvas = options.canvas;
        if(!canvas){
            console.error("初始化失败 ... canvas必须传入");
            
            return;
        }
        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas});
        this.composer = new EffectComposer(this.renderer);
        // RenderPass 必须最先执行，后续 Pass 才能处理它的输出。
        this.addEffectPass(this.renderPass, Number.NEGATIVE_INFINITY);
    }
    addRenderable(object:THREE.Object3D){
        this.scene.add(object);
        return ()=>{
            this.scene.remove(object);
        }
    }
    /**
     * 注册后处理 Pass。数值越小，执行越靠前；相同优先级保持注册顺序。
     * 即使在 init 之前调用也有效，composer 创建后会按注册表同步。
     */
    addEffectPass(pass:Pass, priority=0){
        const registered = this.effectPasses.find(item => item.pass === pass);

        if (registered) {
            // 同一个 Pass 不重复加入 composer，只更新它的排序权重。
            registered.priority = priority;
        } else {
            this.effectPasses.push({ pass, priority, order: this.nextPassOrder++ });
        }

        this.syncEffectPasses();

        return ()=>{
            const index = this.effectPasses.findIndex(item => item.pass === pass);
            if (index === -1) return;
            this.effectPasses.splice(index, 1);
            this.syncEffectPasses();
        }
    }

    /** 将本类定义的 priority 排序同步为 EffectComposer 的实际 Pass 顺序。 */
    private syncEffectPasses(){
        if (!this.composer) return;

        // removePass 不会 dispose Pass，因此重新排序不会销毁后处理资源。
        [...this.composer.passes].forEach(pass => this.composer?.removePass(pass));

        this.effectPasses
            .slice()
            .sort((a, b) => a.priority - b.priority || a.order - b.order)
            .forEach(({ pass }) => this.composer?.addPass(pass));
    }
    addActor(actor:Actor){
        if(!actor){
            return;
        }
        this.actors.push(actor);
        actor.attach(this);
        actor.begin();
        return ()=>{
            const index = this.actors.indexOf(actor);
            if (index !== -1) {
                this.actors.splice(index, 1);
                actor.destroy();
            }
        }
    }
    getActorByName(name:string){
        return this.actors.find(actor=>actor.name===name);
    }
    render(){
        //处理actor副作用 1. 调用tick 2. 收集需要渲染的对象和后处理pass
        this.actors.forEach(actor => {
            actor.tick();
        });
        this.composer?.render();
    }
    destroy(){ 
        
    }
}
