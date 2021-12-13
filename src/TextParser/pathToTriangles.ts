import { computeCubic } from "./computeCubic";
import {
  CubicBezier,
  FillSideType,
  KMLTriangle,
  Point,
  Polygon,
  QuadraticBezier,
} from "./interfaces";
import { polygonAreaSigned } from "./maths";
import { polygonsToTriangles } from "./polygonsToTriangles";
import { quadToCubic } from "./quadToCubic";
import { splitCubic } from "./spliteCubic";

export const pathToTriangles = (path: opentype.Path) => {
  let currentPoint: Point = { x: 0, y: 0 };
  let polygonPoints: Polygon = [];

  const solidPolygons: Polygon[] = [];
  const bezierTriangles: KMLTriangle[] = [];

  while (path.commands.length) {
    const cmd = path.commands.shift()!;

    switch (cmd.type) {
      case "M":
      case "L": {
        const nextPoint = {
          x: cmd.x,
          y: cmd.y,
        };

        if (currentPoint.x === nextPoint.x && currentPoint.y === nextPoint.y) {
          continue;
        }

        polygonPoints.push(nextPoint);
        currentPoint = nextPoint;
        break;
      }
      case "Z":
        const firstPoint = polygonPoints[0];
        polygonPoints.push(firstPoint);
        solidPolygons.push(polygonPoints);
        polygonPoints = [];
        currentPoint = { x: 0, y: 0 };
        break;
      case "Q": {
        const nextPoint = {
          x: cmd.x,
          y: cmd.y,
        };

        const quad: QuadraticBezier = {
          p0: currentPoint,
          p1: {
            x: cmd.x1,
            y: cmd.y1,
          },
          p2: nextPoint,
        };

        const cubic = quadToCubic(quad);

        const [cubic1, cubic2] = splitCubic(cubic, 0.5);

        computeCubic(cubic1, FillSideType.Right, bezierTriangles);

        const area1 = polygonAreaSigned([cubic1.p0, cubic1.p1, cubic1.p3]);
        if (area1 < 0) {
          polygonPoints.push(cubic1.p1);
        }

        const area2 = polygonAreaSigned([cubic1.p0, cubic1.p2, cubic1.p3]);
        if (area2 < 0) {
          polygonPoints.push(cubic1.p2);
        }

        polygonPoints.push(cubic1.p3);

        computeCubic(cubic2, FillSideType.Right, bezierTriangles);

        const area3 = polygonAreaSigned([cubic2.p0, cubic2.p1, cubic2.p3]);
        if (area3 < 0) {
          polygonPoints.push(cubic2.p1);
        }

        const area4 = polygonAreaSigned([cubic2.p0, cubic2.p2, cubic2.p3]);
        if (area4 < 0) {
          polygonPoints.push(cubic2.p2);
        }

        polygonPoints.push(cubic2.p3);

        currentPoint = nextPoint;
        break;
      }
      case "C": {
        const nextPoint = {
          x: cmd.x,
          y: cmd.y,
        };

        const cubic: CubicBezier = {
          p0: currentPoint,
          p1: {
            x: cmd.x1,
            y: cmd.y1,
          },
          p2: {
            x: cmd.x2,
            y: cmd.y2,
          },
          p3: nextPoint,
        };

        const [cubic1, cubic2] = splitCubic(cubic, 0.5);

        computeCubic(cubic1, FillSideType.Left, bezierTriangles);

        const area1 = polygonAreaSigned([cubic1.p0, cubic1.p1, cubic1.p3]);
        if (area1 > 0) {
          polygonPoints.push(cubic1.p1);
        }

        const area2 = polygonAreaSigned([cubic1.p0, cubic1.p2, cubic1.p3]);
        if (area2 > 0) {
          polygonPoints.push(cubic1.p2);
        }

        polygonPoints.push(cubic1.p3);

        computeCubic(cubic2, FillSideType.Left, bezierTriangles);

        const area3 = polygonAreaSigned([cubic2.p0, cubic2.p1, cubic2.p3]);
        if (area3 > 0) {
          polygonPoints.push(cubic2.p1);
        }

        const area4 = polygonAreaSigned([cubic2.p0, cubic2.p2, cubic2.p3]);
        if (area4 > 0) {
          polygonPoints.push(cubic2.p2);
        }

        polygonPoints.push(cubic2.p3);

        currentPoint = nextPoint;
        break;
      }
      default:
        console.warn(
          `${(cmd as opentype.PathCommand).type} is not implemented!`
        );
        break;
    }
  }

  if (polygonPoints.length) {
    solidPolygons.push(polygonPoints);
  }

  const solidTriangles = polygonsToTriangles(solidPolygons);

  return { solidTriangles, bezierTriangles };
};
