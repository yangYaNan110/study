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
const TILESET_HEIGHT_OFFSET_METERS = 100;

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
 * 创建 ECEF -> 局部 Mercator 的根节点。
 * 子节点先减去 ECEF 原点，再由父节点转换到 Mapbox 的 east / south / up 坐标。
 */
function createTilesMercatorFrame() {
    const [longitude, latitude, altitude] = ecefToLla(
        TILESET_ECEF_ORIGIN.x,
        TILESET_ECEF_ORIGIN.y,
        TILESET_ECEF_ORIGIN.z
    );
    const mercatorOrigin = mapboxgl.MercatorCoordinate.fromLngLat(
        [longitude, latitude],
        // 与 addTargetModel 相同：高度在 fromLngLat 时传入，而不是事后直接改 Mercator z。
        altitude + TILESET_HEIGHT_OFFSET_METERS
    );
    const longitudeRad = longitude * Math.PI / 180;
    const latitudeRad = latitude * Math.PI / 180;
    const scale = mercatorOrigin.meterInMercatorCoordinateUnits();

    // ECEF 的 X/Y/Z 三个单位轴映射为 Mapbox 的 east / south / up 单位轴。
    const ecefXAxis = new THREE.Vector3(
        -Math.sin(longitudeRad),
        Math.sin(latitudeRad) * Math.cos(longitudeRad),
        Math.cos(latitudeRad) * Math.cos(longitudeRad)
    ).multiplyScalar(scale);
    const ecefYAxis = new THREE.Vector3(
        Math.cos(longitudeRad),
        Math.sin(latitudeRad) * Math.sin(longitudeRad),
        Math.cos(latitudeRad) * Math.sin(longitudeRad)
    ).multiplyScalar(scale);
    const ecefZAxis = new THREE.Vector3(
        0,
        -Math.cos(latitudeRad),
        Math.sin(latitudeRad)
    ).multiplyScalar(scale);

    const mercatorFrame = new THREE.Object3D();
    mercatorFrame.name = 'tiles-mercator-frame';
    mercatorFrame.matrixAutoUpdate = false;
    mercatorFrame.matrix
        .makeBasis(ecefXAxis, ecefYAxis, ecefZAxis)
        .setPosition(
            mercatorOrigin.x,
            mercatorOrigin.y,
            mercatorOrigin.z
        );

    const ecefLocalFrame = new THREE.Object3D();
    ecefLocalFrame.name = 'tiles-ecef-local-frame';
    ecefLocalFrame.position.copy(TILESET_ECEF_ORIGIN).multiplyScalar(-1);
    mercatorFrame.add(ecefLocalFrame);

    return { mercatorFrame, ecefLocalFrame };
}

/** 根据 Mapbox zoom 选择 tileset 的几何误差阈值，数值越小 LOD 越精细。 */
function getLodErrorTarget(zoom) {
    if (zoom < 14) return 16;
    if (zoom < 16) return 4.1;
    if (zoom < 18) return 2.1;
    return 0.02;
}

/** 将 ECEF 3D Tiles 挂入当前 Mapbox Custom Layer 的 Three.js 场景。 */
function add3dtitles(mapboxCamera, renderer, scene, map) {
    const tilesRenderer = new TilesRenderer(TILESET_URL);
    tilesRenderer.setCamera(mapboxCamera);
    tilesRenderer.setResolutionFromRenderer(mapboxCamera, renderer);
    tilesRenderer.errorTarget = getLodErrorTarget(map.getZoom());
    tilesRenderer.displayActiveTiles = false;

    // Mapbox Custom Layer 只暴露合并 VP，库无法可靠地按默认 Three 相机视锥剔除。
    // 因此只固定“在视野内”，而 LOD 仍由上面的 zoom -> errorTarget 策略控制。
    tilesRenderer.registerPlugin({
        calculateTileViewError(tile, target) {
            target.inView = true;
            target.error = tile.geometricError;
            target.distance = 0;
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

        // create a custom material for the tile
        scene.traverse(child => {
            console.log(child, "child....");
            if (!child.isMesh) return;

            // if (c.material) {

            //     c.material = new MeshBasicMaterial();

            // }
            child.material = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                roughness: 0.8,
                metalness: 0.2,
            });
            child.frustumCulled = false;

        });
    });


    // 与 addTargetModel 的 modelFrame 一样，父级负责地图坐标变换，瓦片保持自身坐标。
    const { mercatorFrame, ecefLocalFrame } = createTilesMercatorFrame();
    ecefLocalFrame.add(tilesRenderer.group);
    scene.add(mercatorFrame);

    // Mapbox 驱动 renderer.render()，没有独立 requestAnimationFrame，因此每帧在这里更新瓦片。
    const previousOnBeforeRender = scene.onBeforeRender;
    scene.onBeforeRender = function (...args) {
        previousOnBeforeRender.apply(this, args);
        tilesRenderer.errorTarget = getLodErrorTarget(map.getZoom());
        tilesRenderer.setResolutionFromRenderer(mapboxCamera, renderer);
        tilesRenderer.update();
    };

    console.log('开始加载 3D Tiles:', TILESET_URL);
    return tilesRenderer;
}

export default add3dtitles;
