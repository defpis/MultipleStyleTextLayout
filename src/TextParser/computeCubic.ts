import { vec3 } from "gl-matrix";
import {
  CubicBezier,
  CurveType,
  FillSideType,
  KMLTriangle,
} from "./interfaces";
import {
  sub,
  length,
  roundToZero,
  approxEqual,
  polygonAreaSigned,
  lineIntersectCheck,
  pointInsideTriangle,
} from "./maths";
import { splitCubic } from "./spliteCubic";

const _ = vec3.fromValues(0, 0, 0);

const computeCubicParams = (cubic: CubicBezier) => {
  const { p0, p1, p2, p3 } = cubic;

  const b0 = vec3.fromValues(p0.x, p0.y, 1);
  const b1 = vec3.fromValues(p1.x, p1.y, 1);
  const b2 = vec3.fromValues(p2.x, p2.y, 1);
  const b3 = vec3.fromValues(p3.x, p3.y, 1);

  const a1 = vec3.dot(b0, vec3.cross(_, b3, b2));
  const a2 = vec3.dot(b1, vec3.cross(_, b0, b3));
  const a3 = vec3.dot(b2, vec3.cross(_, b1, b0));

  let d1 = a1 - 2 * a2 + 3 * a3;
  let d2 = -a2 + 3 * a3;
  let d3 = 3 * a3;

  const len = Math.sqrt(d1 ** 2 + d2 ** 2 + d3 ** 2);

  d1 /= len;
  d2 /= len;
  d3 /= len;

  const D = 3 * d2 ** 2 - 4 * d1 * d3;
  let discr = d1 ** 2 * D;

  d1 = roundToZero(d1);
  d2 = roundToZero(d2);
  d3 = roundToZero(d3);
  discr = roundToZero(discr);

  return {
    d1,
    d2,
    d3,
    D,
    discr,
  };
};

const computeCubicType = (cubicParams): CurveType => {
  const { d1, d2, d3, D, discr } = cubicParams;

  if (!discr) {
    if (!d1 && !d2) {
      if (!d3) {
        return CurveType.LineOrPoint;
      }

      return CurveType.Quadratic;
    }

    if (!d1) {
      return CurveType.Cusp;
    }

    if (D < 0) {
      return CurveType.Loop;
    }

    return CurveType.Serpentine;
  }

  if (discr > 0) {
    return CurveType.Serpentine;
  }

  return CurveType.Loop;
};

const computeKLM = (curveType, cubicParams, sideToFill, recursionDepth) => {
  const KLM = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  let reverse = false;
  let errorLoop = 0;
  let splitParam = 0;

  const { d1, d2, d3 } = cubicParams;

  switch (curveType) {
    case CurveType.Serpentine: {
      const t1 = Math.sqrt(9 * d2 ** 2 - 12 * d1 * d3);

      const ls = 3 * d2 - t1;
      const lt = 6 * d1;
      const ms = 3 * d2 + t1;
      const mt = 6 * d1;

      KLM[0][0] = ls * ms;
      KLM[0][1] = ls ** 3;
      KLM[0][2] = ms ** 3;

      KLM[1][0] = (1 / 3) * (3 * ls * ms - ls * mt - lt * ms);
      KLM[1][1] = ls ** 2 * (ls - lt);
      KLM[1][2] = ms ** 2 * (ms - mt);

      KLM[2][0] = (1 / 3) * (lt * (mt - 2 * ms) + ls * (3 * ms - 2 * mt));
      KLM[2][1] = (lt - ls) ** 2 * ls;
      KLM[2][2] = (mt - ms) ** 2 * ms;

      KLM[3][0] = (lt - ls) * (mt - ms);
      KLM[3][1] = -((lt - ls) ** 3);
      KLM[3][2] = -((mt - ms) ** 3);

      if (d1 < 0) {
        reverse = true;
      }

      break;
    }
    case CurveType.Cusp: {
      const ls = d3;
      const lt = 3 * d2;

      KLM[0][0] = ls;
      KLM[0][1] = ls ** 3;
      KLM[0][2] = 1;

      KLM[1][0] = ls - (1 / 3) * lt;
      KLM[1][1] = ls ** 2 * (ls - lt);
      KLM[1][2] = 1;

      KLM[2][0] = ls - (2 / 3) * lt;
      KLM[2][1] = (ls - lt) ** 2 * ls;
      KLM[2][2] = 1;

      KLM[3][0] = ls - lt;
      KLM[3][1] = (ls - lt) ** 3;
      KLM[3][2] = 1;

      break;
    }
    case CurveType.Loop: {
      const t1 = Math.sqrt(4 * d1 * d3 - 3 * d2 ** 2);

      const ls = d2 - t1;
      const lt = 2 * d1;
      const ms = d2 + t1;
      const mt = 2 * d1;

      let ql = ls / lt;
      let qm = ms / mt;

      if (ql > 0 && ql < 1.0) {
        errorLoop = -1;
        splitParam = ql;
      }

      if (qm > 0 && qm < 1.0) {
        errorLoop = 1;
        splitParam = qm;
      }

      KLM[0][0] = ls * ms;
      KLM[0][1] = ls ** 2 * ms;
      KLM[0][2] = ls * ms ** 2;

      KLM[1][0] = (1 / 3) * (-ls * mt - lt * ms + 3 * ls * ms);
      KLM[1][1] = -(1 / 3) * ls * (ls * (mt - 3 * ms) + 2 * lt * ms);
      KLM[1][2] = -(1 / 3) * ms * (ls * (2 * mt - 3 * ms) + lt * ms);

      KLM[2][0] = (1 / 3) * (lt * (mt - 2 * ms) + ls * (3 * ms - 2 * mt));
      KLM[2][1] = (1 / 3) * (lt - ls) * (ls * (2 * mt - 3 * ms) + lt * ms);
      KLM[2][2] = (1 / 3) * (mt - ms) * (ls * (mt - 3 * ms) + 2 * lt * ms);

      KLM[3][0] = (lt - ls) * (mt - ms);
      KLM[3][1] = -((lt - ls) ** 2) * (mt - ms);
      KLM[3][2] = -(lt - ls) * (mt - ms) ** 2;

      if (recursionDepth < 1) {
        reverse = (d1 > 0 && KLM[0][0] < 0) || (d1 < 0 && KLM[0][0] > 0);
      }

      break;
    }
    case CurveType.Quadratic: {
      KLM[0][0] = 0;
      KLM[0][1] = 0;
      KLM[0][2] = 0;

      KLM[1][0] = 1 / 3;
      KLM[1][1] = 0;
      KLM[1][2] = 1 / 3;

      KLM[2][0] = 2 / 3;
      KLM[2][1] = 1 / 3;
      KLM[2][2] = 2 / 3;

      KLM[3][0] = 1;
      KLM[3][1] = 1;
      KLM[3][2] = 1;

      if (d3 < 0) {
        reverse = true;
      }

      break;
    }
    case CurveType.LineOrPoint: {
      break;
    }
    default: {
      console.error(`Unknown curve type: ${curveType}`);
    }
  }

  if (sideToFill === FillSideType.Right) {
    reverse = !reverse;
  }

  if (reverse) {
    for (let i = 0; i < 4; i++) {
      KLM[i][0] = -KLM[i][0];
      KLM[i][1] = -KLM[i][1];
    }
  }

  return {
    KLM,
    errorLoop,
    splitParam,
  };
};

const combineKLM = (points, KLM) =>
  points.reduce(
    (acc, p, i) => (
      acc.push({
        x: p.x,
        y: p.y,
        k: KLM[i][0],
        l: KLM[i][1],
        m: KLM[i][2],
      }),
      acc
    ),
    []
  );

const triangulateCubic = (points, bezierTriangles) => {
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      if (approxEqual(points[i], points[j])) {
        const indices = new Array(3).fill(0);
        let index = 0;

        for (let k = 0; k < 4; k++) {
          if (k !== j) {
            indices[index++] = k;
          }
        }

        bezierTriangles.push({
          p0: points[indices[0]],
          p1: points[indices[1]],
          p2: points[indices[2]],
        });

        return;
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const indices = new Array(3).fill(0);
    let index = 0;

    for (let j = 0; j < 4; j++) {
      if (i !== j) {
        indices[index++] = j;
      }
    }

    if (
      pointInsideTriangle(
        {
          p0: points[indices[0]],
          p1: points[indices[1]],
          p2: points[indices[2]],
        },
        points[i]
      )
    ) {
      for (let k = 0; k < 3; k++) {
        bezierTriangles.push({
          p0: points[indices[k % 3]],
          p1: points[indices[(k + 1) % 3]],
          p2: points[i],
        });
      }

      return;
    }
  }

  if (
    lineIntersectCheck(
      { p0: points[0], p1: points[2] },
      { p0: points[1], p1: points[3] }
    )
  ) {
    if (length(sub(points[2], points[0])) < length(sub(points[3], points[1]))) {
      bezierTriangles.push(
        {
          p0: points[0],
          p1: points[1],
          p2: points[2],
        },
        {
          p0: points[0],
          p1: points[2],
          p2: points[3],
        }
      );
    } else {
      bezierTriangles.push(
        {
          p0: points[0],
          p1: points[1],
          p2: points[3],
        },
        {
          p0: points[1],
          p1: points[2],
          p2: points[3],
        }
      );
    }
  } else if (
    lineIntersectCheck(
      { p0: points[0], p1: points[3] },
      { p0: points[1], p1: points[2] }
    )
  ) {
    if (length(sub(points[3], points[0])) < length(sub(points[2], points[1]))) {
      bezierTriangles.push(
        {
          p0: points[0],
          p1: points[1],
          p2: points[3],
        },
        {
          p0: points[0],
          p1: points[3],
          p2: points[2],
        }
      );
    } else {
      bezierTriangles.push(
        {
          p0: points[0],
          p1: points[1],
          p2: points[2],
        },
        {
          p0: points[2],
          p1: points[1],
          p2: points[3],
        }
      );
    }
  } else {
    if (length(sub(points[1], points[0])) < length(sub(points[3], points[2]))) {
      bezierTriangles.push(
        {
          p0: points[0],
          p1: points[2],
          p2: points[1],
        },
        {
          p0: points[0],
          p1: points[1],
          p2: points[3],
        }
      );
    } else {
      bezierTriangles.push(
        {
          p0: points[0],
          p1: points[2],
          p2: points[3],
        },
        {
          p0: points[3],
          p1: points[2],
          p2: points[1],
        }
      );
    }
  }
};

export const computeCubic = (
  cubic: CubicBezier,
  sideToFill = FillSideType.Left,
  bezierTriangles: KMLTriangle[] = [],
  recursionDepth = 0
) => {
  const cubicParams = computeCubicParams(cubic);

  const cubicType = computeCubicType(cubicParams);

  const { KLM, errorLoop, splitParam } = computeKLM(
    cubicType,
    cubicParams,
    sideToFill,
    recursionDepth
  );

  if (errorLoop && recursionDepth < 1) {
    const [cubic1, cubic2] = splitCubic(cubic, splitParam);

    computeCubic(
      cubic1,
      errorLoop === -1 ? FillSideType.Left : FillSideType.Right,
      bezierTriangles,
      recursionDepth + 1
    );

    computeCubic(
      cubic2,
      errorLoop === 1 ? FillSideType.Left : FillSideType.Right,
      bezierTriangles,
      recursionDepth + 1
    );

    const area = polygonAreaSigned([cubic1.p0, cubic1.p3, cubic2.p3]);

    if (
      (sideToFill === FillSideType.Left && area < 0) ||
      (sideToFill === FillSideType.Right && area > 0)
    ) {
      bezierTriangles.push({
        p0: { ...cubic1.p0, k: -1, l: 0, m: 0 },
        p1: { ...cubic1.p3, k: -1, l: 0, m: 0 },
        p2: { ...cubic2.p3, k: -1, l: 0, m: 0 },
      });
    }

    return bezierTriangles;
  }

  const points = combineKLM([cubic.p0, cubic.p1, cubic.p2, cubic.p3], KLM);

  triangulateCubic(points, bezierTriangles);

  return bezierTriangles;
};
