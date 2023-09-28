import { FabricImage, BaseInfo } from './type';
import { TaskScheduler } from './utils';

/**
 * 能够被播放的流数据结构
 */
export abstract class FrameStream {
  private _images: (FabricImage | undefined)[] = [];
  private _dataInfos: (BaseInfo[] | undefined)[] = [];

  readonly totalDuration: number;
  private readonly _maxFrameCount: number;

  private _frameDuration: number;

  // 帧数据的最大缓存数量，超过这个数量就会按照存储时间的顺序，先存在的数据会被清除
  private _maxCacheFrameCount: number;
  // 已经缓存住了的帧数据的帧索引数据
  private _alreadyCacheFrames: number[] = [];

  private _scheduler = new TaskScheduler(10);

  constructor(
    private readonly startTimestamp: number,
    private readonly endTimestamp: number,
    {
      frameDuration = 100,
      maxCacheFrameCount = 200
    }: { frameDuration?: number; maxCacheFrameCount?: number } = {}
  ) {
    this._frameDuration = frameDuration;
    this._maxCacheFrameCount = maxCacheFrameCount;

    this.totalDuration = endTimestamp - startTimestamp;
    this._maxFrameCount = Math.ceil(this.totalDuration / this._frameDuration);
  }

  abstract fetchImage(): Promise<FabricImage>;
  abstract fetchDataInfos(): Promise<BaseInfo[]>;

  private getFrameIndexByTimestamp(timestamp: number) {
    const d = timestamp - this.startTimestamp;
    return Math.floor(d / this._frameDuration);
  }

  async seek(timestamp: number) {
    await this._scheduler.clear();

    const index = this.getFrameIndexByTimestamp(timestamp);
    if (index < 0 || index > this._maxFrameCount) {
      throw new Error(`获取帧数据失败：时间戳超出了数据流的时间范围`);
    }
    // 从获取的索引位置开始获取后续帧数据
    for (let i = index; i < this._maxFrameCount; ++i) {
      if (this._images[i] === undefined || this._dataInfos[i] === undefined) {
        // 发起加载任务
        this._scheduler.push(() =>
          Promise.all([this.fetchImage(), this.fetchDataInfos()]).then(
            ([img, dataInfos]) => {
              this._images[i] = img;
              this._dataInfos[i] = dataInfos;
              // 记录下已经获取到数据的帧索引
              this._alreadyCacheFrames.push(i);
              while (
                this._alreadyCacheFrames.length > this._maxCacheFrameCount
              ) {
                const recycleIndex = this._alreadyCacheFrames.shift()!;
                this._images[recycleIndex] = undefined;
                this._dataInfos[recycleIndex] = undefined;
              }
            }
          )
        );
      }
    }
  }
}
