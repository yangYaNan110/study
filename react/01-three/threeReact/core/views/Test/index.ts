import { RenderController } from "../../system/RenderController";

// 测试视图
class TestView{
    name='testView';
    renderController:RenderController=new RenderController();;
    constructor(){
        //开始构建一个一个actor加到渲染控制器里 

        this.render();
    }

    render(){
        requestAnimationFrame(this.render.bind(this));
        this.renderController.render();
    }
}