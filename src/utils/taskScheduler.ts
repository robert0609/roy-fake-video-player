export class TaskScheduler {
  // 任务列表
  private tasks: (() => Promise<any>)[] = [];
  // 标记当前同时在执行的任务数量
  private executingCount = 0;
  // 当队列中的任务全部执行完毕之后，触发
  private onFinish?: () => void;

  constructor(private limit: number = 10) {}

  // 执行下一个任务
  private next() {
    // 取出下一个可以执行的任务，必须要满足并发执行限制的
    while (this.tasks.length > 0 && this.executingCount < this.limit) {
      this.executingCount += 1;
      const taskFn = this.tasks.shift();
      const p = taskFn!();
      // 在每个任务执行完毕的时候，执行下一个可以执行的任务
      p.then(() => {
        this.executingCount -= 1;
        if (this.executingCount === 0) {
          this.onFinish && this.onFinish();
        }
        this.next();
      });
    }
  }

  push<T>(fn: () => Promise<T>): Promise<T> {
    // 将每个异步任务的执行包装成Promise，主要是为了将后续任务处理流程的触发器resolve和reject记录下来，并根据异步任务的执行结果，去延迟调用
    const pro = new Promise<T>((resolve, reject) => {
      // 异步任务封装到一个函数里面，为了灵活的增加对异步任务结果的处理逻辑
      this.tasks.push(function () {
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
      this.tasks = [];
      if (this.executingCount > 0) {
        // 如果有正在执行中的任务，则等待执行完毕
        this.onFinish = resolve;
      } else {
        resolve();
      }
    }).finally(() => {
      // 清理现场
      this.onFinish = undefined;
    });
  }
}
