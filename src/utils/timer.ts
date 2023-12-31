export class FrameTimer {
  private _lastRunTimestamp = 0;
  private _isRunning = false;

  fps?: number;

  get isRunning() {
    return this._isRunning;
  }

  constructor(private readonly render: () => Promise<void>, private readonly intervalDuration: number) {}

  start() {
    this._isRunning = true;
    this.loop();
  }

  private loop() {
    if (!this._isRunning) {
      return;
    }

    const ts = new Date().getTime();
    const timespan = ts - this._lastRunTimestamp;
    if (this._lastRunTimestamp === 0 || timespan >= this.intervalDuration) {
      // 执行每帧逻辑
      // 计算fps
      if (this._lastRunTimestamp > 0) {
        this.fps = 1000 / timespan;
      }
      this.render()
        .catch((e) => {
          console.warn('帧逻辑执行失败：', e);
        })
        .finally(() => {
          this._lastRunTimestamp = ts;
          window.requestAnimationFrame(this.loop.bind(this));
        });
    } else {
      window.requestAnimationFrame(this.loop.bind(this));
    }
  }

  stop() {
    this._isRunning = false;
    this._lastRunTimestamp = 0;
  }
}
