import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import PixelFormat from "../Core/PixelFormat.js";
import ContextLimits from "./ContextLimits.js";
import PixelDatatype from "./PixelDatatype.js";
import Sampler from "./Sampler.js";

/**
 * @private
 */
function Texture3D(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.context", options.context);
  //>>includeEnd('debug');

  const context = options.context;
  let width = options.width;
  let height = options.height;
  let depth = options.depth;
  const source = options.source;

  if (defined(source)) {
    if (!defined(width)) {
      width = defaultValue(source.videoWidth, source.width);
    }
    if (!defined(height)) {
      height = defaultValue(source.videoHeight, source.height);
    }

    if (!defined(depth)) {
      depth = defaultValue(source.videoDepth, source.depth);
    }
  }

  const pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
  const pixelDatatype = defaultValue(
    options.pixelDatatype,
    PixelDatatype.UNSIGNED_BYTE
  );
  const internalFormat = PixelFormat.toInternalFormat(
    pixelFormat,
    pixelDatatype,
    context
  );

  //>>includeStart('debug', pragmas.debug);
  if (!defined(width) || !defined(height) || !defined(depth)) {
    throw new DeveloperError(
      "options requires a source field to create an initialized texture or width and height fields to create a blank texture."
    );
  }

  Check.typeOf.number.greaterThan("width", width, 0);

  if (width > ContextLimits.maximumTextureSize) {
    throw new DeveloperError(
      `Width must be less than or equal to the maximum texture size (${ContextLimits.maximumTextureSize}).  Check maximumTextureSize.`
    );
  }

  Check.typeOf.number.greaterThan("height", height, 0);

  if (height > ContextLimits.maximumTextureSize) {
    throw new DeveloperError(
      `Height must be less than or equal to the maximum texture size (${ContextLimits.maximumTextureSize}).  Check maximumTextureSize.`
    );
  }

  if (!PixelFormat.validate(pixelFormat)) {
    throw new DeveloperError("Invalid options.pixelFormat.");
  }

  if (
    pixelFormat === PixelFormat.DEPTH_COMPONENT &&
    pixelDatatype !== PixelDatatype.UNSIGNED_SHORT &&
    pixelDatatype !== PixelDatatype.UNSIGNED_INT
  ) {
    throw new DeveloperError(
      "When options.pixelFormat is DEPTH_COMPONENT, options.pixelDatatype must be UNSIGNED_SHORT or UNSIGNED_INT."
    );
  }

  if (
    pixelFormat === PixelFormat.DEPTH_STENCIL &&
    pixelDatatype !== PixelDatatype.UNSIGNED_INT_24_8
  ) {
    throw new DeveloperError(
      "When options.pixelFormat is DEPTH_STENCIL, options.pixelDatatype must be UNSIGNED_INT_24_8."
    );
  }

  if (pixelDatatype === PixelDatatype.FLOAT && !context.floatingPointTexture) {
    throw new DeveloperError(
      "When options.pixelDatatype is FLOAT, this WebGL implementation must support the OES_texture_float extension.  Check context.floatingPointTexture."
    );
  }

  if (
    pixelDatatype === PixelDatatype.HALF_FLOAT &&
    !context.halfFloatingPointTexture
  ) {
    throw new DeveloperError(
      "When options.pixelDatatype is HALF_FLOAT, this WebGL implementation must support the OES_texture_half_float extension. Check context.halfFloatingPointTexture."
    );
  }

  if (PixelFormat.isDepthFormat(pixelFormat)) {
    if (defined(source)) {
      throw new DeveloperError(
        "When options.pixelFormat is DEPTH_COMPONENT or DEPTH_STENCIL, source cannot be provided."
      );
    }

    if (!context.depthTexture) {
      throw new DeveloperError(
        "When options.pixelFormat is DEPTH_COMPONENT or DEPTH_STENCIL, this WebGL implementation must support WEBGL_depth_texture.  Check context.depthTexture."
      );
    }
  }

  //>>includeEnd('debug');

  // Use premultiplied alpha for opaque textures should perform better on Chrome:
  // http://media.tojicode.com/webglCamp4/#20
  const preMultiplyAlpha =
    options.preMultiplyAlpha ||
    pixelFormat === PixelFormat.RGB ||
    pixelFormat === PixelFormat.LUMINANCE;
  const flipY = defaultValue(options.flipY, true);

  let initialized = true;

  const gl = context._gl;
  const textureTarget = gl.TEXTURE_3D;
  const texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(textureTarget, texture);

  let unpackAlignment = 4;
  if (defined(source) && defined(source.arrayBufferView)) {
    unpackAlignment = PixelFormat.alignmentInBytes(
      pixelFormat,
      pixelDatatype,
      width
    );
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const arrayBufferView = source.arrayBufferView;
    gl.texImage3D(
      textureTarget,
      0,
      internalFormat,
      width,
      height,
      depth,
      0,
      pixelFormat,
      PixelDatatype.toWebGLConstant(pixelDatatype, context),
      arrayBufferView
    );
    initialized = false;
  }

  gl.bindTexture(textureTarget, null);

  const sizeInBytes =
    width *
    height *
    depth *
    PixelFormat.componentsLength(pixelFormat) *
    PixelDatatype.sizeInBytes(pixelDatatype);

  this._id = createGuid();
  this._context = context;
  this._textureFilterAnisotropic = context._textureFilterAnisotropic;
  this._textureTarget = textureTarget;
  this._texture = texture;
  this._internalFormat = internalFormat;
  this._pixelFormat = pixelFormat;
  this._pixelDatatype = pixelDatatype;
  this._width = width;
  this._height = height;
  this._depth = depth;
  this._dimensions = new Cartesian3(width, height, depth);
  this._hasMipmap = false;
  this._sizeInBytes = sizeInBytes;
  this._preMultiplyAlpha = preMultiplyAlpha;
  this._flipY = flipY;
  this._initialized = initialized;
  this._sampler = undefined;

  this.sampler = defined(options.sampler) ? options.sampler : new Sampler();
}

Object.defineProperties(Texture3D.prototype, {
  /**
   * A unique id for the texture
   * @memberof Texture3D.prototype
   * @type {string}
   * @readonly
   * @private
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * The sampler to use when sampling this texture.
   * Create a sampler by calling {@link Sampler}.  If this
   * parameter is not specified, a default sampler is used.  The default sampler clamps texture
   * coordinates in both directions, uses linear filtering for both magnification and minification,
   * and uses a maximum anisotropy of 1.0.
   * @memberof Texture3D.prototype
   * @type {object}
   */
  sampler: {
    get: function () {
      return this._sampler;
    },
    set: function (sampler) {
      const minificationFilter = sampler.minificationFilter;
      const magnificationFilter = sampler.magnificationFilter;
      const context = this._context;
      const gl = context._gl;
      const target = this._textureTarget;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(target, this._texture);
      gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minificationFilter);
      gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, magnificationFilter);
      gl.texParameteri(target, gl.TEXTURE_WRAP_S, sampler.wrapS);
      gl.texParameteri(target, gl.TEXTURE_WRAP_T, sampler.wrapT);
      gl.texParameteri(target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
      gl.bindTexture(target, null);

      this._sampler = sampler;
    },
  },
  pixelFormat: {
    get: function () {
      return this._pixelFormat;
    },
  },
  pixelDatatype: {
    get: function () {
      return this._pixelDatatype;
    },
  },
  dimensions: {
    get: function () {
      return this._dimensions;
    },
  },
  preMultiplyAlpha: {
    get: function () {
      return this._preMultiplyAlpha;
    },
  },
  flipY: {
    get: function () {
      return this._flipY;
    },
  },
  width: {
    get: function () {
      return this._width;
    },
  },
  height: {
    get: function () {
      return this._height;
    },
  },
  depth: {
    get: function () {
      return this._depth;
    },
  },
  sizeInBytes: {
    get: function () {
      if (this._hasMipmap) {
        return Math.floor((this._sizeInBytes * 4) / 3);
      }
      return this._sizeInBytes;
    },
  },
  _target: {
    get: function () {
      return this._textureTarget;
    },
  },
});

Texture3D.prototype.isDestroyed = function () {
  return false;
};

Texture3D.prototype.destroy = function () {
  this._context._gl.deleteTexture(this._texture);
  return destroyObject(this);
};
export default Texture3D;
