import { PolylineInfo, RectangleInfo } from '../src';

const polylineDemo = {
  id: 0,
  points: [
    { x: 123.5, y: 387.982 },
    { x: 223.5, y: 307.9 },
    { x: 423.5, y: 60.9 },
    { x: 323.5, y: 312.9 },
    { x: 23.5, y: 198.9 },
  ]
}

const rectangleDemo = {
  id: 0,
  position: {
    x: 200,
    y: 300
  },
  dimension: {
    width: 400,
    height: 300
  }
}

const offsets: number[] = [];
for (let i = 0; i < 100; ++i) {
  offsets[i] = i;
}

const counts: number[] = [];
for (let i = 0; i < 100; ++i) {
  counts[i] = i;
}

export const polylines = offsets.map((o, i) => {
  const on = o * 2.8;
  return counts.map(r => {
    const pp = r * 2.8
    return {
      id: i.toString(),
      type: 'polyline',
      fillColor: 'transparent',
      strokeColor: 'green',
      strokeWidth: 3,
      points: polylineDemo.points.map(p => ({
        x: p.x + on,
        y: p.y + pp
      }))
    } as PolylineInfo
  })
});

export const rectangles = offsets.map((o, i) => {
  const on = o * 2.8;
  return counts.map(r => {
    const pp = r * 2.8
    return {
      id: i.toString(),
      type: 'rectangle',
      fillColor: 'transparent',
      strokeColor: 'red',
      strokeWidth: 2,
      left: rectangleDemo.position.x + on,
      top: rectangleDemo.position.y + pp,
      width: rectangleDemo.dimension.width,
      height: rectangleDemo.dimension.height,
      angle: 0
    } as RectangleInfo
  })
})
