// 渲染控制器 -- 整个场景的渲染管理器 用于控制场景的渲染和后处理部分 
import * as THREE from 'three';
export class RenderController {
    constructor() {
    }

    renderer= null;
    scene = null;
    composer = null;
    actors = [];
    camera = null;

    render(){
        // 渲染场景
        // 从所有的actor中获取渲染的内容

    }
}