import { Player } from '../index';
import { TaskScheduler } from '../utils';

// const a = new Player('playerContainer');
// const b = new Player('playerContainer1');
// const c = new Player('playerContainer2');

// Promise.all([a.loadImages(), b.loadImages(), c.loadImages()]).then(() => {
//   let frameIndex = 0;
//   const loopId = setInterval(() => {
//     if (frameIndex > 99) {
//       clearInterval(loopId);
//       return;
//     }
//     const s = new Date().getTime();
//     a.render(frameIndex);
//     b.render(frameIndex);
//     c.render(frameIndex);
//     const e = new Date().getTime();
//     console.log('render duration:', e - s);
//     ++frameIndex;
//   }, 100);
// });

const scheduler = new TaskScheduler();

for (let i = 0; i < 100; ++i) {
  scheduler
    .push(function () {
      return new Promise((resolve, reject) => {
        const r = i;
        setTimeout(() => {
          try {
            if (r === 3) {
              throw 'error 3';
            }
            resolve(r);
          } catch (e) {
            reject(e);
          }
        }, 1000);
      });
    })
    .then((r) => {
      console.log('result: ', r);
    })
    .catch((e) => {
      console.log('error: ', e);
    });
}

setTimeout(() => {
  console.log('start stop');
  scheduler.clear().finally(() => {
    console.log('end stop');
    console.log(scheduler);
  });
}, 4287);
