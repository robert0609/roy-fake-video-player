import { fabric } from 'fabric';

type PointInfo = { x: number; y: number };

export interface BaseInfo<T extends ShapeType = ShapeType> {
  id: string;
  type: T;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface PolylineInfo extends BaseInfo<'polyline'> {
  points: PointInfo[];
}

export interface RectangleInfo extends BaseInfo<'rectangle'> {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
}

export interface PolygonInfo extends BaseInfo<'polygon'> {
  points: PointInfo[];
}

export interface CircleInfo extends BaseInfo<'circle'> {
  origin: PointInfo;
  radius: number;
}

export interface EllipseInfo extends BaseInfo<'ellipse'> {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
}

export interface DataInfoMap {
  ['polyline']: PolylineInfo;
  ['polygon']: PolygonInfo;
  ['rectangle']: RectangleInfo;
  ['circle']: CircleInfo;
  ['ellipse']: EllipseInfo;
}

export type ShapeType = keyof DataInfoMap;

export interface BaseImage {
  id: string;
}

export interface FrameImage extends BaseImage {
  image: HTMLImageElement;
}

export type FabricImage = BaseImage & {
  image: fabric.Image;
};
