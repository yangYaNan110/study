uniform sampler2D modelColor;
uniform sampler2D modelDepth;
uniform sampler2D terrainDepth;
uniform bool depthOcclusionEnabled;
uniform float depthEpsilon;

varying vec2 vUv;

void main() {
    // 读取已在独立 target 内完成模型自身遮挡的 RGBA 结果。
    vec4 model = texture2D(modelColor, vUv);
    // gl_FragColor = vec4(vec3(model.a), 1.0);
    // if(model.a < 1.0 && model.a > 0.0) {
    //     gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    //     return;
    // }
    //return;
    // 没有模型像素时丢弃片元，Mapbox 默认 framebuffer 的已有颜色会被保留。
    if(model.a == 0.0)
        discard;

    // 深度比较不可用时退回第一版规则：模型整体显示在 terrain 上方。
    if(!depthOcclusionEnabled) {
        gl_FragColor = model;
        // 与模型优先分支保持完全相同的最终颜色输出转换。
        // 按 renderer.toneMapping 与 toneMappingExposure 将 HDR/线性光照结果映射到显示范围。
        #include <tonemapping_fragment>

        // 将线性色彩编码为 renderer.outputColorSpace（默认是 sRGB），使屏幕显示亮度与直接渲染一致。
        #include <colorspace_fragment>
        return;
    }

    // 读取模型和 terrain 在同一屏幕像素的投影深度；数值越小表示越靠近相机。
    float modelZ = texture2D(modelDepth, vUv).x;
    float terrainZ = texture2D(terrainDepth, vUv).x;
    //如果模型深度小于地形深度的阈值 就按模型显示 解决闪面 
    if(modelZ <= terrainZ + depthEpsilon) {
        gl_FragColor = model;
        // 与模型优先分支保持完全相同的最终颜色输出转换。
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        return;
    }
    //如果是边缘部分  虽然深度相差可能比较大 但是因为直接使用底图颜色会造成锯齿 因为这可能是交互的地方
    if(model.a < 1.0) {
        float depthDiff = modelZ - terrainZ;
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        // #include <tonemapping_fragment>
        // #include <colorspace_fragment>
        return;
    }
    //================测试代码 验证是否与锯齿有关==================
    // if(model.a >= 1.0) {
    //     gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    //     // #include <tonemapping_fragment>
    //     // #include <colorspace_fragment>
    //     return;
    // }
    // terrain 明显更近时丢弃模型片元，主 framebuffer 中 terrain 的颜色得以保留。
    discard;
}
