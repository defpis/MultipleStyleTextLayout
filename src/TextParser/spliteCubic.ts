import { CubicBezier } from "./interfaces";

export const splitCubic = (
  cubic: CubicBezier,
  splitParam: number
): [CubicBezier, CubicBezier] => {
  const { p0, p1, p2, p3 } = cubic;

  const x01 = (p1.x - p0.x) * splitParam + p0.x;
  const x12 = (p2.x - p1.x) * splitParam + p1.x;
  const x23 = (p3.x - p2.x) * splitParam + p2.x;

  const y01 = (p1.y - p0.y) * splitParam + p0.y;
  const y12 = (p2.y - p1.y) * splitParam + p1.y;
  const y23 = (p3.y - p2.y) * splitParam + p2.y;

  const x012 = (x12 - x01) * splitParam + x01;
  const x123 = (x23 - x12) * splitParam + x12;

  const y012 = (y12 - y01) * splitParam + y01;
  const y123 = (y23 - y12) * splitParam + y12;

  const x0123 = (x123 - x012) * splitParam + x012;
  const y0123 = (y123 - y012) * splitParam + y012;

  return [
    {
      p0,
      p1: {
        x: x01,
        y: y01,
      },
      p2: {
        x: x012,
        y: y012,
      },
      p3: {
        x: x0123,
        y: y0123,
      },
    },
    {
      p0: {
        x: x0123,
        y: y0123,
      },
      p1: {
        x: x123,
        y: y123,
      },
      p2: {
        x: x23,
        y: y23,
      },
      p3,
    },
  ];
};
