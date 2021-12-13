import { Line, Point, Polygon, Triangle } from "./interfaces";

export const sub = (p1: Point, p2: Point) => ({
  x: p1.x - p2.x,
  y: p1.y - p2.y,
});

export const length = (p: Point) => Math.sqrt(p.x * p.x + p.y * p.y);

export const dot = (p1: Point, p2: Point) => p1.x * p2.x + p1.y * p2.y;

export const determinant2 = (p1: Point, p2: Point) => p1.x * p2.y - p1.y * p2.x;

export const polygonAreaSigned = (polygon: Polygon): number => {
  if (polygon.length < 3) {
    return 0;
  }

  let area = 0;
  const lastIndex = polygon.length - 1;

  for (let i = 0; i < lastIndex; i++) {
    area += determinant2(polygon[i], polygon[i + 1]);
  }

  area += determinant2(polygon[lastIndex], polygon[0]);

  return area / 2;
};

export const lineIntersectCheck = (line1: Line, line2: Line) => {
  const a = Math.min(line1.p0.x, line1.p1.x);
  const b = Math.min(line1.p0.y, line1.p1.y);

  const c = Math.max(line1.p0.x, line1.p1.x);
  const d = Math.max(line1.p0.y, line1.p1.y);

  const e = Math.min(line2.p0.x, line2.p1.x);
  const f = Math.min(line2.p0.y, line2.p1.y);

  const g = Math.max(line2.p0.x, line2.p1.x);
  const h = Math.max(line2.p0.y, line2.p1.y);

  if (a >= g || b >= h || e >= c || f >= d) {
    return false;
  }

  const AB = sub(line1.p1, line1.p0);
  const AC = sub(line2.p0, line1.p0);
  const AD = sub(line2.p1, line1.p0);

  const CD = sub(line2.p1, line2.p0);
  const CA = sub(line1.p0, line2.p0);
  const CB = sub(line1.p1, line2.p0);

  if (
    determinant2(AB, AC) * determinant2(AB, AD) >= 0 ||
    determinant2(CD, CA) * determinant2(CD, CB) >= 0
  ) {
    return false;
  }

  return true;
};

export const EPSILON = 1e-9;

export const insidePolygon = (polygon: Polygon, p: Point) => {
  if (polygon.length < 3) {
    return false;
  }
  let count = 0;
  let curr = polygon[polygon.length - 1];
  polygon.forEach((next) => {
    const p1 = curr.y < next.y ? curr : next;
    const p2 = curr.y < next.y ? next : curr;
    if (
      p1.y < p.y + EPSILON &&
      p2.y > p.y + EPSILON &&
      determinant2(
        { x: p2.x - p1.x, y: p2.y - p1.y },
        { x: p.x - p1.x, y: p.y - p1.y }
      ) > 0
    ) {
      count += 1;
    }
    curr = next;
  });
  return count % 2 !== 0;
};

export const roundToZero = (n: number) => {
  return n > -EPSILON && n < EPSILON ? 0 : n;
};

export const approxEqual = (p1: Point, p2: Point) => {
  return length(sub(p1, p2)) < EPSILON;
};

export const pointInsideTriangle = (triangle: Triangle, p: Point) => {
  const { p0, p1, p2 } = triangle;

  const AC = sub(p2, p0);
  const AB = sub(p1, p0);
  const AP = sub(p, p0);

  const dot00 = dot(AC, AC);
  const dot01 = dot(AC, AB);
  const dot02 = dot(AC, AP);
  const dot11 = dot(AB, AB);
  const dot12 = dot(AB, AP);

  const denominator = dot00 * dot11 - dot01 * dot01;

  if (!denominator) {
    return false;
  }

  const inverseDenominator = 1 / denominator;

  const u = (dot11 * dot02 - dot01 * dot12) * inverseDenominator;
  const v = (dot00 * dot12 - dot01 * dot02) * inverseDenominator;

  return u >= 0 && v >= 0 && u + v < 1;
};
