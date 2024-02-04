function getMaxMin(arr) {
  let min = Number.MAX_SAFE_INTEGER,
    max = Number.MIN_SAFE_INTEGER;
  for (let i = 0; i < arr.length; i++) {
    min = Math.min(arr[i], min);
    max = Math.max(arr[i], max);
  }
  return [min, max];
}

function mix(t, e) {
  const n = t % e;
  return n * e < 0 ? n + e : n;
}

function process(extent, width, height, us, vs) {
  const [xmin, ymin, xmax, ymax] = extent;
  const xLen = xmax - xmin;
  const yLen = ymin - ymax;
  const halfX = xLen / 2,
    halfY = yLen / 2;
  width = Math.floor(width);
  height = Math.floor(height);
  const width2 = width + 1;
  const height2 = height + 1;
  const deltaX = xLen / width;
  const deltaY = yLen / height;

  let uvs = [],
    elements = [],
    position = [],
    imageList = [],
    realExtent = [];
  let uMin = 0,
    uMax = 0,
    vMin = 0,
    vMax = 0;
  [uMin, uMax] = getMaxMin(us);
  if (vs) {
    [vMin, vMax] = getMaxMin(vs);
  }
  let realMinx = 1000,
    realMinY = 1000;
  let realMaxx = -1000,
    realMaxY = -1000;
  for (let i = 0; i < height2; i++) {
    const yStep = deltaY * i;
    const positionTemp = [],
      imageListTemp = [];
    const positionTemp2 = [],
      imageListTemp2 = [];
    for (let j = 0; j < width2; j++) {
      let x = xmin + ((j * deltaX) / halfX / 2) * xLen;
      const y = ymax + (yStep / halfY / 2) * yLen;
      let alpha = 255;
      const u = us[i * width2 + j];
      if (u == null) alpha = 0;

      const r = (255 * (u - uMin)) / (uMax - uMin);
      let g = 0;
      if (vs) {
        const v = vs[i * width2 + j];
        if (v == null) alpha = 0;

        g = (255 * (v - vMin)) / (vMax - vMin);
      }
      if (x < -180 || x > 180) {
        x = mix(x + 180, 360) - 180;
        positionTemp.push(x, y);
        imageListTemp.push(r, g, 0, alpha);
      } else {
        positionTemp2.push(x, y);
        imageListTemp2.push(r, g, 0, alpha);
      }
      realMinx >= x && (realMinx = x);
      realMaxx <= x && (realMaxx = x);
      realMinY >= y && (realMinY = y);
      realMaxY <= y && (realMaxY = y);
      uvs.push(j / width, i / height);
    }
    position = position.concat(positionTemp.concat(positionTemp2));
    imageList = imageList.concat(imageListTemp.concat(imageListTemp2));
    realExtent = [realMinx, realMinY, realMaxx, realMaxY];
  }
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const n = j + width2 * i,
        r = j + width2 * (i + 1),
        x = j + 1 + width2 * (i + 1),
        o = j + 1 + width2 * i;
      elements.push(n, r, o);
      elements.push(r, x, o);
    }
  }
  return {
    verticesBuffer: new Float32Array(position),
    indicesBuffer: new Uint32Array(elements),
    texCoordBuffer: new Float32Array(uvs),
    velocityData: new Uint8Array(imageList),
    dataExtent: new Float32Array([uMin, uMax, vMin, vMax]),
    realExtent: new Float32Array(realExtent),
  };
}

self.onmessage = (res) => {
  const data = res.data;
  const us = data[0],
    vs = data[1],
    extent = data[2],
    [width, height] = data[3];
  const {
    dataExtent,
    verticesBuffer,
    velocityData,
    indicesBuffer,
    texCoordBuffer,
    realExtent,
  } = process(extent, width, height, us, vs);
  self.postMessage(
    [
      velocityData.buffer,
      dataExtent.buffer,
      verticesBuffer.buffer,
      indicesBuffer.buffer,
      texCoordBuffer.buffer,
      realExtent.buffer,
    ],
    [
      velocityData.buffer,
      dataExtent.buffer,
      verticesBuffer.buffer,
      indicesBuffer.buffer,
      texCoordBuffer.buffer,
      realExtent.buffer,
    ]
  );
};
