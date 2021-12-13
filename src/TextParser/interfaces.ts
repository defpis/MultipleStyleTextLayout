export interface Point {
  x: number;
  y: number;
}

export interface Line {
  p0: Point;
  p1: Point;
}

export type Polygon = Point[];

export interface Group {
  polygon: Polygon;
  area: number;
  children: Group[];
}

export interface QuadraticBezier {
  p0: Point;
  p1: Point;
  p2: Point;
}

export interface CubicBezier {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

export interface Triangle<T = Point> {
  p0: T;
  p1: T;
  p2: T;
}

export interface KLMPoint extends Point {
  k: number;
  l: number;
  m: number;
}

export type KMLTriangle = Triangle<KLMPoint>;

export enum FillSideType {
  Left = "LEFT",
  Right = "RIGHT",
}

export enum CurveType {
  Serpentine = "SERPENTINE",
  Loop = "LOOP",
  Cusp = "CUSP",
  Quadratic = "QUADRATIC",
  LineOrPoint = "LINE_OR_POINT",
}
