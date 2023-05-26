/* eslint-disable */
import * as Cesium from "../../../Build/CesiumUnminified/index.js";
import Field from "./Field.js";
const cacheStainProcessMap = new Map();

function mix(t, e) {
  const n = t % e;
  return n * e < 0 ? n + e : n;
}

class StainProcess {
  constructor(options) {
    this.layer = options.layer;
    this.dataType = options.dataType || "json";
    this.dataExtent = options.dataExtent ?? null;
    this.extent = options.extent || [-180, -90, 180, 90];
    this.unitConvertFn = options.unitConvertFn ?? null;
    this.single = options.single ?? 1;
    this.url = options.url ?? "";
    this._imageOffsetPixel = options.imageOffsetPixel ?? -8;
    this.isWave = options.isWave ?? false;
    this.widthSegments = options.widthSegments ?? 720;
    this.heightSegments = options.heightSegments ?? 360;
    this._data = null;
    if (options.data) {
      this.setData(options.data);
    } else {
      this.url && this._loadFromUrl();
    }
  }

  _loadFromUrl() {
    switch (this.dataType) {
      case "json":
        this.loadJson();
        break;
      case "zip":
        this.loadZip();
        break;
      case "image":
        this.loadImage();
        break;
    }
  }
  loadJson() {
    const data = cacheStainProcessMap.get(this.url);
    if (data && this.layer) {
      this.layer.setData(data.result);
      this.field = data.field;
      this._data = data.result;
    } else {
      Cesium.Resource.fetchJson({ url: this.url }).then((res) => {
        if (!this.isDestroyed || !this.isDestroyed()) {
          this.setData(res);
        }
      });
    }
  }

  loadZip() {
    const data = cacheStainProcessMap.get(this.url);
    if (data && this.layer) {
      this.layer.setData(data.result);
      this.field = data.field;
      this._data = data.result;
    } else {
      Cesium.Resource.fetchJson({ url: this.url }).then((res) => {
        if (!this.isDestroyed || !this.isDestroyed()) {
          this.setData(res.items);
        }
      });
    }
  }

  loadImage() {}
  initializeVertex() {}
  _formatImageToField() {}

  formatData(data) {
    let header,
      result = {};
    if (Array.isArray(data)) {
      let jsonU, jsonV;
      data.forEach((d) => {
        switch (d.header.parameterCategory + "," + d.header.parameterNumber) {
          case "1,2":
          case "2,2":
            jsonU = d;
            break;
          case "1,3":
          case "2,3":
            jsonV = d;
            break;
        }
      });

      if (this.isWave) {
        header = jsonU.header;
        const dataU = [],
          dataV = [];
        for (let i = 0; i < header.ny; i++) {
          for (let j = 0; j < header.nx; j++) {
            const x = jsonU.data[i * header.nx + j],
              y = jsonV.data[i * header.nx + j];
            if (x) {
              dataU.push(-y * Math.sin(x));
              dataV.push(-y * Math.cos(x));
            } else {
              dataU.push(null);
              dataV.push(null);
            }
          }
        }
        jsonU.data = dataU;
        jsonV.data = dataV;
      }
      if (this.unitConvertFn) {
        jsonU.data = jsonU.data.map((d) => {
          return this.unitConvertFn(d);
        });
        jsonV.data = jsonV.data.map((d) => {
          return this.unitConvertFn(d);
        });
      }
      if (header.missing_value) {
        jsonU.data = jsonU.data.map((d) => {
          if (d <= header.missing_value) {
            d = null;
          }
          return d;
        });

        jsonV.data = jsonV.data.map((d) => {
          if (d <= header.missing_value) {
            d = null;
          }
          return d;
        });
      }

      this._initField({
        xmin: header.lo1,
        ymin: header.la1,
        xmax: header.lo2,
        ymax: header.la2,
        deltaX: header.dx,
        deltaY: header.dy,
        cols: header.nx,
        rows: header.ny,
        us: jsonU.data,
        vs: jsonV ? jsonV.data : null,
      });
      this.single = jsonV ? 0 : 1;
    } else {
      header = data.header;
      let xmin, ymin, xmax, ymax, deltaX, deltaY, cols, rows, us;
      if (header.variables.lat) {
        const sequence = header.variables.lat.sequence;
        ymin = sequence.start;
        const delta = sequence.delta;
        const size = sequence.size;
        ymax = ymin + delta * size;
        deltaY = delta;
        rows = size;
      } else if (header.variables.latitude) {
        const sequence = header.variables.latitude.sequence;
        ymin = sequence.start;
        const delta = sequence.delta;
        const size = sequence.size;
        ymax = ymin + delta * size;
        deltaY = delta;
        rows = size;
      } else {
        ymin = header.la1;
        ymax = header.la2;
        deltaY = header.dy;
        rows = header.ny;
      }
      if (header.variables.lon) {
        const sequence = header.variables.lon.sequence;
        xmin = sequence.start;
        const delta = sequence.delta;
        const size = sequence.size;
        xmax = xmin + delta * size;
        deltaX = delta;
        cols = size;
      } else if (header.variables.longitude) {
        const sequence = header.variables.longitude.sequence;
        xmin = sequence.start;
        const delta = sequence.delta;
        const size = sequence.size;
        xmax = xmin + delta * size;
        deltaX = delta;
        cols = size;
      } else {
        xmin = header.la1;
        xmax = header.la2;
        deltaX = header.dx;
        cols = header.nx;
      }
      us = data.data || data.blocks;
      if (this.unitConvertFn) {
        us = us.map((d) => {
          return this.unitConvertFn(d);
        });
      }
      if (header.missing_value) {
        us = us.map((d) => {
          if (d <= header.missing_value) {
            d = null;
          }
          return d;
        });
      }
      this._initField({
        xmin: xmin,
        ymin: ymin,
        xmax: xmax,
        ymax: ymax,
        deltaX: deltaX,
        deltaY: deltaY,
        cols: cols,
        rows: rows,
        us: us,
        vs: null,
      });
      this.single = 1;
    }
    result.single = this.single;
    result.width = this.field.cols;
    result.height = this.field.rows;
    const extent = this.field.extent();
    return new Promise((resolve) => {
      const worker = new Worker("./Stain/StainprocessWorker.js");
      this.worker = worker;
      worker.postMessage([
        this.field.us,
        this.field.vs,
        extent,
        [result.width, result.height],
      ]);
      worker.onmessage = (res) => {
        const data = res.data;
        if (!this.isDestroyed || !this.isDestroyed()) {
          const velocityData = data[0],
            dataExtent = data[1],
            verticesBuffer = data[2],
            indicesBuffer = data[3],
            texCoordBuffer = data[4],
            realExtent = data[5];
          result.indicesBuffer = new Uint32Array(indicesBuffer);
          result.verticesBuffer = new Float32Array(verticesBuffer);
          result.texCoordBuffer = new Float32Array(texCoordBuffer);
          const uvExtent = new Float32Array(dataExtent);
          const uMin = uvExtent[0],
            uMax = uvExtent[1],
            vMin = uvExtent[2],
            vMax = uvExtent[3];
          const positionExtent = new Float32Array(realExtent);
          const xmin = positionExtent[0],
            ymin = positionExtent[1],
            xmax = positionExtent[2],
            ymax = positionExtent[3];
          result.dataExtent = [uMin, uMax, vMin, vMax];
          this.dataExtent = [uMin, uMax, vMin, vMax];
          if (vMin !== 0 && vMax !== 0) {
            const arr = [
              Math.sqrt(uMin * uMin + vMin * vMin),
              Math.sqrt(uMin * uMin + vMax * vMax),
              Math.sqrt(uMax * uMax + vMin * vMin),
              Math.sqrt(uMax * uMax + vMax * vMax),
            ];
            result.dataRange = [0, Math.max(...arr)];
          } else {
            result.dataRange = [uMin, uMax];
          }
          const image = new ImageData(result.width, result.height);
          const imageData = new Uint8Array(velocityData);
          for (let i = 0; i < imageData.length; i++) {
            image.data[i] = imageData[i];
          }
          result.image = image;
          result.extent = [xmin, ymin, xmax, ymax];
          if (this.layer) {
            this.layer.setData(result);
          }
          // worker.removeEventListener("message");
          this._data = result;
          resolve(result);
        }
        // worker.terminate();
      };
    });
  }

  setData(data) {
    return this.formatData(data);
  }

  _initField(data) {
    this.field = new Field(data);
  }

  getValueFromPosition(position) {
    if (this.field) {
      let lon = position[0];
      const lat = position[1];
      if (lon < -180 || lon > 180) {
        lon = mix(lon + 180, 360) - 180;
      }
      return this.field.interpolatedValueAt(lon, lat);
    }
  }

  destroy() {
    this.worker && this.worker.terminate();
    Cesium.destroyObject(this);
  }
}

class ColorLegend {
  constructor(options) {
    this.colors = options.colors || [];
    this.legendType = options.legendType || "gradual";
    this.showType = options.showType || "horizontal";
    this.show = options.show ?? true;
    this.domWidth = options.domWidth || 300;
    this.domHeight = options.domHeight || 25;
    this.domPosition = options.domPosition || { bottom: 30, right: 20 };
    this.domRadius = options.domRadius || 10;
    this.fontColor = options.fontColor || "#FFFFFF";

    this.fontSize = options.fontSize || 14;
    this.fontFamily = options.fontFamily || "黑体";
    this.fontBaseline = options.fontBaseline || "middle";
    this.units = options.units || "";
    this.unitsWidth = options.unitsWidth || 40;
    this.dom = document.createElement("div");
    document.body.appendChild(this.dom);
    this.canvas = document.createElement("canvas");
    this.dom.appendChild(this.canvas);
    this._update();
  }

  _update() {
    this.dom.style.display = this.show ? "" : "none";
    this.dom.style.width = this.domWidth + "px";
    this.dom.style.height = this.domHeight + "px";
    this.dom.style.position = "absolute";
    for (const key in this.domPosition) {
      this.dom.style[key] = this.domPosition[key] + "px";
    }
    this.canvas.style.borderRadius = this.domRadius + "px";
    this.canvas.width = this.domWidth;
    this.canvas.height = this.domHeight;
    const context = this.canvas.getContext("2d");
    if (this.colors[0]) {
      const unitsWidth = this.unitsWidth;
      const renderColors = [this.colors[0]].concat(this.colors);
      let linearGradient, step;
      if (this.showType === "veritical") {
        linearGradient = context.createLinearGradient(
          this.domWidth / 2,
          0,
          this.domWidth / 2,
          this.domHeight
        );
        step = this.domHeight / renderColors.length;
      } else {
        linearGradient = context.createLinearGradient(
          0,
          this.domHeight / 2,
          this.domWidth,
          this.domHeight / 2
        );
        step = (this.domWidth - unitsWidth) / (renderColors.length - 1);
      }
      let offset = 0;
      for (let i = 0; i < renderColors.length; i++) {
        const value = renderColors[i][0];
        const color = renderColors[i][1];

        if (this.showType === "veritical") {
          linearGradient.addColorStop(offset / this.domHeight, color);
          this._drawColors(context, color, 0, offset);
        } else {
          linearGradient.addColorStop(offset / this.domWidth, color);
          this._drawColors(context, color, offset, 0);
        }
        offset += i === 0 ? unitsWidth : step;
      }
      if (this.legendType === "gradual") {
        this._drawColors(context, linearGradient, 0, 0);
      }
      this._drawText(context, renderColors);
    }
  }
  _drawText(context, renderColors) {
    context.fillStyle = this.fontColor;
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    context.textBaseline = this.fontBaseline;
    let text,
      x = 0,
      y = 0,
      overStep = 0;
    for (let i = 0; i < renderColors.length; i++) {
      text = renderColors[i][0];
      if (this.showType === "veritical") {
        const step = this.domHeight / renderColors.length;
        let width = context.measureText(text).width;
        x = this.domWidth / 2 - width / 2;
        y = overStep + this.fontSize / 2;
        if (i === 0) {
          text = this.units;
          width = context.measureText(text).width;
          x = this.domWidth / 2 - width / 2;
        }
        overStep += step;
      } else {
        const step =
          (this.domWidth - this.unitsWidth) / (renderColors.length - 1);
        const width = context.measureText(text).width;
        x =
          this.legendType === "gradual"
            ? overStep
            : overStep + (step - width) / 2;
        if (i === 0) {
          text = this.units;
          x += 5;
          overStep += this.unitsWidth;
        } else {
          overStep += step;
        }
        y = this.domHeight / 2;
      }
      context.fillText(text, x, y);
    }
  }
  _drawColors(context, color, x, y) {
    context.fillStyle = color;
    context.fillRect(x, y, this.domWidth, this.domHeight);
  }

  setColors(colors) {
    this.colors = colors;
  }

  getColors() {}
  _createImage() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 1;
    if (Array.isArray(this.colors) && this.colors.length) {
      const keys = this.colors.map((c) => {
        return parseFloat(c[0]);
      });
      const minKey = Math.min(...keys);
      const maxKey = Math.max(...keys);

      const linearGradient = context.createLinearGradient(0, 0, 256, 0);
      for (let i = 0; i < this.colors.length; i++) {
        context.fillStyle = this.colors[i][1];

        const x = ((this.colors[i][0] - minKey) / (maxKey - minKey)) * 255;
        context.fillRect(x, 0, 256, 1);
        linearGradient.addColorStop(
          (this.colors[i][0] - minKey) / (maxKey - minKey),
          this.colors[i][1]
        );
      }

      if (this.legendType === "gradual") {
        context.clearRect(0, 0, 256, 1);
        context.fillStyle = linearGradient;
        context.fillRect(0, 0, 256, 1);
      }
      const canImageData = context.getImageData(0, 0, 256, 1);
      const imageData = new ImageData(16, 16);
      for (let i = 0; i < canImageData.data.length; i++) {
        imageData.data[i] = canImageData.data[i];
      }

      this.imageData = imageData;
      this.colorRange = [minKey, maxKey];
    }
  }

  getColorRange() {
    if (!this.colorRange) {
      this._createImage();
    }
    return this.colorRange;
  }

  getImageData() {
    if (!this.imageData) {
      this._createImage();
    }
    return this.imageData;
  }

  destroy() {
    document.body.removeChild(this.dom);
    Cesium.destroyObject(this);
  }
}
class StainLayer extends Cesium.ImageryLayer {
  constructor(options) {
    const rectangle = options.extent
      ? Cesium.Rectangle.fromDegrees(options.extent)
      : null;
    const imageryProvider = {
      tilingScheme: new Cesium.GeographicTilingScheme({
        rectangle: rectangle,
        numberOfLevelZeroTilesX: 1,
        numberOfLevelZeroTilesY: 1,
        ellipsoid: options.ellipsoid,
      }),
      maximumLevel: 0,
      minimumLevel: 0,
      _ready: false,
      tileWidth: 0,
      tileHeight: 0,
      hasAlphaChannel: !0,
      get rectangle() {
        return this.tilingScheme.rectangle;
      },
      requestImage: function (x, y, level, request) {
        if (!this.ready)
          throw new Error(
            "requestImage must not be called before the imagery provider is ready."
          );
        return Promise.resolve(this.image);
      },
      get ready() {
        return this._ready;
      },
      get readyPromise() {
        return this._readyPromise;
      },
    };
    super(imageryProvider, options);
    // const _this = this;
    // const resource = Cesium.Resource.createIfNeeded("../Images/test.png");
    // const promise = resource.fetchImage();

    // const resource3 = Cesium.Resource.createIfNeeded("../Images/222.jpg");
    // const promise3 = resource3.fetchImage();
    // Promise.all([promise, promise3]).then((data) => {
    //   _this.image = data[0];
    //   _this.image2 = data[1];
    //   // _this.setData();
    //   _this.isStain = true;
    // });
    // Promise.resolve(promise).then(function (image) {
    //   _this.image = image;
    //   _this.setData();
    //   _this.isStain = true;
    // });
    this.displayRange = null;
    if (options.displayRange) {
      this.displayRange = new Cesium.Cartesian2(
        options.displayRange[0],
        options.displayRange[1]
      );
    }
    this.colorRange = new Cesium.Cartesian2();
    this.layerType = options.layerType ?? null;
    this.colorLegend = new ColorLegend({
      colors: [
        [-40, "#0000FF"],
        [-30, "#000088"],
        [-20, "#9186CE"],
        [-10, "#7AC5BF"],
        [0, "#5F8EC3"],
        [10, "#78921E"],
        [20, "#DFB107"],
        [30, "#E75C15"],
        [40, "#8A2B0A"],
      ],
      units: "℃",
    });
    this.stainProcess = new StainProcess({
      layer: this,
      dataType: "json",
      url: "./Stain/temp.json",
      unitConvertFn: (x) => {
        return x - 273.15;
      },
    });
    this.isStain = true;
  }

  getColorClamp(content) {
    if (!this.colorClamp) {
      const colorRange = this.colorLegend.getColorRange();
      this.colorRange.x = colorRange[0];
      this.colorRange.y = colorRange[1];
      const imageData = this.colorLegend.getImageData();
      this.colorClamp = new Cesium.Texture({
        context: content,
        source: imageData,
        flipY: false,
        pixelFormat: this.imageryProvider.hasAlphaChannel
          ? Cesium.PixelFormat.RGBA
          : Cesium.PixelFormat.RGB,
      });
    }
    return this.colorClamp;
  }

  setData(data) {
    if (data) {
      if (data.extent) {
        this.imageryProvider.tilingScheme = new Cesium.GeographicTilingScheme({
          rectangle: Cesium.Rectangle.fromDegrees(...data.extent),
          numberOfLevelZeroTilesX: 1,
          numberOfLevelZeroTilesY: 1,
        });
      }
      this.colorRange = new Cesium.Cartesian2(
        data.dataRange[0],
        data.dataRange[1]
      );
      if (!this.displayRange) {
        this.displayRange = new Cesium.Cartesian2(...data.dataRange);
      }

      this.uvRange = new Cesium.Cartesian4(
        data.dataExtent[0],
        data.dataExtent[1],
        data.dataExtent[2],
        data.dataExtent[3]
      );
      this.image = data.image;
      this.stainRang = new Cesium.Cartesian2(data.width, data.height);
      this.single = data.single ?? 0;
      this.imageryProvider.image = this.image;
      this.imageryProvider.tileWidth = data.image.width;
      this.imageryProvider.tileHeight = data.image.height;
      this.imageryProvider._ready = true;
      this.imageryProvider._readyPromise = Promise.resolve(true);
    } else {
      this.imageryProvider._ready = false;
      this.imageryProvider._readyPromise = Promise.reject(false);
    }
  }
}
function makeStainLayer(viewer) {
  const layer = new StainLayer({});
  // layer.setData();
  viewer.imageryLayers.add(layer);
}
export { makeStainLayer };
