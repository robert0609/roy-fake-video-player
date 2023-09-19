import { fabric } from 'fabric';
import { polylines, rectangles } from '../mock/labelData';
import img1 from '../mock/1.jpg';
import img2 from '../mock/2.jpg';

export class Player {
  private _canvas: fabric.StaticCanvas;
  private _images: fabric.Image[] = [];

  constructor(containerElementId: string) {
    this._canvas = new fabric.StaticCanvas(containerElementId, {
      width: 1920,
      height: 1080,
      renderOnAddRemove: false
    });
  }

  render(frameIndex: number) {
    this._canvas.clear();
    this._canvas.add(this._images[frameIndex % 2]);

    const rects = rectangles[frameIndex];
    this._canvas.add(
      ...rects.map(
        (rect) =>
          new fabric.Rect({
            left: rect.position.x,
            top: rect.position.y,
            width: rect.dimension.width,
            height: rect.dimension.height,
            fill: 'transparent',
            stroke: 'green',
            strokeWidth: 2,
            objectCaching: false
          })
      )
    );
    const lines = polylines[frameIndex];
    this._canvas.add(
      ...lines.map(
        (line) =>
          new fabric.Polyline(line.points, {
            fill: 'transparent',
            stroke: 'yellow',
            strokeWidth: 2,
            objectCaching: false
          })
      )
    );

    this._canvas.requestRenderAll();
    // rectangles.forEach(rect => {
    //   this._canvas.add(new fabric.Rect({
    //     left: rect.position.x,
    //     top: rect.position.y,
    //     width: rect.dimension.width,
    //     height: rect.dimension.height,
    //     fill: 'white',
    //     stroke: 'green',
    //     strokeWidth: 2
    //   }))
    // })
    // polylines.forEach(line => {
    //   this._canvas.add(new fabric.Polyline(line.points, {
    //     fill: 'white',
    //     stroke: 'yellow',
    //     strokeWidth: 2
    //   }));
    // });
  }

  async loadImages() {
    this._images = (await Promise.all([loadImage(img1), loadImage(img2)])).map(
      (img) =>
        new fabric.Image(img, {
          objectCaching: false
        })
    );
  }
}

export async function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const loadImg = document.createElement('img');
    loadImg.setAttribute('crossOrigin', 'Anonymous');
    loadImg.src = `${url}`;
    loadImg.onload = () => {
      resolve(loadImg);
    };
    loadImg.onerror = (evt) => {
      reject(evt);
    };
  });
}
