import { fabric } from 'fabric';
import { FrameStream } from './stream';
import { FrameTimer } from './utils';
import { FabricImage, BaseInfo, PolylineInfo, PolygonInfo, RectangleInfo, CircleInfo, EllipseInfo } from './type';
import mitt, { Handler } from 'mitt';

export type PlayEvents = {
  ['ready']: undefined;
  ['progress']: { timestamp: number };
};
export type PlayEventsNames = keyof PlayEvents;

export class Player {
  private _eventBus = mitt<PlayEvents>();

  private _canvas: fabric.StaticCanvas;
  private _stream: FrameStream;
  private _timer?: FrameTimer;

  private _isInited = false;

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

  /**
   * 判断是否还能继续播放
   */
  get canContinuePlay() {
    return this._stream.progressTimestamp + this._stream.startTimestamp < this._stream.endTimestamp;
  }

  constructor(containerElementId: string, stream: FrameStream, { width = 800, height = 600, onError }: { width?: number; height?: number; onError?: (e: Error) => void } = {}) {
    this._canvas = new fabric.StaticCanvas(containerElementId, {
      width,
      height,
      renderOnAddRemove: false
    });
    this._stream = stream;
    stream
      .getCurrentFrame()
      .then(([firstFrame, dataInfos]) => {
        // 根据首帧数据调整播放器尺寸
        this.fitDimension(firstFrame.image.width!, firstFrame.image.height!);
        // 渲染首帧作为封面
        this.render({
          image: firstFrame,
          data: dataInfos
        });
        this._isInited = true;
      })
      .catch((e) => {
        console.error('播放器获取首帧数据失败', e);
        if (!!onError) {
          onError(new Error('播放器获取首帧数据失败'));
        }
      });
  }

  on<T extends PlayEventsNames = PlayEventsNames>(eventName: T, handler: Handler<PlayEvents[T]>) {
    this._eventBus.on(eventName, handler);
  }

  off<T extends PlayEventsNames = PlayEventsNames>(eventName: T, handler: Handler<PlayEvents[T]>) {
    this._eventBus.off(eventName, handler);
  }

  async start() {
    if (this._isInited !== true) {
      throw new Error(`开始播放失败：播放器尚未初始化`);
    }
    if (!this._timer) {
      this._timer = new FrameTimer(async () => {
        try {
          const frameData = await this._stream.current();
          if (!!frameData) {
            if (frameData.code === 0) {
              // 渲染帧数据
              this.render(frameData.result!);
              // 触发进度事件
              this._eventBus.emit('progress', { timestamp: this.progress });
            } else if (frameData.code === 1) {
              await this.stop();
            }
          }
        } catch {
          console.warn(`获取当前帧数据失败`);
        }
      }, 100);
    }
    if (this._timer.isRunning) {
      throw new Error(`开始播放失败：计时器已经在运行`);
    }
    // 开始缓冲数据
    if (!this.canContinuePlay) {
      await this._stream.seek();
    }
    this._timer.start();
  }

  async pause() {
    if (this._isInited !== true) {
      throw new Error(`停止播放失败：播放器尚未初始化`);
    }
    if (!this._timer) {
      throw new Error(`停止播放失败：未初始化计时器`);
    }
    this._timer.stop();
  }

  async seek(timestamp: number) {
    if (this._isInited !== true) {
      throw new Error(`跳转播放失败：播放器尚未初始化`);
    }
    await this._stream.seek(timestamp);
    if (!this.isPlaying) {
      const [frameImageInfo, dataInfos] = await this._stream.getCurrentFrame();
      this.render({
        image: frameImageInfo,
        data: dataInfos
      });
      // 触发进度事件
      this._eventBus.emit('progress', { timestamp: this.progress });
    }
  }

  async stop() {
    await this.pause();
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
    this._canvas.renderAll();
  }

  private fitDimension(width: number, height: number) {
    // 先调整宽高比
    const calcHeight = (height / width) * this._canvas.getWidth();
    this._canvas.setHeight(calcHeight);
    // 缩放
    //@ts-ignore
    const scale: number = fabric.util.findScaleToFit({ width, height }, { width: this._canvas.getWidth(), height: this._canvas.getHeight() });
    // @ts-ignore
    const transformMatrix: number[] = fabric.util.calcDimensionsMatrix({ scaleX: scale, scaleY: scale });

    this._canvas.setViewportTransform(transformMatrix);
  }
}
