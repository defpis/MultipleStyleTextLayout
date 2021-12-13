import { CubicBezier, QuadraticBezier } from "./interfaces";

export const quadToCubic = (quad: QuadraticBezier): CubicBezier => {
  const p1 = {
    x: quad.p0.x + (2 / 3) * (quad.p1.x - quad.p0.x),
    y: quad.p0.y + (2 / 3) * (quad.p1.y - quad.p0.y),
  };

  const p2 = {
    x: quad.p2.x + (2 / 3) * (quad.p1.x - quad.p2.x),
    y: quad.p2.y + (2 / 3) * (quad.p1.y - quad.p2.y),
  };

  return {
    p0: quad.p0,
    p1,
    p2,
    p3: quad.p2,
  };
};
