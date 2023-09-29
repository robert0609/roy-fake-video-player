import { fabric } from 'fabric';
import { FrameStream } from './stream';
import { FrameTimer } from './utils';
import { FabricImage, BaseInfo, PolylineInfo, PolygonInfo, RectangleInfo, CircleInfo, EllipseInfo } from './type';

export class Player {
  private _canvas: fabric.StaticCanvas;
  private _stream: FrameStream;
  private _timer?: FrameTimer;

  /**
   * 是否在播放中
   */
  get isPlaying() {
    if (!this._timer) {
      return false;
    } else {
      return this._timer.isRunning;
    }
  }

  /**
   * 当前播放进度的时间戳
   */
  get progress() {
    return this._stream.progressTimestamp;
  }

  constructor(containerElementId: string, stream: FrameStream) {
    this._canvas = new fabric.StaticCanvas(containerElementId, {
      width: 1920,
      height: 1080,
      renderOnAddRemove: false
    });
    this._stream = stream;
  }

  async start() {
    if (!this._timer) {
      this._timer = new FrameTimer(() => {
        this._stream
          .current()
          .then((frameData) => {
            if (!!frameData) {
              // 渲染帧数据
              this.render(frameData);
            }
          })
          .catch(() => {
            console.warn(`获取当前帧数据失败`);
          });
      }, 100);
    }
    if (this._timer.isRunning) {
      throw new Error(`开始播放失败：计时器已经在运行`);
    }
    this._timer.start();
    // 开始缓冲数据
    await this._stream.seek();
  }

  async pause() {
    if (!this._timer) {
      throw new Error(`停止播放失败：未初始化计时器`);
    }
    this._timer.stop();
  }

  async seek(timestamp: number) {
    if (!this._timer) {
      throw new Error(`跳转播放失败：未初始化计时器`);
    }
    await this._stream.seek(timestamp);
  }

  async stop() {
    await this.pause();
    // 停止的时候回到起始位置
    await this._stream.seek();
  }

  private render(frameData: { image: FabricImage; data: BaseInfo[] | undefined }) {
    this._canvas.clear();
    this._canvas.add(frameData.image.image);

    if (!!frameData.data) {
      for (const shape of frameData.data) {
        switch (shape.type) {
          case 'polyline': {
            const geo = shape as PolylineInfo;
            this._canvas.add(
              new fabric.Polyline(geo.points, {
                fill: geo.fillColor,
                stroke: geo.strokeColor,
                strokeWidth: geo.strokeWidth,
                objectCaching: false
              })
            );
            break;
          }
          case 'polygon': {
            const geo = shape as PolygonInfo;
            this._canvas.add(
              new fabric.Polygon(geo.points, {
                fill: geo.fillColor,
                stroke: geo.strokeColor,
                strokeWidth: geo.strokeWidth,
                objectCaching: false
              })
            );
            break;
          }
          case 'rectangle': {
            const geo = shape as RectangleInfo;
            this._canvas.add(
              new fabric.Rect({
                fill: geo.fillColor,
                stroke: geo.strokeColor,
                strokeWidth: geo.strokeWidth,
                objectCaching: false,
                left: geo.left,
                top: geo.top,
                width: geo.width,
                height: geo.height,
                angle: geo.angle
              })
            );
            break;
          }
          case 'circle': {
            const geo = shape as CircleInfo;
            this._canvas.add(
              new fabric.Circle({
                fill: geo.fillColor,
                stroke: geo.strokeColor,
                strokeWidth: geo.strokeWidth,
                objectCaching: false,
                left: geo.origin.x,
                top: geo.origin.y,
                originX: 'center',
                originY: 'center',
                radius: geo.radius
              })
            );
            break;
          }
          case 'ellipse': {
            const geo = shape as EllipseInfo;
            this._canvas.add(
              new fabric.Ellipse({
                fill: geo.fillColor,
                stroke: geo.strokeColor,
                strokeWidth: geo.strokeWidth,
                objectCaching: false,
                left: geo.left,
                top: geo.top,
                width: geo.width,
                height: geo.height,
                rx: geo.width / 2,
                ry: geo.height / 2,
                angle: geo.angle
              })
            );
            break;
          }
        }
      }
    }
    this._canvas.requestRenderAll();
  }
}
