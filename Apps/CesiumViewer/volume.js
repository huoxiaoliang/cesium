/*
 * @Author: hxl
 * @Date: 2023-04-18 16:15:14
 * @LastEditTime: 2023-05-26 15:58:44
 * @LastEditors: 霍晓亮 997595328@qq.com
 * @Description:
 */
import { ImprovedNoise } from "./noise.js";

import {
  VertexFormat,
  VertexArray,
  Cartesian3,
  BoxGeometry,
  Texture3D,
  PixelFormat,
  PixelDatatype,
  Transforms,
  GeometryPipeline,
  RenderState,
  ShaderProgram,
  DrawCommand,
  Pass,
} from "../../Build/CesiumUnminified/index.js";

const vs = `
in vec3 position; // 顶点的本地坐标
in vec2 st; // uv坐标
out vec3 vOrigin; // 传到片源着色器的相机位置（模型本地坐标系）
out vec3 vDirection; // 传到片源着色器的方向
void main()
{
    vOrigin=czm_encodedCameraPositionMCHigh+czm_encodedCameraPositionMCLow; // 使用cesium内部变量获取相机在模型坐标系下的位置
    vDirection=position - vOrigin;
    gl_Position = czm_modelViewProjection * vec4(position,1.0);
}
`;
const fs = `
    #define epsilon 0.0001 // 偏移量
    precision highp float;
	precision highp sampler3D;
    uniform sampler3D map;
	uniform float threshold;
	uniform float steps;

    in vec3 vOrigin;
    in vec3 vDirection;
    vec2 hitBox( vec3 orig, vec3 dir ) {
        const vec3 box_min = vec3( - 0.5 );
        const vec3 box_max = vec3( 0.5 );
        vec3 inv_dir = 1.0 / dir;
        vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
        vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
        vec3 tmin = min( tmin_tmp, tmax_tmp );
        vec3 tmax = max( tmin_tmp, tmax_tmp );
        float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
        float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
        return vec2( t0, t1 );
    }
    float sample1( vec3 p ) {
        return texture( map, p ).a;
    }
    vec3 normal( vec3 coord ) {
		if ( coord.x < epsilon ) return vec3( 1.0, 0.0, 0.0 );
		if ( coord.y < epsilon ) return vec3( 0.0, 1.0, 0.0 );
		if ( coord.z < epsilon ) return vec3( 0.0, 0.0, 1.0 );
		if ( coord.x > 1.0 - epsilon ) return vec3( - 1.0, 0.0, 0.0 );
		if ( coord.y > 1.0 - epsilon ) return vec3( 0.0, - 1.0, 0.0 );
		if ( coord.z > 1.0 - epsilon ) return vec3( 0.0, 0.0, - 1.0 );
		float step = 0.01;
		float x = sample1( coord + vec3( - step, 0.0, 0.0 ) ) - sample1( coord + vec3( step, 0.0, 0.0 ) );
		float y = sample1( coord + vec3( 0.0, - step, 0.0 ) ) - sample1( coord + vec3( 0.0, step, 0.0 ) );
		float z = sample1( coord + vec3( 0.0, 0.0, - step ) ) - sample1( coord + vec3( 0.0, 0.0, step ) );
		return normalize( vec3( x, y, z ) );
	}
    void main()
    {
        vec4 color = vec4(0.0);
        vec3 rayDir = normalize( vDirection );
		    vec2 bounds = hitBox( vOrigin, rayDir );
	   	if ( bounds.x > bounds.y ) discard;
        bounds.x=max(bounds.x,0.0);
        vec3 p = vOrigin + bounds.x * rayDir;
        vec3 inc = 1.0 / abs( rayDir );
        float delta = min( inc.x, min( inc.y, inc.z ) );
        delta /= steps;
        for ( float t = bounds.x; t < bounds.y; t += delta ) {
        	float d = sample1( p + 0.5 );
        	if ( d > threshold ) {
        		color.rgb = normal( p + 0.5 ) * 0.5 + ( p * 1.5 + 0.25 );
        		color.a = 1.;
        		break;
        	}
        	p += rayDir * delta;
        }
        if ( color.a == 0.0 ) discard;
        out_FragColor=color;
    }

`;

class CustomPrimitive {
  constructor(option) {
    this.drawCommand = undefined;
    this.threshold = 0.3;
    this.steps = 100;
    this.modelMatrix = option.modelMatrix;
    this.geometry_lxs = option.geometry_lxs;
    this.texture3D = option.texture3D;
  }
  createCommand(context) {
    const geometry = BoxGeometry.createGeometry(this.geometry_lxs);
    const attributes = GeometryPipeline.createAttributeLocations(geometry);
    const vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: geometry,
      attributes: attributes,
    });
    const renderState = RenderState.fromCache({
      depthTest: { enabled: true },
      cull: { enabled: false },
    });
    const shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attributeLocations: attributes,
    });
    const _this = this;
    const uniformMap = {
      map: function () {
        return _this.texture3D;
      },
      threshold: function () {
        return _this.threshold;
      },
      steps: function () {
        return _this.steps;
      },
    };
    this.drawCommand = new DrawCommand({
      boundingVolume: this.geometry_lxs.boundingSphere,
      modelMatrix: this.modelMatrix,
      pass: Pass.OPAQUE,
      shaderProgram: shaderProgram,
      renderState: renderState,
      vertexArray: vertexArray,
      uniformMap: uniformMap,
    });
  }

  update(frameState) {
    if (!this.drawCommand) {
      this.createCommand(frameState.context);
    }
    frameState.commandList.push(this.drawCommand);
  }
}

function makeVolume(viewer) {
  const perlin = new ImprovedNoise();
  const geometry_lxs = BoxGeometry.fromDimensions({
      vertexFormat: VertexFormat.POSITION_AND_ST,
      dimensions: new Cartesian3(1, 1, 1),
    }),
    size = 128,
    data1 = new Uint8Array(size * size * size);
  let i = 0;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const vector = new Cartesian3(x, y, z);
        Cartesian3.divideByScalar(vector, size, vector);

        const d = perlin.noise(vector.x * 6.5, vector.y * 6.5, vector.z * 6.5);

        data1[i++] = d * 128 + 128;
      }
    }
  }
  const texture3D1 = new Texture3D({
    context: viewer["scene"]["context"],
    source: {
      width: size,
      height: size,
      depth: size,
      arrayBufferView: data1,
    },
    pixelFormat: PixelFormat.ALPHA,
    pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
  });

  const primitive_modelMatrix1 = Transforms.eastNorthUpToFixedFrame(
    Cartesian3.fromDegrees(116.416497, 30.934256, 775)
  );
  viewer.scene.primitives.add(
    new CustomPrimitive({
      modelMatrix: primitive_modelMatrix1,
      geometry_lxs: geometry_lxs,
      texture3D: texture3D1,
    })
  );
}

export { makeVolume };
