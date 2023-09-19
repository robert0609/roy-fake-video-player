import { Player } from '../index';

const a = new Player('playerContainer');
const b = new Player('playerContainer1');
const c = new Player('playerContainer2');

Promise.all([a.loadImages(), b.loadImages(), c.loadImages()]).then(() => {
  let frameIndex = 0;
  const loopId = setInterval(() => {
    if (frameIndex > 99) {
      clearInterval(loopId);
      return;
    }
    const s = new Date().getTime();
    a.render(frameIndex);
    b.render(frameIndex);
    c.render(frameIndex);
    const e = new Date().getTime();
    console.log('render duration:', e - s);
    ++frameIndex;
  }, 100);
});
