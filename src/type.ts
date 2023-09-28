import { fabric } from 'fabric';

type PointInfo = { x: number; y: number };

export interface BaseInfo {
  id: string;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface PolylineInfo extends BaseInfo {
  points: PointInfo[];
}

export interface RectangleInfo extends BaseInfo {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
}

export interface PolygonInfo extends BaseInfo {
  points: PointInfo[];
}

export interface CircleInfo extends BaseInfo {
  origin: PointInfo;
  radius: number;
}

export interface EllipseInfo extends BaseInfo {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
}

interface DataInfoMap {
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
