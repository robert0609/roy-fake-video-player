import { FabricImage, BaseInfo } from './type';
import { TaskScheduler } from './utils';
import mitt, { type Handler } from 'mitt';

export type FrameStreamEvents = {
  ['onPending']: undefined;
  ['onResume']: undefined;
  ['onCancel']: undefined;
};

export type FrameStreamEventsNames = keyof FrameStreamEvents;

/**
 * 能够被播放的流数据结构
 */
export abstract class FrameStream {
  private _eventBus = mitt<FrameStreamEvents>();
  // 播放的帧数据列表
  private _images: (FabricImage | undefined)[] = [];
  private _dataInfos: (BaseInfo[] | undefined)[] = [];

  /**
   * 总时长
   */
  readonly totalDuration: number;

  // 按照时长折算的总帧数
  private readonly _maxFrameCount: number;
  /**
   * 按照时长折算的总帧数
   */
  get maxFrameCount() {
    return this._maxFrameCount;
  }
  // 每一帧的时长
  private _frameDuration: number;

  // 当前播放进度的帧索引
  private _progressIndex = 0;
  /**
   * 当前数据缓冲进度的帧索引
   */
  get bufferProgressIndex() {
    let idx = this._progressIndex;
    for (let i = idx; i < this._maxFrameCount; ++i) {
      idx = i;
      if (!this._images[i]) {
        break;
      }
    }
    return idx;
  }
  /**
   * 当前播放进度的时间戳
   */
  get progressTimestamp() {
    return this._progressIndex * this._frameDuration;
  }

  // 帧数据的最大缓存数量，超过这个数量就会按照存储时间的顺序，先存在的数据会被清除
  private _maxCacheFrameCount: number;
  // 已经缓存住了的帧数据的帧索引数据
  private _alreadyCacheFrames: number[] = [];

  // 数据加载的任务调度器，同时并发加载任务的数量为10个
  private _scheduler = new TaskScheduler(10);

  // 帧数据获取的中继器，当通过current方法获取当前帧数据的时候，可能当前帧数据尚未加载完成，因此会使用这个变量缓存一下中断器
  private _frameContinuer?: { resolve: () => void; reject: () => void };

  constructor(
    private readonly startTimestamp: number,
    private readonly endTimestamp: number,
    { frameDuration = 100, maxCacheFrameCount }: { frameDuration?: number; maxCacheFrameCount?: number } = {}
  ) {
    this._frameDuration = frameDuration;

    this.totalDuration = endTimestamp - startTimestamp;
    this._maxFrameCount = Math.ceil(this.totalDuration / this._frameDuration);

    this._maxCacheFrameCount = maxCacheFrameCount === undefined ? this._maxFrameCount : maxCacheFrameCount;
  }

  on<T extends FrameStreamEventsNames = FrameStreamEventsNames>(eventName: T, handler: Handler<FrameStreamEvents[T]>) {
    this._eventBus.on(eventName, handler);
  }

  off<T extends FrameStreamEventsNames = FrameStreamEventsNames>(eventName: T, handler: Handler<FrameStreamEvents[T]>) {
    this._eventBus.off(eventName, handler);
  }

  /**
   * 获取帧图像的方法，由子类实现
   */
  protected abstract fetchImage(): Promise<FabricImage>;
  /**
   * 获取每一帧数据的方法，由子类实现
   */
  protected abstract fetchDataInfos(): Promise<BaseInfo[]>;

  private getFrameIndexByTimestamp(timestamp: number) {
    const d = timestamp - this.startTimestamp;
    return Math.floor(d / this._frameDuration);
  }

  /**
   * 跳转到数据流的指定时间戳位置
   */
  async seek(timestamp: number = this.startTimestamp) {
    const index = this.getFrameIndexByTimestamp(timestamp);
    if (index < 0 || index >= this._maxFrameCount) {
      throw new Error(`获取帧数据失败：时间戳超出了数据流的时间范围`);
    }
    // 清除之前的加载任务
    await this._scheduler.clear();
    // 清除之前的current请求
    if (this._frameContinuer !== undefined) {
      this._frameContinuer.reject();
    }
    this._progressIndex = index;

    // 从获取的索引位置开始缓冲后续帧数据
    for (let i = index; i < this._maxFrameCount; ++i) {
      if (this._images[i] === undefined || this._dataInfos[i] === undefined) {
        // 发起加载任务
        this._scheduler.push(() =>
          Promise.all([this.fetchImage(), this.fetchDataInfos()]).then(([img, dataInfos]) => {
            this._images[i] = img;
            this._dataInfos[i] = dataInfos;
            // 记录下已经获取到数据的帧索引
            this._alreadyCacheFrames.push(i);
            // 如果有当前帧索引的等待获取数据的请求，则这里触发一下
            if (this._progressIndex === i && this._frameContinuer !== undefined) {
              this._frameContinuer.resolve();
            }
            while (this._alreadyCacheFrames.length > this._maxCacheFrameCount) {
              const recycleIndex = this._alreadyCacheFrames.shift()!;
              this._images[recycleIndex] = undefined;
              this._dataInfos[recycleIndex] = undefined;
            }
          })
        );
      }
    }
  }

  /**
   * 获取当前帧的数据
   */
  async current() {
    if (this._frameContinuer !== undefined) {
      // 如果_frameContinuer不为空，则证明有一个current方法的调用尚未结束，因此退出
      return;
    }
    if (this._progressIndex < 0 || this._progressIndex >= this._maxFrameCount) {
      // 此时认为播放结束
      return;
    }
    if (!this._images[this._progressIndex]) {
      // 此时该帧数据还未加载到本地，则要触发pending和resume事件
      try {
        this._eventBus.emit('onPending');
        await new Promise<void>((resolve, reject) => {
          this._frameContinuer = { resolve, reject };
        });
        this._eventBus.emit('onResume');
      } catch {
        this._eventBus.emit('onCancel');
        return;
      } finally {
        this._frameContinuer = undefined;
      }
    }
    const result = {
      image: this._images[this._progressIndex]!,
      data: this._dataInfos[this._progressIndex]
    };

    this._progressIndex += 1;

    return result;
  }
}
