import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * A 3x3 matrix, indexable as a column-major order array.
 * Constructor parameters are in row-major order for code readability.
 * @alias Matrix3
 * @constructor
 * @implements {ArrayLike<number>}
 *
 * @param {number} [column0Row0=0.0] The value for column 0, row 0.
 * @param {number} [column1Row0=0.0] The value for column 1, row 0.
 * @param {number} [column2Row0=0.0] The value for column 2, row 0.
 * @param {number} [column0Row1=0.0] The value for column 0, row 1.
 * @param {number} [column1Row1=0.0] The value for column 1, row 1.
 * @param {number} [column2Row1=0.0] The value for column 2, row 1.
 * @param {number} [column0Row2=0.0] The value for column 0, row 2.
 * @param {number} [column1Row2=0.0] The value for column 1, row 2.
 * @param {number} [column2Row2=0.0] The value for column 2, row 2.
 *
 * @see Matrix3.fromArray
 * @see Matrix3.fromColumnMajorArray
 * @see Matrix3.fromRowMajorArray
 * @see Matrix3.fromQuaternion
 * @see Matrix3.fromHeadingPitchRoll
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.fromCrossProduct
 * @see Matrix3.fromRotationX
 * @see Matrix3.fromRotationY
 * @see Matrix3.fromRotationZ
 * @see Matrix2
 * @see Matrix4
 */
function Matrix3(
  column0Row0,
  column1Row0,
  column2Row0,
  column0Row1,
  column1Row1,
  column2Row1,
  column0Row2,
  column1Row2,
  column2Row2,
) {
  this[0] = column0Row0 ?? 0.0;
  this[1] = column0Row1 ?? 0.0;
  this[2] = column0Row2 ?? 0.0;
  this[3] = column1Row0 ?? 0.0;
  this[4] = column1Row1 ?? 0.0;
  this[5] = column1Row2 ?? 0.0;
  this[6] = column2Row0 ?? 0.0;
  this[7] = column2Row1 ?? 0.0;
  this[8] = column2Row2 ?? 0.0;
}

/**
 * The number of elements used to pack the object into an array.
 * @type {number}
 */
Matrix3.packedLength = 9;

/**
 * Stores the provided instance into the provided array.
 *
 * @param {Matrix3} value The value to pack.
 * @param {number[]} array The array to pack into.
 * @param {number} [startingIndex=0] The index into the array at which to start packing the elements.
 *
 * @returns {number[]} The array that was packed into
 */
Matrix3.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

  array[startingIndex++] = value[0];
  array[startingIndex++] = value[1];
  array[startingIndex++] = value[2];
  array[startingIndex++] = value[3];
  array[startingIndex++] = value[4];
  array[startingIndex++] = value[5];
  array[startingIndex++] = value[6];
  array[startingIndex++] = value[7];
  array[startingIndex++] = value[8];

  return array;
};

/**
 * Retrieves an instance from a packed array.
 *
 * @param {number[]} array The packed array.
 * @param {number} [startingIndex=0] The starting index of the element to be unpacked.
 * @param {Matrix3} [result] The object into which to store the result.
 * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
 */
Matrix3.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = startingIndex ?? 0;

  if (!defined(result)) {
    result = new Matrix3();
  }

  result[0] = array[startingIndex++];
  result[1] = array[startingIndex++];
  result[2] = array[startingIndex++];
  result[3] = array[startingIndex++];
  result[4] = array[startingIndex++];
  result[5] = array[startingIndex++];
  result[6] = array[startingIndex++];
  result[7] = array[startingIndex++];
  result[8] = array[startingIndex++];
  return result;
};

/**
 * Flattens an array of Matrix3s into an array of components. The components
 * are stored in column-major order.
 *
 * @param {Matrix3[]} array The array of matrices to pack.
 * @param {number[]} [result] The array onto which to store the result. If this is a typed array, it must have array.length * 9 components, else a {@link DeveloperError} will be thrown. If it is a regular array, it will be resized to have (array.length * 9) elements.
 * @returns {number[]} The packed array.
 */
Matrix3.packArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 9;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 9 elements",
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Matrix3.pack(array[i], result, i * 9);
  }
  return result;
};

/**
 * Unpacks an array of column-major matrix components into an array of Matrix3s.
 *
 * @param {number[]} array The array of components to unpack.
 * @param {Matrix3[]} [result] The array onto which to store the result.
 * @returns {Matrix3[]} The unpacked array.
 */
Matrix3.unpackArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 9);
  if (array.length % 9 !== 0) {
    throw new DeveloperError("array length must be a multiple of 9.");
  }
  //>>includeEnd('debug');

  const length = array.length;
  if (!defined(result)) {
    result = new Array(length / 9);
  } else {
    result.length = length / 9;
  }

  for (let i = 0; i < length; i += 9) {
    const index = i / 9;
    result[index] = Matrix3.unpack(array, i, result[index]);
  }
  return result;
};

/**
 * Duplicates a Matrix3 instance.
 *
 * @param {Matrix3} matrix The matrix to duplicate.
 * @param {Matrix3} [result] The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided. (Returns undefined if matrix is undefined)
 */
Matrix3.clone = function (matrix, result) {
  if (!defined(matrix)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Matrix3(
      matrix[0],
      matrix[3],
      matrix[6],
      matrix[1],
      matrix[4],
      matrix[7],
      matrix[2],
      matrix[5],
      matrix[8],
    );
  }
  result[0] = matrix[0];
  result[1] = matrix[1];
  result[2] = matrix[2];
  result[3] = matrix[3];
  result[4] = matrix[4];
  result[5] = matrix[5];
  result[6] = matrix[6];
  result[7] = matrix[7];
  result[8] = matrix[8];
  return result;
};

/**
 * Creates a Matrix3 from 9 consecutive elements in an array.
 *
 * @function
 * @param {number[]} array The array whose 9 consecutive elements correspond to the positions of the matrix.  Assumes column-major order.
 * @param {number} [startingIndex=0] The offset into the array of the first element, which corresponds to first column first row position in the matrix.
 * @param {Matrix3} [result] The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Create the Matrix3:
 * // [1.0, 2.0, 3.0]
 * // [1.0, 2.0, 3.0]
 * // [1.0, 2.0, 3.0]
 *
 * const v = [1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0];
 * const m = Cesium.Matrix3.fromArray(v);
 *
 * // Create same Matrix3 with using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0];
 * const m2 = Cesium.Matrix3.fromArray(v2, 2);
 */
Matrix3.fromArray = Matrix3.unpack;

/**
 * Creates a Matrix3 instance from a column-major order array.
 *
 * @param {number[]} values The column-major order array.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 */
Matrix3.fromColumnMajorArray = function (values, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("values", values);
  //>>includeEnd('debug');

  return Matrix3.clone(values, result);
};

/**
 * Creates a Matrix3 instance from a row-major order array.
 * The resulting matrix will be in column-major order.
 *
 * @param {number[]} values The row-major order array.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 */
Matrix3.fromRowMajorArray = function (values, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("values", values);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Matrix3(
      values[0],
      values[1],
      values[2],
      values[3],
      values[4],
      values[5],
      values[6],
      values[7],
      values[8],
    );
  }
  result[0] = values[0];
  result[1] = values[3];
  result[2] = values[6];
  result[3] = values[1];
  result[4] = values[4];
  result[5] = values[7];
  result[6] = values[2];
  result[7] = values[5];
  result[8] = values[8];
  return result;
};

/**
 * Computes a 3x3 rotation matrix from the provided quaternion.
 *
 * @param {Quaternion} quaternion the quaternion to use.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The 3x3 rotation matrix from this quaternion.
 */
Matrix3.fromQuaternion = function (quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  //>>includeEnd('debug');

  const x2 = quaternion.x * quaternion.x;
  const xy = quaternion.x * quaternion.y;
  const xz = quaternion.x * quaternion.z;
  const xw = quaternion.x * quaternion.w;
  const y2 = quaternion.y * quaternion.y;
  const yz = quaternion.y * quaternion.z;
  const yw = quaternion.y * quaternion.w;
  const z2 = quaternion.z * quaternion.z;
  const zw = quaternion.z * quaternion.w;
  const w2 = quaternion.w * quaternion.w;

  const m00 = x2 - y2 - z2 + w2;
  const m01 = 2.0 * (xy - zw);
  const m02 = 2.0 * (xz + yw);

  const m10 = 2.0 * (xy + zw);
  const m11 = -x2 + y2 - z2 + w2;
  const m12 = 2.0 * (yz - xw);

  const m20 = 2.0 * (xz - yw);
  const m21 = 2.0 * (yz + xw);
  const m22 = -x2 - y2 + z2 + w2;

  if (!defined(result)) {
    return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }
  result[0] = m00;
  result[1] = m10;
  result[2] = m20;
  result[3] = m01;
  result[4] = m11;
  result[5] = m21;
  result[6] = m02;
  result[7] = m12;
  result[8] = m22;
  return result;
};

/**
 * Computes a 3x3 rotation matrix from the provided headingPitchRoll. (see http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles )
 *
 * @param {HeadingPitchRoll} headingPitchRoll the headingPitchRoll to use.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The 3x3 rotation matrix from this headingPitchRoll.
 */
Matrix3.fromHeadingPitchRoll = function (headingPitchRoll, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("headingPitchRoll", headingPitchRoll);
  //>>includeEnd('debug');

  const cosTheta = Math.cos(-headingPitchRoll.pitch);
  const cosPsi = Math.cos(-headingPitchRoll.heading);
  const cosPhi = Math.cos(headingPitchRoll.roll);
  const sinTheta = Math.sin(-headingPitchRoll.pitch);
  const sinPsi = Math.sin(-headingPitchRoll.heading);
  const sinPhi = Math.sin(headingPitchRoll.roll);

  const m00 = cosTheta * cosPsi;
  const m01 = -cosPhi * sinPsi + sinPhi * sinTheta * cosPsi;
  const m02 = sinPhi * sinPsi + cosPhi * sinTheta * cosPsi;

  const m10 = cosTheta * sinPsi;
  const m11 = cosPhi * cosPsi + sinPhi * sinTheta * sinPsi;
  const m12 = -sinPhi * cosPsi + cosPhi * sinTheta * sinPsi;

  const m20 = -sinTheta;
  const m21 = sinPhi * cosTheta;
  const m22 = cosPhi * cosTheta;

  if (!defined(result)) {
    return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }
  result[0] = m00;
  result[1] = m10;
  result[2] = m20;
  result[3] = m01;
  result[4] = m11;
  result[5] = m21;
  result[6] = m02;
  result[7] = m12;
  result[8] = m22;
  return result;
};

/**
 * Computes a Matrix3 instance representing a non-uniform scale.
 *
 * @param {Cartesian3} scale The x, y, and z scale factors.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Creates
 * //   [7.0, 0.0, 0.0]
 * //   [0.0, 8.0, 0.0]
 * //   [0.0, 0.0, 9.0]
 * const m = Cesium.Matrix3.fromScale(new Cesium.Cartesian3(7.0, 8.0, 9.0));
 */
Matrix3.fromScale = function (scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("scale", scale);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Matrix3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, scale.z);
  }

  result[0] = scale.x;
  result[1] = 0.0;
  result[2] = 0.0;
  result[3] = 0.0;
  result[4] = scale.y;
  result[5] = 0.0;
  result[6] = 0.0;
  result[7] = 0.0;
  result[8] = scale.z;
  return result;
};

/**
 * Computes a Matrix3 instance representing a uniform scale.
 *
 * @param {number} scale The uniform scale factor.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Creates
 * //   [2.0, 0.0, 0.0]
 * //   [0.0, 2.0, 0.0]
 * //   [0.0, 0.0, 2.0]
 * const m = Cesium.Matrix3.fromUniformScale(2.0);
 */
Matrix3.fromUniformScale = function (scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("scale", scale);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Matrix3(scale, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, scale);
  }

  result[0] = scale;
  result[1] = 0.0;
  result[2] = 0.0;
  result[3] = 0.0;
  result[4] = scale;
  result[5] = 0.0;
  result[6] = 0.0;
  result[7] = 0.0;
  result[8] = scale;
  return result;
};

/**
 * Computes a Matrix3 instance representing the cross product equivalent matrix of a Cartesian3 vector.
 *
 * @param {Cartesian3} vector the vector on the left hand side of the cross product operation.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Creates
 * //   [0.0, -9.0,  8.0]
 * //   [9.0,  0.0, -7.0]
 * //   [-8.0, 7.0,  0.0]
 * const m = Cesium.Matrix3.fromCrossProduct(new Cesium.Cartesian3(7.0, 8.0, 9.0));
 */
Matrix3.fromCrossProduct = function (vector, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("vector", vector);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Matrix3(
      0.0,
      -vector.z,
      vector.y,
      vector.z,
      0.0,
      -vector.x,
      -vector.y,
      vector.x,
      0.0,
    );
  }

  result[0] = 0.0;
  result[1] = vector.z;
  result[2] = -vector.y;
  result[3] = -vector.z;
  result[4] = 0.0;
  result[5] = vector.x;
  result[6] = vector.y;
  result[7] = -vector.x;
  result[8] = 0.0;
  return result;
};

/**
 * Creates a rotation matrix around the x-axis.
 *
 * @param {number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the x-axis.
 * const p = new Cesium.Cartesian3(5, 6, 7);
 * const m = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
 */
Matrix3.fromRotationX = function (angle, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("angle", angle);
  //>>includeEnd('debug');

  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  if (!defined(result)) {
    return new Matrix3(
      1.0,
      0.0,
      0.0,
      0.0,
      cosAngle,
      -sinAngle,
      0.0,
      sinAngle,
      cosAngle,
    );
  }

  result[0] = 1.0;
  result[1] = 0.0;
  result[2] = 0.0;
  result[3] = 0.0;
  result[4] = cosAngle;
  result[5] = sinAngle;
  result[6] = 0.0;
  result[7] = -sinAngle;
  result[8] = cosAngle;

  return result;
};

/**
 * Creates a rotation matrix around the y-axis.
 *
 * @param {number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the y-axis.
 * const p = new Cesium.Cartesian3(5, 6, 7);
 * const m = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
 */
Matrix3.fromRotationY = function (angle, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("angle", angle);
  //>>includeEnd('debug');

  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  if (!defined(result)) {
    return new Matrix3(
      cosAngle,
      0.0,
      sinAngle,
      0.0,
      1.0,
      0.0,
      -sinAngle,
      0.0,
      cosAngle,
    );
  }

  result[0] = cosAngle;
  result[1] = 0.0;
  result[2] = -sinAngle;
  result[3] = 0.0;
  result[4] = 1.0;
  result[5] = 0.0;
  result[6] = sinAngle;
  result[7] = 0.0;
  result[8] = cosAngle;

  return result;
};

/**
 * Creates a rotation matrix around the z-axis.
 *
 * @param {number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the z-axis.
 * const p = new Cesium.Cartesian3(5, 6, 7);
 * const m = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(45.0));
 * const rotated = Cesium.Matrix3.multiplyByVector(m, p, new Cesium.Cartesian3());
 */
Matrix3.fromRotationZ = function (angle, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("angle", angle);
  //>>includeEnd('debug');

  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  if (!defined(result)) {
    return new Matrix3(
      cosAngle,
      -sinAngle,
      0.0,
      sinAngle,
      cosAngle,
      0.0,
      0.0,
      0.0,
      1.0,
    );
  }

  result[0] = cosAngle;
  result[1] = sinAngle;
  result[2] = 0.0;
  result[3] = -sinAngle;
  result[4] = cosAngle;
  result[5] = 0.0;
  result[6] = 0.0;
  result[7] = 0.0;
  result[8] = 1.0;

  return result;
};

/**
 * Creates an Array from the provided Matrix3 instance.
 * The array will be in column-major order.
 *
 * @param {Matrix3} matrix The matrix to use..
 * @param {number[]} [result] The Array onto which to store the result.
 * @returns {number[]} The modified Array parameter or a new Array instance if one was not provided.
 */
Matrix3.toArray = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return [
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
      matrix[6],
      matrix[7],
      matrix[8],
    ];
  }
  result[0] = matrix[0];
  result[1] = matrix[1];
  result[2] = matrix[2];
  result[3] = matrix[3];
  result[4] = matrix[4];
  result[5] = matrix[5];
  result[6] = matrix[6];
  result[7] = matrix[7];
  result[8] = matrix[8];
  return result;
};

/**
 * Computes the array index of the element at the provided row and column.
 *
 * @param {number} column The zero-based index of the column.
 * @param {number} row The zero-based index of the row.
 * @returns {number} The index of the element at the provided row and column.
 *
 * @exception {DeveloperError} row must be 0, 1, or 2.
 * @exception {DeveloperError} column must be 0, 1, or 2.
 *
 * @example
 * const myMatrix = new Cesium.Matrix3();
 * const column1Row0Index = Cesium.Matrix3.getElementIndex(1, 0);
 * const column1Row0 = myMatrix[column1Row0Index]
 * myMatrix[column1Row0Index] = 10.0;
 */
Matrix3.getElementIndex = function (column, row) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("row", row, 0);
  Check.typeOf.number.lessThanOrEquals("row", row, 2);
  Check.typeOf.number.greaterThanOrEquals("column", column, 0);
  Check.typeOf.number.lessThanOrEquals("column", column, 2);
  //>>includeEnd('debug');

  return column * 3 + row;
};

/**
 * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {number} index The zero-based index of the column to retrieve.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.getColumn = function (matrix, index, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const startIndex = index * 3;
  const x = matrix[startIndex];
  const y = matrix[startIndex + 1];
  const z = matrix[startIndex + 2];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {number} index The zero-based index of the column to set.
 * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.setColumn = function (matrix, index, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result = Matrix3.clone(matrix, result);
  const startIndex = index * 3;
  result[startIndex] = cartesian.x;
  result[startIndex + 1] = cartesian.y;
  result[startIndex + 2] = cartesian.z;
  return result;
};

/**
 * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {number} index The zero-based index of the row to retrieve.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.getRow = function (matrix, index, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = matrix[index];
  const y = matrix[index + 3];
  const z = matrix[index + 6];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {number} index The zero-based index of the row to set.
 * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @exception {DeveloperError} index must be 0, 1, or 2.
 */
Matrix3.setRow = function (matrix, index, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThanOrEquals("index", index, 2);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result = Matrix3.clone(matrix, result);
  result[index] = cartesian.x;
  result[index + 3] = cartesian.y;
  result[index + 6] = cartesian.z;
  return result;
};

const scaleScratch1 = new Cartesian3();

/**
 * Computes a new matrix that replaces the scale with the provided scale.
 * This assumes the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Cartesian3} scale The scale that replaces the scale of the provided matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @see Matrix3.setUniformScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.multiplyByScale
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.getScale
 */
Matrix3.setScale = function (matrix, scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("scale", scale);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const existingScale = Matrix3.getScale(matrix, scaleScratch1);
  const scaleRatioX = scale.x / existingScale.x;
  const scaleRatioY = scale.y / existingScale.y;
  const scaleRatioZ = scale.z / existingScale.z;

  result[0] = matrix[0] * scaleRatioX;
  result[1] = matrix[1] * scaleRatioX;
  result[2] = matrix[2] * scaleRatioX;
  result[3] = matrix[3] * scaleRatioY;
  result[4] = matrix[4] * scaleRatioY;
  result[5] = matrix[5] * scaleRatioY;
  result[6] = matrix[6] * scaleRatioZ;
  result[7] = matrix[7] * scaleRatioZ;
  result[8] = matrix[8] * scaleRatioZ;

  return result;
};

const scaleScratch2 = new Cartesian3();

/**
 * Computes a new matrix that replaces the scale with the provided uniform scale.
 * This assumes the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {number} scale The uniform scale that replaces the scale of the provided matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @see Matrix3.setScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.multiplyByScale
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.getScale
 */
Matrix3.setUniformScale = function (matrix, scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number("scale", scale);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const existingScale = Matrix3.getScale(matrix, scaleScratch2);
  const scaleRatioX = scale / existingScale.x;
  const scaleRatioY = scale / existingScale.y;
  const scaleRatioZ = scale / existingScale.z;

  result[0] = matrix[0] * scaleRatioX;
  result[1] = matrix[1] * scaleRatioX;
  result[2] = matrix[2] * scaleRatioX;
  result[3] = matrix[3] * scaleRatioY;
  result[4] = matrix[4] * scaleRatioY;
  result[5] = matrix[5] * scaleRatioY;
  result[6] = matrix[6] * scaleRatioZ;
  result[7] = matrix[7] * scaleRatioZ;
  result[8] = matrix[8] * scaleRatioZ;

  return result;
};

const scratchColumn = new Cartesian3();

/**
 * Extracts the non-uniform scale assuming the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 *
 * @see Matrix3.multiplyByScale
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.setScale
 * @see Matrix3.setUniformScale
 */
Matrix3.getScale = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn),
  );
  result.y = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn),
  );
  result.z = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn),
  );
  return result;
};

const scaleScratch3 = new Cartesian3();

/**
 * Computes the maximum scale assuming the matrix is an affine transformation.
 * The maximum scale is the maximum length of the column vectors.
 *
 * @param {Matrix3} matrix The matrix.
 * @returns {number} The maximum scale.
 */
Matrix3.getMaximumScale = function (matrix) {
  Matrix3.getScale(matrix, scaleScratch3);
  return Cartesian3.maximumComponent(scaleScratch3);
};

const scaleScratch4 = new Cartesian3();

/**
 * Sets the rotation assuming the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Matrix3} rotation The rotation matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @see Matrix3.getRotation
 */
Matrix3.setRotation = function (matrix, rotation, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const scale = Matrix3.getScale(matrix, scaleScratch4);

  result[0] = rotation[0] * scale.x;
  result[1] = rotation[1] * scale.x;
  result[2] = rotation[2] * scale.x;
  result[3] = rotation[3] * scale.y;
  result[4] = rotation[4] * scale.y;
  result[5] = rotation[5] * scale.y;
  result[6] = rotation[6] * scale.z;
  result[7] = rotation[7] * scale.z;
  result[8] = rotation[8] * scale.z;

  return result;
};

const scaleScratch5 = new Cartesian3();

/**
 * Extracts the rotation matrix assuming the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @see Matrix3.setRotation
 */
Matrix3.getRotation = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const scale = Matrix3.getScale(matrix, scaleScratch5);

  result[0] = matrix[0] / scale.x;
  result[1] = matrix[1] / scale.x;
  result[2] = matrix[2] / scale.x;
  result[3] = matrix[3] / scale.y;
  result[4] = matrix[4] / scale.y;
  result[5] = matrix[5] / scale.y;
  result[6] = matrix[6] / scale.z;
  result[7] = matrix[7] / scale.z;
  result[8] = matrix[8] / scale.z;

  return result;
};

/**
 * Computes the product of two matrices.
 *
 * @param {Matrix3} left The first matrix.
 * @param {Matrix3} right The second matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.multiply = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const column0Row0 =
    left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
  const column0Row1 =
    left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
  const column0Row2 =
    left[2] * right[0] + left[5] * right[1] + left[8] * right[2];

  const column1Row0 =
    left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
  const column1Row1 =
    left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
  const column1Row2 =
    left[2] * right[3] + left[5] * right[4] + left[8] * right[5];

  const column2Row0 =
    left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
  const column2Row1 =
    left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
  const column2Row2 =
    left[2] * right[6] + left[5] * right[7] + left[8] * right[8];

  result[0] = column0Row0;
  result[1] = column0Row1;
  result[2] = column0Row2;
  result[3] = column1Row0;
  result[4] = column1Row1;
  result[5] = column1Row2;
  result[6] = column2Row0;
  result[7] = column2Row1;
  result[8] = column2Row2;
  return result;
};

/**
 * Computes the sum of two matrices.
 *
 * @param {Matrix3} left The first matrix.
 * @param {Matrix3} right The second matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.add = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = left[0] + right[0];
  result[1] = left[1] + right[1];
  result[2] = left[2] + right[2];
  result[3] = left[3] + right[3];
  result[4] = left[4] + right[4];
  result[5] = left[5] + right[5];
  result[6] = left[6] + right[6];
  result[7] = left[7] + right[7];
  result[8] = left[8] + right[8];
  return result;
};

/**
 * Computes the difference of two matrices.
 *
 * @param {Matrix3} left The first matrix.
 * @param {Matrix3} right The second matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.subtract = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = left[0] - right[0];
  result[1] = left[1] - right[1];
  result[2] = left[2] - right[2];
  result[3] = left[3] - right[3];
  result[4] = left[4] - right[4];
  result[5] = left[5] - right[5];
  result[6] = left[6] - right[6];
  result[7] = left[7] - right[7];
  result[8] = left[8] - right[8];
  return result;
};

/**
 * Computes the product of a matrix and a column vector.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Cartesian3} cartesian The column.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Matrix3.multiplyByVector = function (matrix, cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const vX = cartesian.x;
  const vY = cartesian.y;
  const vZ = cartesian.z;

  const x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
  const y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
  const z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Computes the product of a matrix and a scalar.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {number} scalar The number to multiply by.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.multiplyByScalar = function (matrix, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = matrix[0] * scalar;
  result[1] = matrix[1] * scalar;
  result[2] = matrix[2] * scalar;
  result[3] = matrix[3] * scalar;
  result[4] = matrix[4] * scalar;
  result[5] = matrix[5] * scalar;
  result[6] = matrix[6] * scalar;
  result[7] = matrix[7] * scalar;
  result[8] = matrix[8] * scalar;
  return result;
};

/**
 * Computes the product of a matrix times a (non-uniform) scale, as if the scale were a scale matrix.
 *
 * @param {Matrix3} matrix The matrix on the left-hand side.
 * @param {Cartesian3} scale The non-uniform scale on the right-hand side.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 *
 * @example
 * // Instead of Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromScale(scale), m);
 * Cesium.Matrix3.multiplyByScale(m, scale, m);
 *
 * @see Matrix3.multiplyByUniformScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.setScale
 * @see Matrix3.setUniformScale
 * @see Matrix3.getScale
 */
Matrix3.multiplyByScale = function (matrix, scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("scale", scale);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = matrix[0] * scale.x;
  result[1] = matrix[1] * scale.x;
  result[2] = matrix[2] * scale.x;
  result[3] = matrix[3] * scale.y;
  result[4] = matrix[4] * scale.y;
  result[5] = matrix[5] * scale.y;
  result[6] = matrix[6] * scale.z;
  result[7] = matrix[7] * scale.z;
  result[8] = matrix[8] * scale.z;

  return result;
};

/**
 * Computes the product of a matrix times a uniform scale, as if the scale were a scale matrix.
 *
 * @param {Matrix3} matrix The matrix on the left-hand side.
 * @param {number} scale The uniform scale on the right-hand side.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @example
 * // Instead of Cesium.Matrix3.multiply(m, Cesium.Matrix3.fromUniformScale(scale), m);
 * Cesium.Matrix3.multiplyByUniformScale(m, scale, m);
 *
 * @see Matrix3.multiplyByScale
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.setScale
 * @see Matrix3.setUniformScale
 * @see Matrix3.getScale
 */
Matrix3.multiplyByUniformScale = function (matrix, scale, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.number("scale", scale);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = matrix[0] * scale;
  result[1] = matrix[1] * scale;
  result[2] = matrix[2] * scale;
  result[3] = matrix[3] * scale;
  result[4] = matrix[4] * scale;
  result[5] = matrix[5] * scale;
  result[6] = matrix[6] * scale;
  result[7] = matrix[7] * scale;
  result[8] = matrix[8] * scale;

  return result;
};

/**
 * Creates a negated copy of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to negate.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.negate = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = -matrix[0];
  result[1] = -matrix[1];
  result[2] = -matrix[2];
  result[3] = -matrix[3];
  result[4] = -matrix[4];
  result[5] = -matrix[5];
  result[6] = -matrix[6];
  result[7] = -matrix[7];
  result[8] = -matrix[8];
  return result;
};

/**
 * Computes the transpose of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to transpose.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.transpose = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const column0Row0 = matrix[0];
  const column0Row1 = matrix[3];
  const column0Row2 = matrix[6];
  const column1Row0 = matrix[1];
  const column1Row1 = matrix[4];
  const column1Row2 = matrix[7];
  const column2Row0 = matrix[2];
  const column2Row1 = matrix[5];
  const column2Row2 = matrix[8];

  result[0] = column0Row0;
  result[1] = column0Row1;
  result[2] = column0Row2;
  result[3] = column1Row0;
  result[4] = column1Row1;
  result[5] = column1Row2;
  result[6] = column2Row0;
  result[7] = column2Row1;
  result[8] = column2Row2;
  return result;
};

function computeFrobeniusNorm(matrix) {
  let norm = 0.0;
  for (let i = 0; i < 9; ++i) {
    const temp = matrix[i];
    norm += temp * temp;
  }

  return Math.sqrt(norm);
}

const rowVal = [1, 0, 0];
const colVal = [2, 2, 1];

function offDiagonalFrobeniusNorm(matrix) {
  // Computes the "off-diagonal" Frobenius norm.
  // Assumes matrix is symmetric.

  let norm = 0.0;
  for (let i = 0; i < 3; ++i) {
    const temp = matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])];
    norm += 2.0 * temp * temp;
  }

  return Math.sqrt(norm);
}

function shurDecomposition(matrix, result) {
  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.2 The 2by2 Symmetric Schur Decomposition.
  //
  // The routine takes a matrix, which is assumed to be symmetric, and
  // finds the largest off-diagonal term, and then creates
  // a matrix (result) which can be used to help reduce it

  const tolerance = CesiumMath.EPSILON15;

  let maxDiagonal = 0.0;
  let rotAxis = 1;

  // find pivot (rotAxis) based on max diagonal of matrix
  for (let i = 0; i < 3; ++i) {
    const temp = Math.abs(
      matrix[Matrix3.getElementIndex(colVal[i], rowVal[i])],
    );
    if (temp > maxDiagonal) {
      rotAxis = i;
      maxDiagonal = temp;
    }
  }

  let c = 1.0;
  let s = 0.0;

  const p = rowVal[rotAxis];
  const q = colVal[rotAxis];

  if (Math.abs(matrix[Matrix3.getElementIndex(q, p)]) > tolerance) {
    const qq = matrix[Matrix3.getElementIndex(q, q)];
    const pp = matrix[Matrix3.getElementIndex(p, p)];
    const qp = matrix[Matrix3.getElementIndex(q, p)];

    const tau = (qq - pp) / 2.0 / qp;
    let t;

    if (tau < 0.0) {
      t = -1.0 / (-tau + Math.sqrt(1.0 + tau * tau));
    } else {
      t = 1.0 / (tau + Math.sqrt(1.0 + tau * tau));
    }

    c = 1.0 / Math.sqrt(1.0 + t * t);
    s = t * c;
  }

  result = Matrix3.clone(Matrix3.IDENTITY, result);

  result[Matrix3.getElementIndex(p, p)] = result[
    Matrix3.getElementIndex(q, q)
  ] = c;
  result[Matrix3.getElementIndex(q, p)] = s;
  result[Matrix3.getElementIndex(p, q)] = -s;

  return result;
}

const jMatrix = new Matrix3();
const jMatrixTranspose = new Matrix3();

/**
 * Computes the eigenvectors and eigenvalues of a symmetric matrix.
 * <p>
 * Returns a diagonal matrix and unitary matrix such that:
 * <code>matrix = unitary matrix * diagonal matrix * transpose(unitary matrix)</code>
 * </p>
 * <p>
 * The values along the diagonal of the diagonal matrix are the eigenvalues. The columns
 * of the unitary matrix are the corresponding eigenvectors.
 * </p>
 *
 * @param {Matrix3} matrix The matrix to decompose into diagonal and unitary matrix. Expected to be symmetric.
 * @param {object} [result] An object with unitary and diagonal properties which are matrices onto which to store the result.
 * @returns {object} An object with unitary and diagonal properties which are the unitary and diagonal matrices, respectively.
 *
 * @example
 * const a = //... symetric matrix
 * const result = {
 *     unitary : new Cesium.Matrix3(),
 *     diagonal : new Cesium.Matrix3()
 * };
 * Cesium.Matrix3.computeEigenDecomposition(a, result);
 *
 * const unitaryTranspose = Cesium.Matrix3.transpose(result.unitary, new Cesium.Matrix3());
 * const b = Cesium.Matrix3.multiply(result.unitary, result.diagonal, new Cesium.Matrix3());
 * Cesium.Matrix3.multiply(b, unitaryTranspose, b); // b is now equal to a
 *
 * const lambda = Cesium.Matrix3.getColumn(result.diagonal, 0, new Cesium.Cartesian3()).x;  // first eigenvalue
 * const v = Cesium.Matrix3.getColumn(result.unitary, 0, new Cesium.Cartesian3());          // first eigenvector
 * const c = Cesium.Cartesian3.multiplyByScalar(v, lambda, new Cesium.Cartesian3());        // equal to Cesium.Matrix3.multiplyByVector(a, v)
 */
Matrix3.computeEigenDecomposition = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  //>>includeEnd('debug');

  // This routine was created based upon Matrix Computations, 3rd ed., by Golub and Van Loan,
  // section 8.4.3 The Classical Jacobi Algorithm

  const tolerance = CesiumMath.EPSILON20;
  const maxSweeps = 10;

  let count = 0;
  let sweep = 0;

  if (!defined(result)) {
    result = {};
  }

  const unitaryMatrix = (result.unitary = Matrix3.clone(
    Matrix3.IDENTITY,
    result.unitary,
  ));
  const diagMatrix = (result.diagonal = Matrix3.clone(matrix, result.diagonal));

  const epsilon = tolerance * computeFrobeniusNorm(diagMatrix);

  while (sweep < maxSweeps && offDiagonalFrobeniusNorm(diagMatrix) > epsilon) {
    shurDecomposition(diagMatrix, jMatrix);
    Matrix3.transpose(jMatrix, jMatrixTranspose);
    Matrix3.multiply(diagMatrix, jMatrix, diagMatrix);
    Matrix3.multiply(jMatrixTranspose, diagMatrix, diagMatrix);
    Matrix3.multiply(unitaryMatrix, jMatrix, unitaryMatrix);

    if (++count > 2) {
      ++sweep;
      count = 0;
    }
  }

  return result;
};

/**
 * Computes a matrix, which contains the absolute (unsigned) values of the provided matrix's elements.
 *
 * @param {Matrix3} matrix The matrix with signed elements.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.abs = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result[0] = Math.abs(matrix[0]);
  result[1] = Math.abs(matrix[1]);
  result[2] = Math.abs(matrix[2]);
  result[3] = Math.abs(matrix[3]);
  result[4] = Math.abs(matrix[4]);
  result[5] = Math.abs(matrix[5]);
  result[6] = Math.abs(matrix[6]);
  result[7] = Math.abs(matrix[7]);
  result[8] = Math.abs(matrix[8]);

  return result;
};

/**
 * Computes the determinant of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @returns {number} The value of the determinant of the matrix.
 */
Matrix3.determinant = function (matrix) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  //>>includeEnd('debug');

  const m11 = matrix[0];
  const m21 = matrix[3];
  const m31 = matrix[6];
  const m12 = matrix[1];
  const m22 = matrix[4];
  const m32 = matrix[7];
  const m13 = matrix[2];
  const m23 = matrix[5];
  const m33 = matrix[8];

  return (
    m11 * (m22 * m33 - m23 * m32) +
    m12 * (m23 * m31 - m21 * m33) +
    m13 * (m21 * m32 - m22 * m31)
  );
};

/**
 * Computes the inverse of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to invert.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @exception {DeveloperError} matrix is not invertible.
 */
Matrix3.inverse = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const m11 = matrix[0];
  const m21 = matrix[1];
  const m31 = matrix[2];
  const m12 = matrix[3];
  const m22 = matrix[4];
  const m32 = matrix[5];
  const m13 = matrix[6];
  const m23 = matrix[7];
  const m33 = matrix[8];

  const determinant = Matrix3.determinant(matrix);

  //>>includeStart('debug', pragmas.debug);
  if (Math.abs(determinant) <= CesiumMath.EPSILON15) {
    throw new DeveloperError("matrix is not invertible");
  }
  //>>includeEnd('debug');

  result[0] = m22 * m33 - m23 * m32;
  result[1] = m23 * m31 - m21 * m33;
  result[2] = m21 * m32 - m22 * m31;
  result[3] = m13 * m32 - m12 * m33;
  result[4] = m11 * m33 - m13 * m31;
  result[5] = m12 * m31 - m11 * m32;
  result[6] = m12 * m23 - m13 * m22;
  result[7] = m13 * m21 - m11 * m23;
  result[8] = m11 * m22 - m12 * m21;

  const scale = 1.0 / determinant;
  return Matrix3.multiplyByScalar(result, scale, result);
};

const scratchTransposeMatrix = new Matrix3();

/**
 * Computes the inverse transpose of a matrix.
 *
 * @param {Matrix3} matrix The matrix to transpose and invert.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.inverseTranspose = function (matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  return Matrix3.inverse(
    Matrix3.transpose(matrix, scratchTransposeMatrix),
    result,
  );
};

/**
 * Compares the provided matrices componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Matrix3} [left] The first matrix.
 * @param {Matrix3} [right] The second matrix.
 * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
Matrix3.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left[0] === right[0] &&
      left[1] === right[1] &&
      left[2] === right[2] &&
      left[3] === right[3] &&
      left[4] === right[4] &&
      left[5] === right[5] &&
      left[6] === right[6] &&
      left[7] === right[7] &&
      left[8] === right[8])
  );
};

/**
 * Compares the provided matrices componentwise and returns
 * <code>true</code> if they are within the provided epsilon,
 * <code>false</code> otherwise.
 *
 * @param {Matrix3} [left] The first matrix.
 * @param {Matrix3} [right] The second matrix.
 * @param {number} [epsilon=0] The epsilon to use for equality testing.
 * @returns {boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
 */
Matrix3.equalsEpsilon = function (left, right, epsilon) {
  epsilon = epsilon ?? 0;

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left[0] - right[0]) <= epsilon &&
      Math.abs(left[1] - right[1]) <= epsilon &&
      Math.abs(left[2] - right[2]) <= epsilon &&
      Math.abs(left[3] - right[3]) <= epsilon &&
      Math.abs(left[4] - right[4]) <= epsilon &&
      Math.abs(left[5] - right[5]) <= epsilon &&
      Math.abs(left[6] - right[6]) <= epsilon &&
      Math.abs(left[7] - right[7]) <= epsilon &&
      Math.abs(left[8] - right[8]) <= epsilon)
  );
};

/**
 * An immutable Matrix3 instance initialized to the identity matrix.
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.IDENTITY = Object.freeze(
  new Matrix3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0),
);

/**
 * An immutable Matrix3 instance initialized to the zero matrix.
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.ZERO = Object.freeze(
  new Matrix3(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
);

/**
 * The index into Matrix3 for column 0, row 0.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN0ROW0 = 0;

/**
 * The index into Matrix3 for column 0, row 1.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN0ROW1 = 1;

/**
 * The index into Matrix3 for column 0, row 2.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN0ROW2 = 2;

/**
 * The index into Matrix3 for column 1, row 0.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW0 = 3;

/**
 * The index into Matrix3 for column 1, row 1.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW1 = 4;

/**
 * The index into Matrix3 for column 1, row 2.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN1ROW2 = 5;

/**
 * The index into Matrix3 for column 2, row 0.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW0 = 6;

/**
 * The index into Matrix3 for column 2, row 1.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW1 = 7;

/**
 * The index into Matrix3 for column 2, row 2.
 *
 * @type {number}
 * @constant
 */
Matrix3.COLUMN2ROW2 = 8;

Object.defineProperties(Matrix3.prototype, {
  /**
   * Gets the number of items in the collection.
   * @memberof Matrix3.prototype
   *
   * @type {number}
   */
  length: {
    get: function () {
      return Matrix3.packedLength;
    },
  },
});

/**
 * Duplicates the provided Matrix3 instance.
 *
 * @param {Matrix3} [result] The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
 */
Matrix3.prototype.clone = function (result) {
  return Matrix3.clone(this, result);
};

/**
 * Compares this matrix to the provided matrix componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Matrix3} [right] The right hand side matrix.
 * @returns {boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
 */
Matrix3.prototype.equals = function (right) {
  return Matrix3.equals(this, right);
};

/**
 * @private
 */
Matrix3.equalsArray = function (matrix, array, offset) {
  return (
    matrix[0] === array[offset] &&
    matrix[1] === array[offset + 1] &&
    matrix[2] === array[offset + 2] &&
    matrix[3] === array[offset + 3] &&
    matrix[4] === array[offset + 4] &&
    matrix[5] === array[offset + 5] &&
    matrix[6] === array[offset + 6] &&
    matrix[7] === array[offset + 7] &&
    matrix[8] === array[offset + 8]
  );
};

/**
 * Compares this matrix to the provided matrix componentwise and returns
 * <code>true</code> if they are within the provided epsilon,
 * <code>false</code> otherwise.
 *
 * @param {Matrix3} [right] The right hand side matrix.
 * @param {number} [epsilon=0] The epsilon to use for equality testing.
 * @returns {boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
 */
Matrix3.prototype.equalsEpsilon = function (right, epsilon) {
  return Matrix3.equalsEpsilon(this, right, epsilon);
};

/**
 * Creates a string representing this Matrix with each row being
 * on a separate line and in the format '(column0, column1, column2)'.
 *
 * @returns {string} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2)'.
 */
Matrix3.prototype.toString = function () {
  return (
    `(${this[0]}, ${this[3]}, ${this[6]})\n` +
    `(${this[1]}, ${this[4]}, ${this[7]})\n` +
    `(${this[2]}, ${this[5]}, ${this[8]})`
  );
};
export default Matrix3;
