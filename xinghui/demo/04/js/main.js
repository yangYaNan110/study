// 导入 Three.js 核心库，提供场景、相机、材质、矩阵和渲染目标等能力。
import * as THREE from 'three';
// 导入 OBJ 加载器，用来读取 ECEF 坐标的 OBJ 模型文件。
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// 导入后处理调度器，用独立的离屏渲染目标保存模型颜色和深度。
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// 导入基础渲染 Pass，负责将模型场景渲染到 composer 的离屏目标。
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// 导入 shader Pass，当前只复制模型颜色，后续可在这里扩展深度比较。
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// 导入项目内保存的 Mapbox access token。
import { MAPBOX_TOKEN } from '../../public/token.js';

// 并行读取最终合成所需的顶点 shader 与片元 shader 文本。
const [compositeVertexShader, compositeFragmentShader] = await Promise.all([
    // 读取全屏 Quad 的顶点 shader；import.meta.url 使路径相对当前 JS 文件稳定解析。
    fetch(new URL('../shader/composite.vert.glsl', import.meta.url)).then((response) => response.text()),
    // 读取最终 alpha 合成的片元 shader；后续可在该文件中接入 terrain depth 比较。
    fetch(new URL('../shader/composite.frag.glsl', import.meta.url)).then((response) => response.text()),
]);

// 定义 OBJ 元数据对应的模型原点经纬度，顺序为 [lng, lat]。
const MODEL_ORIGIN = [-95.92740622846694, 41.11305358174491];
// 定义 OBJ 局部 ECEF 坐标转换为绝对 ECEF 坐标时使用的米单位偏移。
const ECEF_OFFSET = new THREE.Vector3(-496845.585, -4787606.399, 4171388.400);
// 定义相对本 HTML 的 OBJ 文件地址。
const MODEL_URL = '../落汤鸡/目标三维模型-精模/目标1三维模型-精模_ecef.obj';
// 定义本地 Mapbox raster-dem source 的唯一 ID。
const DEM_SOURCE_ID = 'local-model-dem';
// 定义本地 DOM raster source 的唯一 ID。
const IMAGE_SOURCE_ID = 'image-source';
// 定义本地 DOM raster layer 的唯一 ID。
const IMAGE_LAYER_ID = 'image-layer';

// 保存可变的模型定位参数；当前高度是模型整体的额外高度偏移，单位为米。
const modelPosition = { lng: MODEL_ORIGIN[0], lat: MODEL_ORIGIN[1], altitude: 0 };
// 保存可变的模型欧拉旋转；当前初始化为不旋转。
const modelRotation = new THREE.Euler(0, 0, 0);

// 保存 Mapbox map 实例，样式加载后赋值。
let map;
// 保存只包含灯光和 OBJ 的 Three 场景。
let scene;
// 保存使用 Mapbox 投影矩阵的 Three 相机。
let modelCamera;
// 保存复用 Mapbox canvas / WebGL context 的 Three 渲染器。
let renderer;
// 保存负责模型离屏渲染的 EffectComposer。
let composer;
// 保存从 Mapbox 默认 framebuffer 复制出的 terrain 深度 target。
let terrainDepthTarget;
// 保存最终将模型纹理叠加回 Mapbox 默认 framebuffer 的场景。
let compositeScene;
// 保存合成全屏 Quad 使用的无透视相机。
let compositeCamera;
// 保存合成全屏 Quad 使用的 ShaderMaterial。
let compositeMaterial;
// 保存加载完成后的 OBJ 根对象，便于将来做显示、平移等交互。
let objModel;
// 保存模型原点在 Mapbox Mercator 坐标系中的平移量。
let modelTransform;
// 复用该 Vector2 读取真实绘制缓冲尺寸，避免每帧创建对象。
const drawingSize = new THREE.Vector2();
// 保存深度比较开关与容差；epsilon 是投影后 0~1 depth 单位，仅用于实验验证。
const depthComparison = { enabled: true, epsilon: 0.00002 };

/**
 * 将 WGS84 地心地固坐标（ECEF，米）转换为经度、纬度与椭球高。
 * @param {number} x ECEF X 坐标，单位米。
 * @param {number} y ECEF Y 坐标，单位米。
 * @param {number} z ECEF Z 坐标，单位米。
 * @returns {[number, number, number]} [经度(度), 纬度(度), 椭球高(米)]。
 */
function ecefToLla(x, y, z) {
    // 定义 WGS84 长半轴，单位米。
    const a = 6378137.0;
    // 定义 WGS84 短半轴，单位米。
    const b = 6356752.314245;
    // 计算第一偏心率的平方。
    const e2 = 1 - (b * b) / (a * a);
    // 计算第二偏心率的平方。
    const ep2 = (a * a - b * b) / (b * b);
    // 计算点到地轴的水平距离。
    const p = Math.hypot(x, y);
    // 计算 Bowring 公式使用的辅助角。
    const theta = Math.atan2(z * a, p * b);
    // 由 ECEF X、Y 计算弧度制经度。
    const lon = Math.atan2(y, x);
    // 使用 Bowring 公式计算弧度制纬度，避免普通近似造成明显纬度误差。
    const lat = Math.atan2(
        z + ep2 * b * Math.sin(theta) ** 3,
        p - e2 * a * Math.cos(theta) ** 3
    );
    // 计算纬度处椭球卯酉圈曲率半径。
    const radius = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
    // 计算相对 WGS84 椭球面的高度，单位米。
    const altitude = p / Math.cos(lat) - radius;
    // 将经纬度由弧度转换为角度，并与高度一起返回。
    return [THREE.MathUtils.radToDeg(lon), THREE.MathUtils.radToDeg(lat), altitude];
}

/**
 * 将 OBJ 的每个局部 ECEF 顶点投影为相对模型原点的 Mapbox Mercator 坐标。
 * @param {THREE.Object3D} object OBJLoader 加载出的根对象。
 */
function projectModelVertices(object) {
    // 将模型原点的经纬度和零高度转换为 Mercator 锚点。
    const origin = mapboxgl.MercatorCoordinate.fromLngLat(MODEL_ORIGIN, 0);
    // 创建可复用的 ECEF 向量，避免在海量顶点循环中反复分配内存。
    const ecef = new THREE.Vector3();

    // 递归遍历 OBJ 中的所有节点，找出真正拥有 position 属性的网格。
    object.traverse((child) => {
        // 非网格节点或没有 position 顶点属性的节点不参与坐标转换。
        if (!child.isMesh || !child.geometry.attributes.position) return;

        // 取得当前网格的顶点坐标属性。
        const position = child.geometry.attributes.position;
        // 逐顶点处理，使每一个顶点使用自己精确的经纬度投影到 Mercator。
        for (let index = 0; index < position.count; index += 1) {
            // 读取 OBJ 的局部坐标，叠加 ECEF 偏移，得到绝对 ECEF 坐标。
            ecef.set(position.getX(index), position.getY(index), position.getZ(index)).add(ECEF_OFFSET);
            // 将当前绝对 ECEF 顶点转换为经纬度和高度。
            const [lng, lat, altitude] = ecefToLla(ecef.x, ecef.y, ecef.z);
            // 将当前顶点的地理坐标转换为 Mapbox Mercator 坐标。
            const mercator = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], altitude);
            // 以模型原点为局部零点写回顶点，渲染时再整体平移到地图位置。
            position.setXYZ(index, mercator.x - origin.x, mercator.y - origin.y, mercator.z - origin.z);
        }

        // 标记 position 已由 CPU 修改，通知 Three.js 在下次绘制前上传到 GPU。
        position.needsUpdate = true;
        // 非线性投影会改变原始法线，因此重新计算顶点法线以保证光照正确。
        child.geometry.computeVertexNormals();
        // 重新计算包围盒，保证 Three 内部边界数据正确。
        child.geometry.computeBoundingBox();
        // 重新计算包围球，保证后续若启用裁剪时边界正确。
        child.geometry.computeBoundingSphere();
    });
}

/**
 * 根据模型经纬度、额外高度更新模型原点在 Mercator 坐标系中的平移。
 */
function updateModelTransform() {
    // 将当前模型地理定位转换为 Mapbox 渲染矩阵使用的 Mercator 坐标。
    const coordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        [modelPosition.lng, modelPosition.lat],
        modelPosition.altitude
    );
    // 保存平移分量，render 回调中会把它组合进模型局部矩阵。
    modelTransform = {
        // 保存 Mercator X 平移。
        x: coordinate.x,
        // 保存 Mercator Y 平移。
        y: coordinate.y,
        // 保存 Mercator Z 平移。
        z: coordinate.z,
    };
}

/**
 * 创建模型专属的 EffectComposer 和离屏颜色/深度目标。
 */
function createComposer() {
    // 取得包含设备像素比后的实际 GPU 绘制尺寸。
    renderer.getDrawingBufferSize(drawingSize);
    // 在设备可支持的范围内最多启用 4 倍 MSAA，专门平滑 OBJ 离屏颜色纹理的几何边缘。
    const modelMsaaSamples = Math.min(4, renderer.capabilities.maxSamples);
    console.log("modelMsaaSamples:::", modelMsaaSamples, renderer.capabilities.maxSamples);

    // 创建独立 target；它不使用 Mapbox 默认 framebuffer，因此 terrain 深度不会进入此处。
    const target = new THREE.WebGLRenderTarget(drawingSize.x, drawingSize.y, {
        // 为 OBJ 内部遮挡分配深度附件。
        depthBuffer: true,
        // 使用 8 位 RGBA 颜色纹理，满足当前普通颜色合成需求。
        type: THREE.UnsignedByteType,
        // 让 GPU 对模型颜色进行多重采样；WebGL2 / Three 会在 target 被采样前自动 resolve 为普通纹理。
        // samples: modelMsaaSamples,
    });
    // 将深度从仅供 GPU 固定功能测试的 renderbuffer 改为可被未来 shader 采样的纹理。
    target.depthTexture = new THREE.DepthTexture(drawingSize.x, drawingSize.y);

    // 基于共享 renderer 和独立 target 创建后处理调度器。
    composer = new EffectComposer(renderer, target);
    // 禁止 composer 将最后一个 pass 直接输出到 Mapbox 默认 framebuffer。
    composer.renderToScreen = false;
    // 添加模型渲染 Pass；OBJ 材质的 depthTest/depthWrite 仍在这里正常生效。
    composer.addPass(new RenderPass(scene, modelCamera));
    // 添加复制 Pass，使 composer 输出稳定保留在 readBuffer；后续可替换为模型深度处理 Pass。
    //这里可以进一步添加其他pass 来继续做后处理
    // composer.addPass(new ShaderPass({
    //     // 声明 EffectComposer 自动传入的输入颜色纹理 uniform。
    //     uniforms: { tDiffuse: { value: null } },
    //     // 使用全屏 Quad 顶点 shader 传递 UV。
    //     vertexShader: compositeVertexShader,
    //     // 当前片元 shader 仅复制输入颜色，不做颜色或深度修改。
    //     fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv); }',
    // }));
}

/**
 * 创建保存 Mapbox terrain 深度的独立 target。
 * 颜色附件只用于保持 framebuffer 完整，最终合成只采样它的 depthTexture。
 */
function createTerrainDepthTarget() {
    // 读取包含设备像素比后的实际 GPU 绘制尺寸。
    renderer.getDrawingBufferSize(drawingSize);
    // 创建一个与 Mapbox 默认 framebuffer 同尺寸的离屏 target。
    terrainDepthTarget = new THREE.WebGLRenderTarget(drawingSize.x, drawingSize.y, {
        // 分配深度附件，作为 terrain 深度复制的目标。
        depthBuffer: true,
        // 分配普通颜色附件以保证 framebuffer 完整；该颜色不会被最终 shader 使用。
        type: THREE.UnsignedByteType,
    });
    // 将 target 深度附件创建为可在最终 shader 中采样的深度纹理。
    terrainDepthTarget.depthTexture = new THREE.DepthTexture(drawingSize.x, drawingSize.y);
    // Three r160 没有 initRenderTarget()；临时绑定一次 target，让 Three 在内部创建对应 GPU framebuffer。
    renderer.setRenderTarget(terrainDepthTarget);
    // 只清刚创建的离屏 target，不会清除 Mapbox 已绘制到默认 framebuffer 的内容。
    renderer.clear();
    // 切回默认 framebuffer；render 回调开始前还会 resetState，所以这次初始化不会影响正式绘制。
    renderer.setRenderTarget(null);
}

/**
 * 若 Mapbox canvas 的实际绘制尺寸改变，则同步调整 composer 离屏目标尺寸。
 */
function resizeComposerIfNeeded() {
    // 读取当前帧真实的绘制缓冲尺寸。
    renderer.getDrawingBufferSize(drawingSize);
    // 仅在宽或高发生变化时重建/调整 target，避免每帧重复分配 GPU 资源。
    if (composer.readBuffer.width !== drawingSize.x || composer.readBuffer.height !== drawingSize.y) {
        // 同步 composer 内部两个 ping-pong target 的尺寸。
        composer.setSize(drawingSize.x, drawingSize.y);
        // 同步 terrain 深度 target 尺寸，使两个深度纹理的 UV 与默认 framebuffer 一一对应。
        terrainDepthTarget.setSize(drawingSize.x, drawingSize.y);
    }
}

/**
 * 将 custom layer 之前 Mapbox 已写入默认 framebuffer 的深度复制到 terrainDepthTarget。
 * 整个过程都在 GPU 内：默认 depth buffer -> terrainDepthTarget.depthTexture，不读取 CPU。
 * @param {WebGL2RenderingContext} gl Mapbox 传入的共享 WebGL context。
 * @returns {boolean} 本帧是否成功得到可用的 terrain 深度。
 */
function captureTerrainDepth(gl) {
    // WebGL1 没有 framebuffer blit API，无法执行该实验路径。
    if (!(gl instanceof WebGL2RenderingContext)) {
        console.log("");

        // 仅首次警告，避免每一帧重复输出。
        if (!captureTerrainDepth.warned) console.warn('terrain depth 捕获需要 WebGL2，本帧将退回模型优先。');
        // 记录警告已输出。
        captureTerrainDepth.warned = true;
        // 返回失败，让最终 shader 退回第一版规则。
        return false;
    } else {
        console.log("是webgl2....");

    }

    // 在改动任何 WebGL 绑定前记录 Mapbox 当前 framebuffer；null 也合法，表示浏览器默认 framebuffer。
    const mapboxFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    // 取得 Three 为 terrainDepthTarget 创建的底层 WebGL framebuffer；这是实验性内部字段。
    const terrainFramebuffer = renderer.properties.get(terrainDepthTarget).__webglFramebuffer;
    // framebuffer 尚未存在时不能复制。
    if (!terrainFramebuffer) return false;
    // 将 Mapbox 在进入 custom layer 时实际绑定的 framebuffer 绑定为读取源。
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, mapboxFramebuffer);
    // 将独立 terrain target 绑定为写入目标。
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, terrainFramebuffer);
    // 只复制全屏深度；depth blit 只能使用 NEAREST 过滤。
    gl.blitFramebuffer(0, 0, drawingSize.x, drawingSize.y, 0, 0, drawingSize.x, drawingSize.y, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    // 恢复默认 framebuffer，防止原生 WebGL 调用遗留绑定状态。
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // 返回成功。
    return true;
}

/**
 * 创建最终合成模型纹理的全屏 Quad 场景。
 */
function createCompositeScene() {
    // 创建仅用于最后一次合成的独立场景。
    compositeScene = new THREE.Scene();
    // 创建默认相机；全屏 Quad 顶点已经直接处于裁剪空间，不需要投影矩阵。
    compositeCamera = new THREE.Camera();
    // 创建采样模型颜色纹理的 shader 材质。
    compositeMaterial = new THREE.ShaderMaterial({
        // 声明最终深度合成所需的模型颜色、模型深度、terrain 深度与比较参数。
        uniforms: {
            // 保存 composer 输出的模型 RGBA 纹理。
            modelColor: { value: null },
            // 保存模型离屏 target 的深度纹理。
            modelDepth: { value: null },
            // 保存从 Mapbox 默认 framebuffer 复制出的 terrain 深度纹理。
            terrainDepth: { value: null },
            // 控制是否启用 terrain / model 深度比较。
            depthOcclusionEnabled: { value: false },
            // 保存模型可略微落后于 terrain 仍优先显示的深度容差。
            depthEpsilon: { value: depthComparison.epsilon },
        },
        // 指定全屏 Quad 顶点 shader。
        vertexShader: compositeVertexShader,
        // 指定按 alpha 输出模型颜色的片元 shader。
        fragmentShader: compositeFragmentShader,
        // 允许输出 alpha 并参与普通透明混合。
        // transparent: true,
        depthTest: false,
        depthWrite: false,
        // 使用标准 source-over alpha 混合，将 OBJ 叠加在现有地图颜色上。
        // blending: THREE.NormalBlending,
    });
    // 创建覆盖 NDC -1 到 1 的平面，并将它加入合成场景。
    compositeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial));
}

/**
 * 注册本地 DOM 栅格影像和本地 DEM，并启用 Mapbox terrain。
 */
function addLocalSources() {
    // 注册本地 DOM 瓦片 source。
    map.addSource(IMAGE_SOURCE_ID, {
        // 指明 source 类型为普通栅格图像。
        type: 'raster',
        // 提供包含 z/x/y 占位符的 DOM 瓦片路径。
        tiles: ['../3dobj/dom/{z}/{x}/{y}.png'],
        // 声明 DOM 瓦片的像素尺寸。
        tileSize: 256,
    });
    // 将 DOM source 添加为地图中的 raster layer。
    map.addLayer({ id: IMAGE_LAYER_ID, type: 'raster', source: IMAGE_SOURCE_ID });

    // 注册与 OBJ 同源的 Terrain-RGB DEM source。
    map.addSource(DEM_SOURCE_ID, {
        // 指明 source 类型为可生成 terrain 网格的 raster-dem。
        type: 'raster-dem',
        // 生成绝对瓦片目录 URL，避免 Mapbox worker 解析相对路径时出错。
        tiles: [`${new URL('../3dobj/tiles/', window.location.href).href}{z}/{x}/{y}.png`],
        // 声明 DEM 瓦片的像素尺寸。
        tileSize: 512,
        // 声明图片使用 Mapbox Terrain-RGB 编码。
        encoding: 'mapbox',
        // 声明 DEM 可用的最低层级。
        minzoom: 0,
        // 声明 DEM 实际提供的最高层级。
        maxzoom: 15,
    });
    // 启用 terrain，并保持一倍高程夸张。
    map.setTerrain({ source: DEM_SOURCE_ID, exaggeration: 1 });
}

/**
 * 异步加载 OBJ、投影其顶点、设置材质，并加入模型场景。
 */
function loadModel() {
    // 创建 OBJ 加载器并发起模型网络请求。
    new OBJLoader().load(MODEL_URL, (object) => {
        // 在模型第一次绘制前，将其全部顶点由 ECEF 投影到 Mercator 局部坐标。
        projectModelVertices(object);
        // 遍历 OBJ 中的每一个网格，统一设置材质和裁剪行为。
        object.traverse((child) => {
            // 非网格节点无需材质设置。
            if (!child.isMesh) return;
            // 使用可响应当前场景灯光的标准 PBR 材质。
            child.material = new THREE.MeshStandardMaterial({
                // 设置模型主颜色。
                color: 0xffb52a,
                // 设置粗糙度，降低高光。
                roughness: 0.6,
                // 设置较低金属度。
                metalness: 0.05,
                // 设置少量自发光以抬亮暗部。
                emissive: 0x5a3100,
                // 设置自发光强度。
                emissiveIntensity: 0.35,
                // OBJ 在离屏 target 内正常读取模型自己的深度，保留模型内部遮挡。
                depthTest: true,
                // OBJ 在离屏 target 内正常写入模型深度，供后续三角形遮挡判断。
                depthWrite: true,
            });
            // 禁用视锥裁剪，避免直接使用 Mapbox 投影矩阵时被 Three 错误剔除。
            child.frustumCulled = false;
        });
        // 缓存加载好的 OBJ 根对象。
        objModel = object;
        // 将 OBJ 放入会被 RenderPass 绘制的模型场景。
        scene.add(object);
        // 请求 Mapbox 再渲染一帧，使刚加入的模型立即出现。
        map.triggerRepaint();
    }, undefined, (error) => console.error('OBJ 加载失败：', error));
}

/**
 * 注册 Mapbox custom layer，并在其回调中执行模型离屏渲染和最终合成。
 */
function addModelLayer() {
    // 向 Mapbox 样式栈注册自定义图层。
    map.addLayer({
        // 设置图层唯一 ID。
        id: 'model-postprocess',
        // 声明这是 Mapbox custom layer。
        type: 'custom',
        // 使用 3D 模式，保证回调位于 Mapbox terrain 的共享 depth 渲染流程中。
        renderingMode: '3d',
        // 图层加入地图时只执行一次，用来初始化 Three 资源。
        onAdd(mapInstance, gl) {
            // 创建 OBJ 与灯光所在的 Three 场景。
            scene = new THREE.Scene();
            // 创建将被每帧 Mapbox 矩阵覆盖的模型相机。
            modelCamera = new THREE.Camera();
            // 创建主平行光。
            const lightA = new THREE.DirectionalLight(0xffffff, 1.5);
            // 设置主平行光方向。
            lightA.position.set(0, -70, 100).normalize();
            // 将主平行光加入模型场景。
            scene.add(lightA);
            // 创建辅助平行光。
            const lightB = new THREE.DirectionalLight(0xffffff, 1.0);
            // 设置辅助平行光方向。
            lightB.position.set(0, 70, 100).normalize();
            // 将辅助平行光加入模型场景。
            scene.add(lightB);
            // 添加环境光，避免模型背光区域全黑。
            scene.add(new THREE.AmbientLight(0xffffff, 0.9));

            // 复用 Mapbox canvas 和 WebGL context 创建 Three 渲染器，绝不创建第二个 canvas。
            renderer = new THREE.WebGLRenderer({ canvas: mapInstance.getCanvas(), context: gl, antialias: true });
            // 禁止 renderer 自动清 Mapbox 默认 framebuffer；离屏 target 仍会由 composer 按需清空。
            renderer.autoClear = false;
            // 创建最终全屏 alpha 合成使用的场景和材质。
            createCompositeScene();
            // 创建模型独立 color/depth target 与 composer Pass 链。
            createComposer();
            // 创建用于保存当前帧 Mapbox terrain 深度的独立 target。
            createTerrainDepthTarget();
            // 开始异步加载 OBJ。
            loadModel();
            // map 使用模块顶部的共享变量；不要依赖 render 回调中的 this，因为 Mapbox 不保证它绑定 custom layer 对象。
        },
        // Mapbox 每帧调用该函数，并提供当前相机对应的 4x4 投影矩阵数组。
        render(gl, matrix) {
            // composer 或模型定位尚未初始化时不执行渲染。
            if (!composer || !modelTransform) return;

            // 将 Mapbox 传入的数组转换为 Three Matrix4。
            const mapMatrix = new THREE.Matrix4().fromArray(matrix);
            // 创建局部矩阵：先应用模型全局平移，再应用用户设定的局部旋转。
            const localMatrix = new THREE.Matrix4()
                .makeTranslation(modelTransform.x, modelTransform.y, modelTransform.z)
                .multiply(new THREE.Matrix4().makeRotationFromEuler(modelRotation));
            // 合并 Mapbox 投影与模型局部变换，作为本帧模型相机投影矩阵。
            modelCamera.projectionMatrix.copy(mapMatrix.multiply(localMatrix));

            // 仅在深度比较开关开启时复制 terrain depth；默认基线模式不执行实验性 depth blit。
            const hasTerrainDepth = depthComparison.enabled && captureTerrainDepth(gl);
            // 清除 Three 对共享 WebGL context 的状态缓存，避免继承 Mapbox 的绑定状态。
            renderer.resetState();
            // 在窗口尺寸或 DPR 变化后同步 composer 的离屏 target 尺寸。
            resizeComposerIfNeeded();
            // 将 OBJ 绘制到 composer 的独立 target；terrain 的 depth 不会参与此阶段。
            // ===========================================想要优化的地方=================================================
            //这里后期改进一下 使用renderer吧模型绘制到一个指定的frameBuffer里  得到他的colorBuffer和depthBuffer
            //然后再单独使用一个frameBuffer实例 把底图的colorBuffer和depthBuffer拷贝到这个frameBuffer里
            //最后用composer统一进行绘制 先根据上面两个frameBuffer的深度buffer 以及颜色数据 得到一个解决闪面后的最终数据
            //在这个最终数据的基础上 可以加一些其他后处理 这样的路线才是更好的
            composer.render();

            // 再次重置状态，为切换回 Mapbox 默认 framebuffer 做准备。
            // 它不会清除颜色、深度纹理或场景数据。
            renderer.resetState();
            // 绑定 null，即 Mapbox 默认 framebuffer；此处不 clear，所以 terrain / DOM 颜色仍然存在。
            renderer.setRenderTarget(null);
            // 将 composer 离屏输出的模型颜色纹理传给最终合成 shader。
            compositeMaterial.uniforms.modelColor.value = composer.readBuffer.texture;
            // 将 OBJ 离屏 target 的深度纹理传给最终合成 shader。
            compositeMaterial.uniforms.modelDepth.value = composer.readBuffer.depthTexture;
            // 将当前帧复制的 terrain 深度纹理传给最终合成 shader。
            compositeMaterial.uniforms.terrainDepth.value = terrainDepthTarget.depthTexture;
            // 仅在 terrain 深度复制成功且开关开启时执行 shader 中的深度遮挡判断。
            compositeMaterial.uniforms.depthOcclusionEnabled.value = hasTerrainDepth && depthComparison.enabled;
            // 将当前可调容差同步给 shader。
            compositeMaterial.uniforms.depthEpsilon.value = depthComparison.epsilon;
            // 绘制无深度测试的全屏 Quad，由 shader 决定模型是否被 terrain 遮挡。
            renderer.render(compositeScene, compositeCamera);
            // 请求 Mapbox 持续重绘，以响应相机移动和资源加载后的画面更新。
            map.triggerRepaint();

        },
    });
}

/**
 * 创建 Mapbox 地图，并在样式加载后安装影像、terrain 与模型后处理图层。
 */
function init() {
    // 创建 Mapbox map 实例。
    map = new mapboxgl.Map({
        // 注入 Mapbox access token。
        accessToken: MAPBOX_TOKEN,
        // 指定承载 map canvas 的 DOM 容器 ID。
        container: 'map',
        // 选择卫星影像底图样式。
        style: 'mapbox://styles/mapbox/satellite-v9',
        // 设置初始地图中心经纬度。
        center: [-95.904606, 41.116996],
        // 设置初始缩放级别。
        zoom: 13,
        // 设置初始俯仰角。
        pitch: 0,
        // 让 Mapbox 默认 framebuffer 创建 MSAA，改善地图与合成图像边缘。
        antialias: true,
    });
    // 等 Mapbox style 已就绪后再添加 source、terrain 和 custom layer。
    map.on('style.load', () => {
        // 保留原 demo 的低 pitch 正交投影设置，减少低俯仰视图的透视变化。
        map.transform.setOrthographicProjectionAtLowPitch(true);
        // 根据初始模型经纬度计算模型 Mercator 平移。
        updateModelTransform();
        // 注册并显示本地 DOM 与 DEM terrain。
        addLocalSources();
        // 注册模型离屏渲染与 alpha 合成 custom layer。
        addModelLayer();
    });
}

// 执行初始化，启动整个 demo。
init();
