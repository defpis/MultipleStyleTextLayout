import earcut from "earcut";
import { Group, Polygon, Triangle } from "./interfaces";
import { insidePolygon, polygonAreaSigned } from "./maths";

export const polygonsToTriangles = (polygons: Polygon[]) => {
  const groups: Group[] = polygons.map((polygon) => ({
    polygon: polygon,
    area: polygonAreaSigned(polygon),
    children: [],
  }));

  groups.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  const root: Group[] = [];

  for (let i = 0; i < groups.length; ++i) {
    let parent: Group | null = null;
    for (let j = i - 1; j >= 0; --j) {
      if (
        insidePolygon(groups[j].polygon, groups[i].polygon[0]) &&
        groups[i].area * groups[j].area < 0
      ) {
        parent = groups[j];
        break;
      }
    }
    if (parent) {
      parent.children.push(groups[i]);
    } else {
      root.push(groups[i]);
    }
  }

  const triagnles: Triangle[] = [];

  const process = (group: Group) => {
    const positions: number[] = [];
    const holes: number[] = [];

    group.polygon.forEach((point) => {
      positions.push(point.x, point.y);
    });

    group.children.forEach((child) => {
      child.children.forEach(process);

      holes.push(positions.length / 2);

      child.polygon.forEach((point) => {
        positions.push(point.x, point.y);
      });
    });

    const indices = earcut(positions, holes);

    for (let i = 0; i < indices.length; i = i + 3) {
      const p0 = {
        x: positions[indices[i + 0] * 2 + 0],
        y: positions[indices[i + 0] * 2 + 1],
      };

      const p1 = {
        x: positions[indices[i + 1] * 2 + 0],
        y: positions[indices[i + 1] * 2 + 1],
      };

      const p2 = {
        x: positions[indices[i + 2] * 2 + 0],
        y: positions[indices[i + 2] * 2 + 1],
      };

      triagnles.push({ p0, p1, p2 });
    }
  };

  root.forEach(process);

  return triagnles;
};
