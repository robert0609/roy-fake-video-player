import { fabric } from 'fabric';
import { Player, FrameStream, BaseInfo, DataInfoMap, FabricImage } from '../index';

const imageNames = [
  '1683804919-885000_front-wide_.jpg',
  '1683804919-985000_front-wide_.jpg',
  '1683804920-085000_front-wide_.jpg',
  '1683804920-385000_front-wide_.jpg',
  '1683804920-585000_front-wide_.jpg',
  '1683804920-785000_front-wide_.jpg',
  '1683804921-085000_front-wide_.jpg',
  '1683804921-385000_front-wide_.jpg',
  '1683804921-585000_front-wide_.jpg',
  '1683804921-785000_front-wide_.jpg'
].map((n) => `http://localhost:7011/${n}`);

const images: string[] = [];
for (let i = 0; i < 10; ++i) {
  images.push(...imageNames);
}

async function loadImage(url: string) {
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

class DemoStream extends FrameStream {
  protected async fetchImage(index: number): Promise<FabricImage> {
    const img = await loadImage(images[index]);
    return {
      id: index.toString(),
      image: new fabric.Image(img, {
        objectCaching: false
      })
    };
  }
  protected async fetchDataInfos(index: number): Promise<BaseInfo<keyof DataInfoMap>[]> {
    return [];
  }
}

const startTime = new Date();
const endTime = new Date(startTime.getTime() + 10 * 1000);
const demoStream = new DemoStream(startTime.getTime(), endTime.getTime());
const demoPlayer = new Player('playerContainer', demoStream);

demoPlayer.start();
