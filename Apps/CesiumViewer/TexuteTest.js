/*
 * @Descripttion:
 * @version: 1.0
 * @Author: hxl
 * @Date: 2020-11-12 14:16:34
 * @LastEditors: hxl
 * @LastEditTime: 2020-12-14 17:12:48
 */
window.CESIUM_BASE_URL = "../../Source/";
import TexturedMaterialAppearanceFS from "../../Source/Shaders/Appearances/TexturedMaterialAppearanceFS.js";
import TexturedMaterialAppearanceVS from "../../Source/Shaders/Appearances/TexturedMaterialAppearanceVS.js";
import {
  Cartesian3,
  createWorldTerrain,
  defined,
  formatError,
  Math as CesiumMath,
  objectToQuery,
  queryToObject,
  CzmlDataSource,
  GeoJsonDataSource,
  KmlDataSource,
  TileMapServiceImageryProvider,
  Viewer,
  viewerCesiumInspectorMixin,
  viewerDragDropMixin,
  Ion,
  GeometryAttribute,
  ComponentDatatype,
  Geometry,
  PrimitiveType,
  BoundingSphere,
  MaterialAppearance,
  Appearance,
  Material,
  Primitive,
  GeometryInstance,
  HeadingPitchRange,
  CesiumTerrainProvider,
  IonResource,
  BlendingState,
  Color,
  GeometryPipeline,
  CornerType,
  CorridorCustomGeometry,
  VertexFormat,
  ColorGeometryInstanceAttribute,
  PerInstanceColorAppearance,
  DebugAppearance,
} from "../../Source/Cesium.js";

function addRec() {
  //   let position = [
  //     115.91520580275133,
  //     39.04232450309457,
  //     -30,
  //     115.91520580275133,
  //     39.04232450309457,
  //     -1068.081338561995,
  //     115.91776630282712,
  //     39.04229554376772,
  //     -1058.1286323921356,
  //     115.91520580275133,
  //     39.04232450309457,
  //     -30,
  //     115.91776630282712,
  //     39.04229554376772,
  //     -1058.1286323921356,
  //     115.93144494830864,
  //     39.042139884850336,
  //     -1087.4131902660147,
  //     115.91520580275133,
  //     39.04232450309457,
  //     -30,
  //     115.93144494830864,
  //     39.042139884850336,
  //     -1087.4131902660147,
  //     115.93144494830864,
  //     39.042139884850336,
  //     -30,
  //   ];
  let position = [
    115.91520580275133,
    39.04232450309457,
    -30,
    115.91520580275133,
    39.04232450309457,
    -1068.081338561995,
    115.91776630282712,
    39.04229554376772,
    -1058.1286323921356,
    115.93144494830864,
    39.042139884850336,
    -1087.4131902660147,
    115.93144494830864,
    39.042139884850336,
    -30,
  ];
  position = Cartesian3.fromDegreesArrayHeights(position);
  var postionsTemp = [];
  // 纹理坐标，调整纹理坐标顺序即可完成贴图的旋转
  //   var stsTemp = [
  //     0.0,
  //     1.0,
  //     0.0,
  //     0.0,
  //     0.2,
  //     0.0,
  //     0.0,
  //     1.0,
  //     0.2,
  //     0.0,
  //     1.3,
  //     0.0,
  //     0.0,
  //     1.0,
  //     1.3,
  //     0.0,
  //     1.3,
  //     2,
  //   ];
  var stsTemp = [0.0, 1.0, 0.0, 0.0, 0.2, 0.0, 1.3, 0.0, 1.3, 0.0];
  // 索引数组
  //   var indicesTesm = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  var indicesTesm = [0, 1, 2, 0, 2, 3, 0, 3, 4];
  for (var i = 0; i < position.length; i++) {
    postionsTemp.push(position[i].x);
    postionsTemp.push(position[i].y);
    postionsTemp.push(position[i].z);
  }
  console.log("pos:" + postionsTemp);
  const positionArr = new Float64Array(postionsTemp);
  const sts = new Float32Array(stsTemp);
  const indiceArr = new Uint16Array(indicesTesm);
  // 通过坐标数组，索引数组，纹理坐标数组创建多边形
  const geometry = CreateGeometry(positionArr, sts, indiceArr);
  // 计算每个顶点法线，方法是平均入射到顶点的所有三角形
  GeometryPipeline.computeNormal(geometry);
  const appearance = new Appearance({
    // closed: true,
    // materialSupport: Cesium.MaterialAppearance.MaterialSupport.ALL,
    // material: new Material({
    //   fabric: {
    //     type: 'Image',
    //     uniforms: {
    //       image: './images/Starry.jpg'
    //     }
    //   }
    // })

    material: new Material({
      fabric: {
        // type: "myImage",
        uniforms: {
          image: "./images/Starry.jpg",
          color: new Color(1.0, 1.0, 1.0, 1.0),
        },
        source: getMS(),
      },
      translucent: false,
    }),
    aboveGround: true,
    faceForward: true,
    flat: true,
    translucent: false,
    renderState: {
      blending: BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,
      depthTest: { enabled: true },
      depthMask: true,
    },
    fragmentShaderSource: getFS(),
    vertexShaderSource: getVS(),
  });
  var primitive = viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: geometry,
      }),
      appearance: appearance,
      asynchronous: false,
    })
  );
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.camera.flyToBoundingSphere(
    new BoundingSphere(
      Cartesian3.fromDegrees(115.91776630282712, 39.04232450309457, 500),
      -200
    ),
    {
      offset: new HeadingPitchRange(0, 0, 0),
    }
  );
}

function CreateGeometry(positions, sts, indices) {
  const sess = new GeometryAttribute({
    componentDatatype: ComponentDatatype.FLOAT,
    componentsPerAttribute: 2,
    values: sts,
  });
  return new Geometry({
    attributes: {
      position: new GeometryAttribute({
        componentDatatype: ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions,
      }),
      st: sess,
    },
    indices: indices,
    primitiveType: PrimitiveType.TRIANGLES,
    boundingSphere: BoundingSphere.fromVertices(positions),
  });
}
// function getVS() {
//   return (
//     "attribute vec3 position3DHigh;\n" +
//     "attribute vec3 position3DLow;\n" +
//     "attribute float batchId;\n" +
//     "attribute vec2 st;\n" +
//     "varying vec2 v_st;\n" +
//     "void main() {\n" +
//     "   vec4 position = czm_modelViewProjectionRelativeToEye *czm_computePosition();\n" +
//     "   v_st = st;\n" +
//     "   gl_Position = position;\n" +
//     "}"
//   );
// }
function getVS() {
  return "attribute vec3 position3DHigh;\
  attribute vec3 position3DLow;\
  attribute vec2 st;\
  attribute float batchId;\
  varying vec2 v_st;\
  void main()\
  {\
      vec4 p = czm_computePosition();\
      v_st=st;\
      p = czm_modelViewProjectionRelativeToEye * p;\
      gl_Position = p;\
  }\
  ";
}
function getFS() {
  return "varying vec2 v_st;\
    void main()\
    {\
        czm_materialInput materialInput;\
        czm_material material=czm_getMaterial(materialInput,v_st);\
        vec4 color=vec4(material.diffuse,material.alpha);\
        gl_FragColor =color;\
    }\
    ";
}
function getMS() {
  return "czm_material czm_getMaterial(czm_materialInput materialInput,vec2 v_st)\
    {\
        vec4 color = texture2D(image, v_st);\
        czm_material material = czm_getDefaultMaterial(materialInput);\
        material.diffuse = color.rgb;\
        material.alpha = 1.0;\
        return material;\
    }\
    ";
}

function test(params) {
  let position = [
    115.91520580275133,
    39.04232450309457,
    2000,
    115.93144494830864,
    39.042139884850336,
    1000,
    115.93144494830864,
    39.049139884850336,
    500,
  ];
  position = Cartesian3.fromDegreesArrayHeights(position);
  // viewer.entities.add({
  //   id: "test",
  //   corridor: {
  //     positions: position,
  //     height: 0,
  //     extrudedHeight: 1000,
  //     width: 50,
  //     cornerType: CornerType.BEVELED,
  //     // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  //     // material: new Cesium.ColorMaterialProperty(
  //     //   Cesium.Color.fromCssColorString(this.color).withAlpha(this.alpha)
  //     // ),
  //     outline: false,
  //   },
  // });
  const geo = CorridorCustomGeometry.createGeometry(
    new CorridorCustomGeometry({
      vertexFormat: VertexFormat.POSITION_NORMAL_AND_ST,
      positions: position,
      height: 0,
      extrudedHeight: 1000,
      width: 200,
      cornerType: CornerType.BEVELED,
    })
  );
  console.log(geo);
  const textureWidth = 200;
  const extrudedHeight = 1000;
  //重新计算uv
  // top
  const attributes = geo.attributes;
  const positons = attributes.position.values;

  const st = attributes.st.values;

  const length = position.length;
  const corrids = length - 1; // 走廊的数量
  const count = length * 3 - 2;
  // const newSt = new Float32Array(st.length);
  const topSt = new Float32Array(count * 2);
  const wallSt = new Float32Array(st.length - count * 2 * 2);
  // top bottom uv
  let lastU = 0;
  for (let i = 0; i < corrids; i++) {
    const leftB = 2 * i;
    const leftT = leftB + 3 * (corrids - i);
    const rightB = 2 * i + 1;
    const rightT = leftT - 1;
    const leftP = new Cartesian3(
      positons[3 * leftB],
      positons[3 * leftB + 1],
      positons[3 * leftB + 2]
    );
    const rightP = new Cartesian3(
      positons[3 * rightB],
      positons[3 * rightB + 1],
      positons[3 * rightB + 2]
    );
    const u = Cartesian3.distance(leftP, rightP) / textureWidth;
    const v = 1;
    topSt.set([lastU, 0], leftB * 2);

    topSt.set([u, 0], rightB * 2);
    topSt.set([u, v], rightT * 2);
    if (i === 0) {
      // 拐点设置一次
      topSt.set([0, v], leftT * 2);
    }
    // lastU = u%1;
  }

  st.set(topSt, 0);
  st.set(topSt, topSt.length);
  //wall uv
  const startI = count * 2;
  let dis = 0;
  for (let i = 0; i < count + 1; i++) {
    let topI = startI + i * 2 - 1;
    let bottomI = startI + count * 2 + i * 2 - 1;
    let topI2 = topI + 1;
    let bottomI2 = bottomI + 1;

    if (i === 0) {
      topI = startI + i;
      bottomI = startI + count * 2 + i;
      const v = extrudedHeight / textureWidth;
      // topI2 = topI + count * 2 - 1;
      // bottomI2 = bottomI + count * 2 - 1;
      st.set([0, 0], topI * 2);
      // st.set([0, 0], topI2 * 2);
      st.set([0, v], bottomI * 2);
      // st.set([0, v], bottomI2 * 2);
    } else {
      const leftP = new Cartesian3(
        positons[3 * (topI - 1)],
        positons[3 * (topI - 1) + 1],
        positons[3 * (topI - 1) + 2]
      );
      const rightP = new Cartesian3(
        positons[3 * topI],
        positons[3 * topI + 1],
        positons[3 * topI + 2]
      );
      const u = (Cartesian3.distance(leftP, rightP) + dis) / textureWidth;
      let v = extrudedHeight / textureWidth;
      v = 20;
      if (i === count) {
        st.set([u, 0], topI * 2);
        st.set([u, v], bottomI * 2);
      } else {
        st.set([u, 0], topI * 2);
        st.set([u, 0], topI2 * 2);
        st.set([u, v], bottomI * 2);
        st.set([u, v], bottomI2 * 2);
      }
      dis += Cartesian3.distance(leftP, rightP);
    }
  }
  // st.set(wallSt, topSt.length * 2);
  console.log(st);
  geo.attributes.st = new GeometryAttribute({
    componentDatatype: ComponentDatatype.FLOAT,
    componentsPerAttribute: 2,
    values: st,
  });
  var rectangleInstance = new GeometryInstance({
    geometry: geo,

    id: "rectangle",
    attributes: {
      color: new ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 1),
    },
  });
  viewer.scene.primitives.add(
    new Primitive({
      geometryInstances: rectangleInstance,
      // appearance: new DebugAppearance({
      //   attributeName: "st",
      // }),
      appearance: new MaterialAppearance({
        // closed: true,
        // materialSupport: Cesium.MaterialAppearance.MaterialSupport.ALL,
        material: new Material({
          fabric: {
            type: "Image",
            uniforms: {
              image: "./images/4.jpg",
            },
          },
        }),
      }),

      // appearance: new PerInstanceColorAppearance({
      //   // faceForward: true,
      //   // flat: true,
      //   translucent: false,
      //   // renderState: {
      //   //   blending: BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,
      //   //   depthTest: { enabled: true },
      //   //   depthMask: true,
      //   // },
      // }),
      asynchronous: false,
    })
  );

  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.camera.flyToBoundingSphere(
    new BoundingSphere(
      Cartesian3.fromDegrees(115.91776630282712, 39.04232450309457, 500),
      -200
    ),
    {
      offset: new HeadingPitchRange(0, 0, 0),
    }
  );
}
test();
