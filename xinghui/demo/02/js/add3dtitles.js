import * as THREE from 'three';
import { TilesRenderer } from '../node_modules/3d-tiles-renderer/build/index.three.js';

const TILESET_URL = new URL(
    '../../01/落汤鸡/目标三维模型-精模/output_tileset/tileset.json',
    import.meta.url
).href;

// tileset 根包围盒中心，坐标为 ECEF（米）。
const TILESET_ECEF_ORIGIN = new THREE.Vector3(
    -495372.9686669922,
    -4786469.613477539,
    4172609.178808594
);

// 与 addTargetModel 的 modelCenterParams.z 一样，作为模型的附加海拔（米）。
const TILESET_HEIGHT_OFFSET_METERS = 36;

/** 将 ECEF 米坐标转换为 [经度, 纬度, 海拔]。 */
function ecefToLla(x, y, z) {
    const a = 6378137.0;
    const b = 6356752.314245;
    const e2 = 1 - (b * b) / (a * a);
    const ep2 = (a * a - b * b) / (b * b);
    const p = Math.hypot(x, y);
    const theta = Math.atan2(z * a, p * b);
    const longitude = Math.atan2(y, x);
    const latitude = Math.atan2(
        z + ep2 * b * Math.sin(theta) ** 3,
        p - e2 * a * Math.cos(theta) ** 3
    );
    const radius = a / Math.sqrt(1 - e2 * Math.sin(latitude) ** 2);
    const altitude = p / Math.cos(latitude) - radius;

    return [longitude * 180 / Math.PI, latitude * 180 / Math.PI, altitude];
}

/**
 * 创建 tileset 的 Mercator 原点和根平移矩阵；子模型顶点会转换为相对此原点的局部坐标。
 *
 * 注意：不能把平移挂在 Object3D 上。若顶点着色器先做 Model × vertex，再做 VP × world，
 * 30m 量级的高差会在 Mercator 世界坐标的 float32 加法中损失精度。改为每帧在 CPU 上合成
 * VP × Model，再作为唯一投影矩阵上传。
 */
function createTilesMercatorFrame() {
    const [longitude, latitude, altitude] = ecefToLla(
        TILESET_ECEF_ORIGIN.x,
        TILESET_ECEF_ORIGIN.y,
        TILESET_ECEF_ORIGIN.z
    );
    console.log("高程::", altitude);
    // 顶点以模型原始高度为参考；不能在这里加入额外偏移，否则会与父级平移相互抵消。
    const mercatorVertexOrigin = mapboxgl.MercatorCoordinate.fromLngLat(
        [longitude, latitude],
        altitude
    );
    // 只有父级定位应用额外高程，最终 modelMatrix 才会让整套模型上/下移动。
    const mercatorFrameOrigin = mapboxgl.MercatorCoordinate.fromLngLat(
        [longitude, latitude],
        altitude + TILESET_HEIGHT_OFFSET_METERS
    );
    const modelMatrix = new THREE.Matrix4().makeTranslation(
        mercatorFrameOrigin.x,
        mercatorFrameOrigin.y,
        mercatorFrameOrigin.z
    );

    return { modelMatrix, mercatorVertexOrigin };
}

// Mapbox FreeCamera 是左手相机：本地 up 为 -Y；Three 相机本地 up 为 +Y。
const MAPBOX_CAMERA_FRAME = new THREE.Matrix4().makeScale(1, -1, 1);
// 当前 Three 场景中的模型顶点直接使用 Mapbox Mercator 世界坐标，故 W 为单位矩阵。
const MAPBOX_WORLD_TO_THREE_WORLD = new THREE.Matrix4().identity();
const _cameraPositionInTiles = new THREE.Vector3();
const _clipPoint = new THREE.Vector4();

/**
 * 将 Mapbox 的自由相机同步为供 3d-tiles-renderer 使用的 Three 相机。
 *
 * 使用列向量，最终相机世界矩阵为：
 * Mthree = W × Mmapbox × C
 *
 * C：Three 相机局部坐标 -> Mapbox 相机局部坐标。
 * Mmapbox：Mapbox 相机局部坐标 -> Mapbox Mercator 世界坐标。
 * W：Mapbox Mercator 世界坐标 -> Three 世界坐标。
 */
function updateTilesCamera(tilesCamera, mapboxCamera, map) {
    // 这是相机的位姿数据：position 为 Mercator 世界位置，orientation 为相机朝向。
    // 它不是视图矩阵 V，也不是视图投影矩阵 VP。
    const freeCamera = map.getFreeCameraOptions();
    // 位姿不完整时保留上一帧相机矩阵。
    if (!freeCamera.position || !freeCamera.orientation) return;

    // 将 Mapbox orientation 转为本项目中构造 Three 相机矩阵所使用的四元数。
    // 单位四元数的逆为 (-x, -y, -z, w)，因此这里反转虚部 xyz。
    const rotation = new THREE.Quaternion(
        -freeCamera.orientation.x,
        -freeCamera.orientation.y,
        -freeCamera.orientation.z,
        freeCamera.orientation.w
    );

    // C：仅转换相机“局部”基础轴；它不改变相机在世界中的 position。
    const threeCameraLocalToMapboxCameraLocal = MAPBOX_CAMERA_FRAME;

    // Mmapbox = T × R：由 Mapbox position 和 orientation 构造相机世界矩阵。
    const mapboxCameraWorldMatrix = new THREE.Matrix4()
        .makeRotationFromQuaternion(rotation)
        .setPosition(
            freeCamera.position.x,
            freeCamera.position.y,
            freeCamera.position.z
        );

    // W：Mapbox 世界坐标转换到 Three 世界坐标。当前项目为 identity，
    // 因为场景顶点和 Mapbox VP 都直接采用 Mercator 世界坐标。
    const mapboxWorldToThreeWorld = MAPBOX_WORLD_TO_THREE_WORLD;
    // Mthree = W × Mmapbox × C。对 Three 相机局部点的实际作用顺序是 C -> Mmapbox -> W。
    const threeCameraWorldMatrix = new THREE.Matrix4()
        .multiplyMatrices(mapboxWorldToThreeWorld, mapboxCameraWorldMatrix)
        .multiply(threeCameraLocalToMapboxCameraLocal);

    // matrixAutoUpdate 为 false，手动写入相机的 world matrix 及其逆（视图矩阵 V）。
    tilesCamera.matrix.copy(threeCameraWorldMatrix);
    tilesCamera.matrixWorld.copy(tilesCamera.matrix);
    tilesCamera.matrixWorldInverse.copy(tilesCamera.matrixWorld).invert();

    // Custom Layer 传入的 projectionMatrix 是 VP。VP × cameraWorld = P，
    // 因此右乘 Mthree 可以还原 3d-tiles-renderer 所需的投影矩阵 P。
    tilesCamera.projectionMatrix
        .copy(mapboxCamera.projectionMatrix)
        .multiply(tilesCamera.matrixWorld);

    // P 的逆矩阵供 Three / 3d-tiles-renderer 进行反投影等计算。
    tilesCamera.projectionMatrixInverse.copy(tilesCamera.projectionMatrix).invert();
}

/**
 * 将 3D Tiles 的 ECEF OBB 角点先映射到当前 Mercator 场景，再直接按 Mapbox VP 测试。
 * 只要 OBB 未完全落在任一裁剪平面外，就认为它可能可见。
 */
function tileIntersectsMapboxFrustum(tile, tilesRenderer, mapboxCamera, mercatorOrigin) {
    const boundingVolume = tile.engineData.boundingVolume;
    const obb = boundingVolume.obb || boundingVolume.regionObb;
    if (!obb) return true;

    let outsideLeft = true;
    let outsideRight = true;
    let outsideBottom = true;
    let outsideTop = true;
    let outsideNear = true;
    let outsideFar = true;

    for (const point of obb.points) {
        // OBB 仍由 3d-tiles-renderer 以 ECEF 保存，先做与顶点相同的非线性转换。
        const mercatorPoint = ecefToMercator(point).sub(mercatorOrigin);
        _clipPoint
            .set(mercatorPoint.x, mercatorPoint.y, mercatorPoint.z, 1)
            .applyMatrix4(tilesRenderer.group.matrixWorld)
            .applyMatrix4(mapboxCamera.projectionMatrix);

        outsideLeft &&= _clipPoint.x < -_clipPoint.w;
        outsideRight &&= _clipPoint.x > _clipPoint.w;
        outsideBottom &&= _clipPoint.y < -_clipPoint.w;
        outsideTop &&= _clipPoint.y > _clipPoint.w;
        outsideNear &&= _clipPoint.z < -_clipPoint.w;
        outsideFar &&= _clipPoint.z > _clipPoint.w;
    }

    return !(outsideLeft || outsideRight || outsideBottom || outsideTop || outsideNear || outsideFar);
}

/**
 * 将 Mapbox zoom 映射为当前 tileset 的 SSE 阈值。
 * 阈值越小，越容易继续细分到更高精度的子瓦片。
 */
function getErrorTargetFromMapZoom(zoom) {
    if (zoom < 14) return 16;
    if (zoom <= 16) return 4.1;


    if (zoom < 18) return 2.1;
    // return 1 / zoom;
    return 0.02;
}

/** 将 ECEF 3D Tiles 挂入当前 Mapbox Custom Layer 的 Three.js 场景。 */
function add3dtitles(mapboxCamera, renderer, scene, map) {
    const tilesRenderer = new TilesRenderer(TILESET_URL);
    const { modelMatrix, mercatorVertexOrigin } = createTilesMercatorFrame();
    // 每个已加载模型的顶点都是相对此原点的 Mercator 坐标。group 保持单位变换，
    // 全局定位会在 render 前合入 Mapbox VP，避免在 GPU 中先相加世界 Mercator 坐标。
    scene.add(tilesRenderer.group);
    const tilesCamera = new THREE.Camera();
    tilesCamera.matrixAutoUpdate = false;
    tilesRenderer.setCamera(tilesCamera);
    tilesRenderer.setResolutionFromRenderer(tilesCamera, renderer);
    tilesRenderer.errorTarget = getErrorTargetFromMapZoom(map.getZoom());
    console.log("map.getZoom():::", map.getZoom());

    tilesRenderer.displayActiveTiles = false;

    // 以 Mapbox VP 判断可见性、以 FreeCamera 的真实位置计算距离和 SSE。
    tilesRenderer.registerPlugin({
        calculateTileViewError(tile, target) {
            // 顶点已在 Mercator 坐标，而 3d-tiles-renderer 的包围盒仍是 ECEF。
            // 直接读取 Mapbox 的原始 Mercator 相机位置再反算 ECEF，避免依赖
            // Three 相机矩阵在渲染器更新过程中的中间状态。
            const freeCamera = map.getFreeCameraOptions();
            if (!freeCamera.position) return false;
            mercatorToEcef(
                _cameraPositionInTiles.copy(freeCamera.position)
            );

            // 包围盒和相机现在均为 ECEF 米坐标，可以计算真实最近距离。
            const distance = tile.engineData.boundingVolume.distanceToPoint(_cameraPositionInTiles);

            // projectionMatrix[5] 约等于 1 / tan(fov / 2)，表示垂直方向的投影比例。
            // 2 / projectionY 表示距离为 1 时可看到的垂直世界高度；再除以画布像素高度，
            // 得到“距离为 1 时，屏幕 1 像素对应多少世界单位（米）”。
            // 最终 distance * sseDenominator 就是相机距离为 d 时，屏幕 1 像素大致对应多少米。
            // Math.abs 用于兼容 Mapbox / Three 坐标轴方向不同造成的符号差异。
            const projectionY = Math.abs(tilesCamera.projectionMatrix.elements[5]);
            const pixelHeight = renderer.domElement.height;
            const sseDenominator = projectionY > 0 && pixelHeight > 0
                ? (2 / projectionY) / pixelHeight
                : 1;

            // 不再使用 3d-tiles-renderer 内部的 Three 视锥：它无法直接处理 Mapbox 的 VP。
            // 改用原始 Mapbox VP 对 ECEF OBB 转换后的 8 个角点做裁剪测试。
            // target.inView = tileIntersectsMapboxFrustum(tile, tilesRenderer, mapboxCamera, mercatorVertexOrigin);
            target.inView = true;

            // SSE = geometricError / (距离 × 投影分母)。距离越近，误差越大，越需要细分。
            target.distance = distance;
            target.error = distance === 0
                ? Infinity
                : tile.geometricError / (distance * sseDenominator);


            return true;
        },
    });

    tilesRenderer.addEventListener('load-tileset', ({ url }) => {
        console.log('3D Tiles tileset 已加载:', url);
    });
    tilesRenderer.addEventListener('load-model', ({ url }) => {
        console.log('3D Tiles GLB 已加载:', url);
    });
    tilesRenderer.addEventListener('load-error', ({ url, error }) => {
        console.error('3D Tiles 加载失败:', url, error);
    });
    tilesRenderer.addEventListener('load-model', ({ scene }) => {
        // scene 及其子节点矩阵共同将 glTF 顶点放到 ECEF。ECEF -> Mercator 是非线性的，
        // 所以必须在 CPU 上逐顶点转换，不能再使用根节点的线性 makeBasis 近似。
        scene.traverse(child => {
            if (!child.isMesh) return;

            // 一个 geometry 可能被多个 Mesh 共用；clone 后再改写才不会重复转换。
            const geometry = child.geometry.clone();
            const position = geometry.getAttribute('position');
            const ecefPosition = new THREE.Vector3();
            const mercatorPosition = new THREE.Vector3();
            // matrixWorld 会混入外层的 Mercator 平移。这里只合成 scene 内部的
            // glTF / 3D Tiles 节点矩阵，结果才是顶点所在的 ECEF 坐标。
            const ecefMatrix = getMatrixRelativeToScene(child, scene);
            const testP = new THREE.Vector3();
            for (let i = 0; i < position.count; i++) {

                ecefPosition.fromBufferAttribute(position, i).applyMatrix4(ecefMatrix);
                ecefToMercator(ecefPosition, mercatorPosition).sub(mercatorVertexOrigin);
                position.setXYZ(i, mercatorPosition.x, mercatorPosition.y, mercatorPosition.z);
            }
            position.needsUpdate = true;
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            child.geometry = geometry;

            child.material = new THREE.MeshStandardMaterial({
                // child.material = new THREE.MeshBasicMaterial({

                color: 0xffaa00,
                roughness: 0.8,
                metalness: 0.1,
                // 保留地形深度遮挡；将模型深度值轻微拉向相机，避免近乎共面时 z-fighting。
                // 负值表示更靠近相机，数值可在 -1 到 -4 间按效果微调。
                // polygonOffset: true,
                // polygonOffsetFactor: -2,
                // transparent: true,
                // depthTest: false,
                // depthWrite: false,

                // polygonOffsetUnits: -1,
            });
            child.frustumCulled = false;
        });

        // 顶点已烘焙为 Mercator 局部坐标，清空原 ECEF / glTF 节点变换。
        // 保留节点层级，以兼容 tilesRenderer 的瓦片挂载、显示和卸载逻辑。
        scene.traverse(child => {
            child.position.set(0, 0, 0);
            child.quaternion.identity();
            child.scale.set(1, 1, 1);
            child.matrix.identity();
            child.matrixWorld.identity();
            child.matrixAutoUpdate = true;
        });
    });

    // Mapbox 驱动 renderer.render()，没有独立 requestAnimationFrame，因此每帧在这里更新瓦片。
    const previousOnBeforeRender = scene.onBeforeRender;
    scene.onBeforeRender = function (...args) {
        previousOnBeforeRender?.apply(this, args);
        updateTilesCamera(tilesCamera, mapboxCamera, map);
        tilesRenderer.setResolutionFromRenderer(tilesCamera, renderer);
        tilesRenderer.errorTarget = getErrorTargetFromMapZoom(map.getZoom());
        tilesRenderer.update();

        // Mapbox Custom Layer 在 render 开头写入 VP。这里在 CPU（JS Number，双精度）中
        // 合成 VP × Model；顶点着色器随后只做一次矩阵乘法，与 ECEF OBJ demo 的路径一致。
        mapboxCamera.projectionMatrix.multiply(modelMatrix);

    };

    console.log('开始加载 3D Tiles:', TILESET_URL);
    return tilesRenderer;
}

//我们拿到的
/**
 * 将 ECEF 坐标转换为 Mercator 坐标。
 * @param {THREE.Vector3} ecefPosition - ECEF 坐标。
 * @returns {THREE.Vector3} - Mercator 坐标。
 */
function ecefToMercator(ecefPosition, target = new THREE.Vector3()) {
    const [longitude, latitude, altitude] = ecefToLla(
        ecefPosition.x,
        ecefPosition.y,
        ecefPosition.z
    );
    const mercator = mapboxgl.MercatorCoordinate.fromLngLat([longitude, latitude], altitude);
    return target.set(mercator.x, mercator.y, mercator.z);
}

/** 合成 node 到 tile scene 根节点之间的局部矩阵，不包含 scene 外部的父级变换。 */
function getMatrixRelativeToScene(node, scene) {
    const result = new THREE.Matrix4().identity();
    let current = node;
    while (current) {
        current.updateMatrix();
        result.premultiply(current.matrix);
        if (current === scene) return result;
        current = current.parent;
    }

    throw new Error('3D Tiles mesh is not a child of its loaded scene.');
}

/** 将 Mapbox Mercator 世界坐标反算为 ECEF 米坐标。 */
function mercatorToEcef(mercatorPosition, target = mercatorPosition) {
    const mercator = new mapboxgl.MercatorCoordinate(
        mercatorPosition.x,
        mercatorPosition.y,
        mercatorPosition.z
    );
    const { lng, lat } = mercator.toLngLat();
    return target.copy(llaToEcef(lng, lat, mercator.toAltitude()));
}

function llaToEcef(longitude, latitude, altitude) {
    const a = 6378137.0;
    const b = 6356752.314245;
    const e2 = 1 - (b * b) / (a * a);
    const longitudeRad = longitude * Math.PI / 180;
    const latitudeRad = latitude * Math.PI / 180;
    const radius = a / Math.sqrt(1 - e2 * Math.sin(latitudeRad) ** 2);
    const cosLatitude = Math.cos(latitudeRad);

    return new THREE.Vector3(
        (radius + altitude) * cosLatitude * Math.cos(longitudeRad),
        (radius + altitude) * cosLatitude * Math.sin(longitudeRad),
        (radius * (1 - e2) + altitude) * Math.sin(latitudeRad)
    );
}

export default add3dtitles;
