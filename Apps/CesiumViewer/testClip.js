/*
 * @Author: hxl
 * @Date: 2022-08-24 11:23:21
 * @LastEditTime: 2023-05-26 16:03:19
 * @LastEditors: 霍晓亮 997595328@qq.com
 * @Description:
 */
/* eslint-disable */
import {
  Cartesian3,
  GeometryAttribute,
  VertexArray,
  OrthographicOffCenterFrustum,
  ComponentDatatype,
  PixelFormat,
  PixelDatatype,
  BufferUsage,
  Pass,
  DrawCommand,
  RenderState,
  PassState,
  ClearCommand,
  BoundingRectangle,
  Framebuffer,
  PrimitiveType,
  ShaderProgram,
  Matrix4,
  Color,
  Texture,
  Cartesian4,
  BoundingSphere,
  PolygonGeometry,
  PolygonHierarchy,
  Geometry,
  Transforms,
  Sampler,
  Resource,
  TextureMinificationFilter,
  TextureMagnificationFilter,
  ClippingPlane,
  Plane,
  ClippingPlaneCollection,
  MultiClippingPlaneCollection,
  GlobeSurfaceTileProvider,
  Material,
  Cartographic,
  Cesium3DTileset,
  CustomShader,
  UniformType,
  TextureWrap,
  Rectangle,
  Globe,
} from "../../Build/CesiumUnminified/index.js";
// } from "../../Source/Cesium.js";
import * as Cesium from "../../Build/CesiumUnminified/index.js";
Object.defineProperties(GlobeSurfaceTileProvider.prototype, {
  crcOptions: {
    configurable: true,
    get: function get() {
      return this._crcOptions;
    },
  },
});
GlobeSurfaceTileProvider.prototype._initByCrc = function (options) {
  const that = this;
  this._crcOptions = {
    clip: {},
    flat: {},
    uplift: {},
    reset: () => {
      that._crcOptions.clip = {
        enabled: false,
      };
      that._crcOptions.flat = {
        enabled: false,
      };
      that._crcOptions.uplift = {
        enabled: false,
      };
    },
    updateTileUniformMap: (frameState, globeSurfaceTileProvider) => {
      return {
        u_enableTailor: function () {
          return that._crcOptions.clip.enabled ?? false;
        },
        u_showTailorOnly: function () {
          return that._crcOptions.clip.showTailorOnly ?? false;
        },
        u_invertTailorCenterMatrix: function () {
          return that._crcOptions.clip.inverseMatrix || Matrix4.IDENTITY;
        },
        u_tailorRect: function () {
          return that._crcOptions.clip.tailorRect || Cartesian4.ZERO;
        },
        u_tailorArea: function () {
          return (
            that._crcOptions.clip.polygonTexture ||
            frameState.context.defaultTexture
          );
        },
      };
    },
  };
  this._crcOptions.reset();
};

const beginFrame_old = Globe.prototype.beginFrame;
Globe.prototype.beginFrame = function (frameState) {
  const surface = this._surface;
  const crcOptions = surface.tileProvider.crcOptions;
  const flat = crcOptions?.flat;
  if (flat && flat.texture && flat.hasUpdate) {
    flat.texture.destroy();
    flat.texture = createFlattingAreaTextureOrLimitAreaTexture(
      frameState.context,
      flat.areas,
      flat.heights
    );
    flat.hasUpdate = false;
  }
  const uplift = crcOptions?.uplift;
  if (uplift && uplift.texture && uplift.hasUpdate) {
    uplift.texture.destroy();
    uplift.texture = createFlattingAreaTextureOrLimitAreaTexture(
      frameState.context,
      uplift.areas,
      undefined
    );
    uplift.hasUpdate = false;
  }
  beginFrame_old.bind(this)(frameState);
};

function createFlattingAreaTextureOrLimitAreaTexture(context, areas, heights) {
  if (!areas || areas.length === 0) {
    return undefined;
  }
  let width = 0;
  const height = areas.length ?? 0;
  areas.forEach((area) => {
    width = Math.max(width, area.length);
  });
  const positions = [];
  areas.forEach((area, i) => {
    const areaLength = area.length;
    area.forEach((a) => {
      positions.push(a.longitude);
      positions.push(a.latitude);
      positions.push(areaLength);
      if (heights) {
        positions.push(heights[i]);
      } else {
        positions.push(0);
      }
    });
    if (areaLength < width) {
      for (let j = 0; j < width - areaLength; j++) {
        positions.push(0);
        positions.push(0);
        positions.push(0);
        positions.push(0);
      }
    }
  });
  console.log(positions);
  return new Texture({
    source: {
      width: width,
      height: height,
      arrayBufferView: new Float32Array(positions),
    },
    context: context,

    pixelFormat: PixelFormat.RGBA,
    pixelDatatype: PixelDatatype.FLOAT,
    flipY: false,
    sampler: new Sampler({
      wrapS: TextureWrap.CLAMP_TO_EDGE,
      wrapT: TextureWrap.CLAMP_TO_EDGE,
      minificationFilter: TextureMinificationFilter.NEAREST,
      magnificationFilter: TextureMagnificationFilter.NEAREST,
    }),
  });
}

Material.TerrainClipType = "TerrainClip";
Material._materialCache.addMaterial(Material.TerrainClipType, {
  fabric: {
    type: Material.TerrainClipType,
    uniforms: {},
    source:
      "czm_material czm_getMaterial(czm_materialInput materialInput) {\n\
      czm_material material = czm_getDefaultMaterial(materialInput);\n\
      return material;\n\
    }",
  },
  translucent: true,
});
function testTextureClip(viewer) {
  const positions = [
    [116.334222, 30.899171, 645.46],
    [116.370874, 30.899171, 645.46],
    [116.370874, 30.944509, 645.46],
    [116.334222, 30.944509, 645.46],
  ];
  const positions2 = [
    [116.416497, 30.934256, 775.89],
    [116.427392, 30.962941, 1084.88],
    [116.434838, 30.932608, 900.43],
    [116.462994, 30.923081, 771.42],
    [116.437571, 30.916044, 906.39],
    [116.44977, 30.894487, 776.06],
    [116.424183, 30.908752, 727.02],
    [116.402218, 30.898406, 593.08],
    [116.414309, 30.918806, 588.78],
    [116.387022, 30.933539, 700.65],
  ];
  const areaList = [
    {
      show: true,
      positions: Cartesian3.fromDegreesArrayHeights(positions.flat()),
    },
    // {
    //   show: true,
    //   positions: Cartesian3.fromDegreesArrayHeights(positions2.flat()),
    // },
  ];
  const param = getClipParam(viewer, areaList);
  console.log(param);
  viewer.scene.globe._surface.tileProvider._crcOptions.clip = {
    enabled: false,
    showTailorOnly: false,
    inverseMatrix: param.inverseMatrix,
    tailorRect: param.tailorRect,
    polygonTexture: param.polygonTexture,
  };
  //
  viewer.scene.globe.material = null;
  // viewer.scene.globe.material = Material.fromType("TerrainClip");
  // setTimeout(() => {
  //   viewer.scene.globe._surface.tileProvider._crcOptions.clip.showTailorOnly = true;
  // }, 5000);
}

function testUpLift(viewer) {
  const positions = [
    [116.334222, 30.899171, 645.46],
    [116.370874, 30.899171, 645.46],
    [116.370874, 30.944509, 645.46],
    [116.334222, 30.944509, 645.46],
  ];
  const positions2 = [
    [116.416497, 30.934256, 775.89],
    [116.427392, 30.962941, 1084.88],
    [116.434838, 30.932608, 900.43],
    [116.462994, 30.923081, 771.42],
    [116.437571, 30.916044, 906.39],
    [116.44977, 30.894487, 776.06],
    [116.424183, 30.908752, 727.02],
    [116.402218, 30.898406, 593.08],
    [116.414309, 30.918806, 588.78],
    [116.387022, 30.933539, 700.65],
  ];
  const positionCartos = [];
  positions.forEach((p) => {
    positionCartos.push(Cartographic.fromDegrees(p[0], p[1], p[2]));
  });
  const positionCartos2 = [];
  positions2.forEach((p) => {
    positionCartos2.push(Cartographic.fromDegrees(p[0], p[1], p[2]));
  });
  const rectangles = [];
  rectangles.push(Rectangle.fromCartographicArray(positionCartos));
  rectangles.push(Rectangle.fromCartographicArray(positionCartos2));
  const heights = [-1450, -2000];
  const texture = createFlattingAreaTextureOrLimitAreaTexture(
    viewer.scene.context,
    [positionCartos, positionCartos2],
    heights
  );
  const uplift = {
    enabled: true,
    areas: [positionCartos, positionCartos2],
    showUp: true,
    hasUpdate: true,
    heights: heights,
    rectangles,
    texture,
  };
  viewer.scene.globe._surface.tileProvider._crcOptions.flat = uplift;
  // viewer.scene.globe.terrainExaggeration = 1.001;
  viewer.scene.globe.material = null;
}

function getClipParam(viewer, areaList) {
  const center = new Cartesian3();
  const _areaList = [];
  let positions = [];
  areaList.forEach((area) => {
    if (!area.show || !area.positions) {
      return;
    }
    positions = positions.concat(...area.positions);
    const bounding = BoundingSphere.fromPoints(area.positions);
    Cartesian3.add(center, bounding.center, center);
    _areaList.push(area);
  });
  const rectangle = Rectangle.fromCartesianArray(positions);
  const context = viewer.scene.context;
  if (_areaList.length === 0) {
    return;
  }
  const _center = Cartesian3.multiplyByScalar(
    center,
    1 / _areaList.length,
    new Cartesian3()
  );
  const matrix = Transforms.eastNorthUpToFixedFrame(_center);
  const inverseMatrix = Matrix4.inverse(matrix, new Matrix4());
  let x = 999999,
    y = 999999,
    z = -9999999,
    w = -9999999;

  _areaList.forEach((area) => {
    let geo = new PolygonGeometry({
      polygonHierarchy: new PolygonHierarchy(area.positions),
    });
    geo = PolygonGeometry.createGeometry(geo);
    const indices = geo.indices;
    const positions = geo.attributes.position.values;
    const length = positions.length;
    const positionLoc = [];
    const positionsArr = [];
    for (let i = 0; i < length; i += 3) {
      const p = new Cartesian3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      );
      const inverseP = Matrix4.multiplyByPoint(
        inverseMatrix,
        p,
        new Cartesian3()
      );
      inverseP.z = 0;
      positionLoc.push(inverseP);
      positionsArr.push(inverseP.x, inverseP.y, inverseP.z);
      x >= inverseP.x && (x = inverseP.x);
      y >= inverseP.y && (y = inverseP.y);
      z <= inverseP.x && (z = inverseP.x);
      w <= inverseP.y && (w = inverseP.y);
    }
    area.positionLoc = positionLoc;

    const positionsArrFloat = new Float64Array(positionsArr);
    const boundingSphere = BoundingSphere.fromVertices(positionsArrFloat);
    const geometry = new Geometry({
      attributes: {
        positions: new GeometryAttribute({
          componentDatatype: ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: positionsArrFloat,
        }),
      },
      indices: indices,
      primitiveType: PrimitiveType.TRIANGLES,
      boundingSphere: boundingSphere,
    });

    const shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: `
      in vec3 position;
      void main() {
         vec4 pos = vec4(position.xyz, 1.0);
         gl_Position = czm_projection * pos;
        }
      `,
      fragmentShaderSource: `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

void main() {
  out_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
      `,
      attributeLocations: { position: 0 },
    });
    const vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: geometry,
      attributeLocations: shaderProgram._attributeLocations,
      bufferUsage: BufferUsage.STATIC_DRAW,
      interleave: true,
    });

    const renderState = new RenderState();
    renderState.depthRange.near = -1000000;
    renderState.depthRange.far = 1000000;
    area.drawAreaCommand = new DrawCommand({
      boundingVolume: boundingSphere,

      pass: Pass.TRANSLUCENT,
      shaderProgram: shaderProgram,
      renderState: renderState,
      vertexArray: vertexArray,

      primitiveType: PrimitiveType.TRIANGLES,
    });
  });
  const dir = (w - y) / (z - x);
  const rec = [x, y, z, w];
  const camera = {
    viewMatrix: Matrix4.IDENTITY,
    inverseViewMatrix: Matrix4.IDENTITY,
    frustum: new OrthographicOffCenterFrustum(),
    positionCartographic: {
      height: 0,
      latitude: 0,
      longitude: 0,
    },
    positionWC: new Cartesian3(0, 0, 60000),
    directionWC: new Cartesian3(0, 0, -1),
    upWC: new Cartesian3(0, 1, 0),
    rightWC: new Cartesian3(1, 0, 0),
    viewProjectionMatrix: Matrix4.IDENTITY,
  };
  camera.frustum.left = rec[0];
  camera.frustum.top = rec[3];
  camera.frustum.right = rec[2];
  camera.frustum.bottom = rec[1];
  camera.frustum.near = 0.1;
  camera.frustum.far = -120000;

  let width, height;
  if (dir > 1) {
    height = 8192;
    width = 8192 / dir;
  } else {
    width = 8192;
    height = 8192 * dir;
  }

  const wrap = TextureWrap.CLAMP_TO_EDGE;
  const texture = new Texture({
    context: context,
    width: width,
    height: height,
    pixelFormat: PixelFormat.RGBA,
    pixelDataType: PixelDatatype.UNSIGNED_BYTE,
    flipY: false,
    sampler: new Sampler({
      wrapS: wrap,
      wrapT: wrap,
      minificationFilter: TextureMinificationFilter.NEAREST,
      magnificationFilter: TextureMagnificationFilter.NEAREST,
    }),
  });
  const framebuffer = new Framebuffer({
    context: context,
    colorTextures: [texture],
    destroyAttachments: false,
  });
  const clearCommand = new ClearCommand({
    color: new Color(0, 0, 0, 0),
    framebuffer: framebuffer,
  });
  const passState = new PassState(context);
  passState.viewport = new BoundingRectangle(0, 0, width, height);
  const uniformState = context.uniformState;
  uniformState.updateCamera(camera);
  clearCommand.execute(context);

  _areaList.forEach((area) => {
    uniformState.updatePass(area.drawAreaCommand.pass);
    area.drawAreaCommand.framebuffer = framebuffer;
    area.drawAreaCommand.execute(context, passState);
  });

  return {
    tailorRect: new Cartesian4(
      rec[0],
      rec[1],
      rec[2] - rec[0],
      rec[3] - rec[1]
    ),
    polygonTexture: texture,
    inverseMatrix: inverseMatrix,
    rectangle,
  };
}

function testImageClip(viewer) {
  const resource = Resource.createIfNeeded("./Images/bj.png");

  const promise = resource.fetchImage();

  Promise.resolve(promise)
    .then(function (image) {
      return image;
    })
    .then((image) => {
      viewer.scene.globe._surface.tileProvider._crcOptions.clip = {
        showTailorOnly: true,
        enabled: true,
        inverseMatrix: Matrix4.fromArray([
          -0.8957974061252312,
          0.22830813303479605,
          -0.3813428950032679,
          0,
          -0.44446260492791456,
          -0.4601463230028864,
          0.7685820413252027,
          0,
          0,
          0.8579864554974566,
          0.5136723101189228,
          0,
          1.1641532182693481e-10,
          18834.777426014887,
          -6372586.51004111,
          0.9999999999999999,
        ]),
        tailorRect: new Cartesian4(
          -52330.348446729477,
          -44180.195436554728,
          123090.433540776838,
          104260.971659099218
        ),
        polygonTexture: new Texture({
          context: viewer.scene.context,
          source: image,

          flipY: false,
          sampler: new Sampler({
            minificationFilter: TextureMinificationFilter.NEAREST,
            magnificationFilter: TextureMagnificationFilter.NEAREST,
          }),
        }),
      };
    });

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(116.334222, 30.899171, 500),
  });
}

function clip(viewer) {
  const points = [
    116.00934461789467,
    38.925128167741235,
    116.0055666966707,
    38.91690539257192,
    116.01669215382776,
    38.911112429608195,
    116.02335203036604,
    38.92112004284001,
    116.0128581057669,
    38.91926380381167,
    116.00934461789467,
    38.925128167741235,
  ];

  const clippingPlanecollection1 = new ClippingPlaneCollection({
    planes: clipGlobe(points, viewer, false),
  });
  const points2 = [
    116.00934461789467,
    38.925128167741235,
    116.0055666966707,
    38.91690539257192,
    116.01669215382776,
    38.911112429608195,
    116.02335203036604,
    38.92112004284001,
    116.0128581057669,
    38.91926380381167,
    116.00934461789467,
    38.925128167741235,
  ];
  const clippingPlanecollection2 = new ClippingPlaneCollection({
    planes: clipGlobe(points2, viewer, false),
  });
  const points3 = [
    116.411409,
    30.803997,
    116.425991,
    30.86995,
    116.411409,
    30.869951,
    116.411409,
    30.803997,
  ];
  const clippingPlanecollection3 = new ClippingPlaneCollection({
    planes: clipGlobe(points3, viewer, false),
  });

  // const points = [115.91908739004447, 39.04809047902112, 115.92138990828803, 39.042418560514264]

  // const clippingPlanecollection1= new ClippingPlaneCollection({
  //   planes: clipGlobe(points, viewer, false)
  // })

  // const points2 = [ 115.92138990828803, 39.042418560514264,115.92725082170679,39.04680660493583]

  // const clippingPlanecollection2= new ClippingPlaneCollection({
  //   planes: clipGlobe(points2, viewer, false)
  // })
  viewer.scene.globe.multiClippingPlanes = new MultiClippingPlaneCollection({
    collections: [
      clippingPlanecollection1,
      clippingPlanecollection2,
      clippingPlanecollection3,
    ],
    edgeWidth: 0,
  });

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(116.349582, 30.89141, 2000),
  });
}
/**
 * 地面裁剪
 * @param {Array} points
 * @param {Viewer} viewer
 * @param {Boolean} unionClippingRegions  是否交集裁剪
 */
function clipGlobe(points, viewer, unionClippingRegions) {
  let i = 0;
  points = Cartesian3.fromDegreesArray(points);
  const pointsLength = points.length;
  // Create center points for each clipping plane
  const clippingPlanes = [];
  for (i = 0; i < pointsLength - 1; ++i) {
    const nextIndex = (i + 1) % pointsLength;
    let midpoint = Cartesian3.add(
      points[i],
      points[nextIndex],
      new Cartesian3()
    );
    midpoint = Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);

    const up = Cartesian3.normalize(midpoint, new Cartesian3());

    let right = unionClippingRegions
      ? Cartesian3.subtract(midpoint, points[nextIndex], new Cartesian3())
      : Cartesian3.subtract(points[nextIndex], midpoint, new Cartesian3());
    right = Cartesian3.normalize(right, right);

    let normal = Cartesian3.cross(right, up, new Cartesian3());
    normal = Cartesian3.normalize(normal, normal);

    // Compute distance by pretending the plane is at the origin
    const originCenteredPlane = new Plane(normal, 0.0);
    const distance = Plane.getPointDistance(originCenteredPlane, midpoint);

    clippingPlanes.push(new ClippingPlane(normal, distance));
  }
  return clippingPlanes;
  // viewer.scene.globe.clippingPlanes = new ClippingPlaneCollection({
  //   planes: clippingPlanes,
  //   edgeWidth: 0.1,
  //   // edgeColor: Color.WHITE,
  //   enabled: true,
  //   unionClippingRegions: unionClippingRegions
  // })
}

function clipTileset(viewer, areaList = []) {
  const positions = [
    [120.15527840367893, 33.34348363055796, 0],
    [120.15566577320449, 33.34297706108772, 0],
    [120.15648628004291, 33.343495713757704, 0],
    [120.1560244866221, 33.344266237882394, 0],
    [120.1558349076176, 33.343614196544415, 0],
  ];
  const positions2 = [
    [120.15311856061298, 33.34488500149115, 0],
    [120.15381660479956, 33.34374897198428, 0],
    [120.15590123994284, 33.34474961752023, 0],
    [120.15524977275192, 33.34608433792083, 0],
  ];
  areaList = [
    {
      show: true,
      positions: Cartesian3.fromDegreesArrayHeights(positions.flat()),
    },
    {
      show: true,
      positions: Cartesian3.fromDegreesArrayHeights(positions2.flat()),
    },
  ];
  const param = getClipParam(viewer, areaList);
  console.log(param);
  const t = new Cesium3DTileset({
    // url: "http://192.168.1.158:1000/建筑白膜/tileset.json",
    debugWireframe: true,
    enableDebugWireframe: true,
    url:
      "http://192.168.1.198:9000/3dtiles/%E5%80%BE%E6%96%9C%E6%91%84%E5%BD%B1%E6%A8%A1%E5%9E%8B0725/tileset.json",
  });
  viewer.scene.primitives.add(t);
  viewer.flyTo(t);
  t.customShader = new CustomShader({
    uniforms: {
      u_showTailorOnly: {
        type: UniformType.BOOL,
        value: false,
      },
      u_invertTailorCenterMat: {
        type: UniformType.MAT4,
        value: param.inverseMatrix,
      },
      u_tailorRect: {
        type: UniformType.VEC4,
        value: param.tailorRect,
      },
      u_tailorArea: {
        type: UniformType.SAMPLER_2D,
        value: param.polygonTexture,
      },
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
      {
          // material.diffuse = texture2D(u_gradient, fsInput.attributes.texCoord_0).rgb;
          vec4 tlpos = u_invertTailorCenterMat * vec4(fsInput.attributes.positionWC, 1.0);
          vec2 tuv = (tlpos.xy - u_tailorRect.xy) / u_tailorRect.zw;
          vec4 tColor = texture2D(u_tailorArea, tuv);
          if (!(tuv.x >= 0.0 && tuv.x <= 1.0 && tuv.y >= 0.0 && tuv.y <= 1.0) ||
              (tColor.r < 0.5 && tColor.a < 0.5))
          {
            if (u_showTailorOnly) {
             // discard;
             material.diffuse=texture2D(u_tailorArea, fsInput.attributes.texCoord_0).rgb;
            }
          } else {
            if (!u_showTailorOnly) {
             // discard;
             material.diffuse=vec3(1, 0.0, 0.0);
            }
          }
      }
      `,
  });
}

function test(viewer) {
  const normalSurface = Cesium.Cartesian3.normalize(
    viewer.scene.globe.ellipsoid.geodeticSurfaceNormal(
      Cesium.Cartesian3.fromDegrees(117.24377269458321, 31.796539378427223, 10)
    ),
    new Cesium.Cartesian3()
  );
  const geo = new Cesium.CorridorGeometry({
    vertexFormat: Cesium.VertexFormat.POSITION_NORMAL_AND_ST,
    positions: Cesium.Cartesian3.fromDegreesArrayHeights(
      [
        [117.24377269458321, 31.796539378427223, 900],
        [117.24933815769845, 31.800495920343913, 1000],

        [117.24933815769845, 31.81495920343913, 1100],
      ].flat()
    ),
    clampToGround: false,
    height: 0,
    extrudedHeight: 20,
    width: 200,
    cornerType: Cesium.CornerType.BEVELED,
  });
  const p = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: geo,

      id: "this.id,",
      attributes: {
        color: new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 1),
      },
    }),
    // appearance: new DebugAppearance({
    //   attributeName: "st",
    // }),
    appearance: new Cesium.MaterialAppearance({
      faceForward: false,
      vertexShaderSource: `
      attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec3 normal;
attribute vec2 st;
attribute float batchId;

varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec2 v_st;
varying vec3 v_normal;
void main()
{
    vec4 p = czm_computePosition();

    v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
    v_normalEC = czm_normal * normal;                         // normal in eye coordinates
    v_st = st;
    v_normal=normal;
    gl_Position = czm_modelViewProjectionRelativeToEye * p;
}
      `,
      fragmentShaderSource: `
      varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec2 v_st;
varying vec3 v_normal;

void main()
{
    vec3 positionToEyeEC = -v_positionEC;

    vec3 normalEC = normalize(v_normalEC);
#ifdef FACE_FORWARD
    normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
#endif

    czm_materialInput materialInput;
    materialInput.normalEC = normalEC;
    materialInput.positionToEyeEC = positionToEyeEC;
    materialInput.st = v_st;
    czm_material material = czm_getMaterial(materialInput,v_normal);

#ifdef FLAT
    gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
#else
    gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
#endif
}
      `,
      material: new Cesium.Material({
        translucent: false,
        fabric: {
          type: "flowWallEffect",
          uniforms: {
            color: new Cesium.Color(1, 1, 1, 1),
            image: "images/road.jpg",
            image2: "images/road2.jpg",
            repeat2: new Cesium.Cartesian2(5, 1),
            repeat: new Cesium.Cartesian2(50, 5),
            normalSurface: normalSurface,
          },
          source: `
          czm_material czm_getMaterial (czm_materialInput materialInput,vec3 v_normal)
          {
          czm_material material = czm_getDefaultMaterial(materialInput);
          vec3 k = vec3(0.00, 1.00, 0.00);
           float angle=dot(materialInput.normalEC, normalize(czm_normal *normalSurface));
          if(abs(angle)>0.707){
            material.diffuse = czm_gammaCorrect(texture2D(image2, fract(repeat2 * materialInput.st)).rgb * color.rgb);
            material.alpha = texture2D(image2, fract(repeat2 * materialInput.st)).a * color.a;
            return material;
          }
          else{
            material.diffuse = czm_gammaCorrect(texture2D(image, fract(repeat * materialInput.st)).rgb * color.rgb);
            material.alpha = texture2D(image, fract(repeat * materialInput.st)).a * color.a;
            return material;
          }

          }`,
        },
      }),

      // Cesium.Material.fromType("Image", {
      // repeat: new Cesium.Cartesian2(5, 1),
      // image: "images/road.jpg",
      // }),
    }),
    asynchronous: false,
  });
  viewer.scene.primitives.add(p);
  p._readyPromise.then(() => {
    viewer.scene.camera.flyToBoundingSphere(p._boundingSpheres[0]);
  });
}
export { testImageClip, testTextureClip, clip, clipTileset, test, testUpLift };
