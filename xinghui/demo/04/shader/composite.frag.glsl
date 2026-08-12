uniform sampler2D modelColor;
uniform sampler2D modelDepth;
uniform sampler2D terrainDepth;
uniform bool depthOcclusionEnabled;
uniform float depthEpsilon;

varying vec2 vUv;

void main() {
    // 读取已在独立 target 内完成模型自身遮挡的 RGBA 结果。
    vec4 model = texture2D(modelColor, vUv);

    // 没有模型像素时丢弃片元，Mapbox 默认 framebuffer 的已有颜色会被保留。
    if (model.a == 0.0) discard;

    // 深度比较不可用时退回第一版规则：模型整体显示在 terrain 上方。
    if (!depthOcclusionEnabled) {
        gl_FragColor = model;
        return;
    }

    // 读取模型和 terrain 在同一屏幕像素的投影深度；数值越小表示越靠近相机。
    float modelZ = texture2D(modelDepth, vUv).x;
    float terrainZ = texture2D(terrainDepth, vUv).x;

    // 模型在 terrain 前面，或仅略微落后但仍处于容差范围内时，显示模型。
    if (modelZ <= terrainZ + depthEpsilon) {
        gl_FragColor = model;
        return;
    }

    // terrain 明显更近时丢弃模型片元，主 framebuffer 中 terrain 的颜色得以保留。
    discard;
}
