export class TaskScheduler {
  // 任务列表
  private _tasks: (() => Promise<any>)[] = [];
  // 标记当前同时在执行的任务数量
  private _executingCount = 0;
  // 当队列中的任务全部执行完毕之后，触发
  private _onFinish?: () => void;

  get executingCount() {
    return this._executingCount;
  }

  constructor(private limit: number = 10) {}

  // 执行下一个任务
  private next() {
    // 取出下一个可以执行的任务，必须要满足并发执行限制的
    while (this._tasks.length > 0 && this._executingCount < this.limit) {
      this._executingCount += 1;
      console.log('start a new task. current executing:', this.executingCount);
      const taskFn = this._tasks.shift();
      const p = taskFn!();
      // 在每个任务执行完毕的时候，执行下一个可以执行的任务
      p.then(() => {
        this._executingCount -= 1;
        console.log('end a task. current executing:', this.executingCount);
        if (this._executingCount === 0) {
          this._onFinish && this._onFinish();
        }
        this.next();
      });
    }
  }

  push<T = void>(fn: () => Promise<T>): Promise<T> {
    // 将每个异步任务的执行包装成Promise，主要是为了将后续任务处理流程的触发器resolve和reject记录下来，并根据异步任务的执行结果，去延迟调用
    const pro = new Promise<T>((resolve, reject) => {
      // 异步任务封装到一个函数里面，为了灵活的增加对异步任务结果的处理逻辑
      this._tasks.push(function () {
        const p = fn();
        return p.then(resolve).catch(reject);
      });
    });
    // 启动任务执行
    this.next();
    return pro;
  }

  async clear() {
    return new Promise<void>((resolve) => {
      this._tasks = [];
      if (this._executingCount > 0) {
        // 如果有正在执行中的任务，则等待执行完毕
        this._onFinish = resolve;
      } else {
        resolve();
      }
    }).finally(() => {
      // 清理现场
      this._onFinish = undefined;
    });
  }
}
