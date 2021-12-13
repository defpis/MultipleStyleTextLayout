import { CharToken } from "../TextLayout";
import { isEnter } from "../TextLayout/utils";
import { pathToTriangles } from "./pathToTriangles";

export const textParse = (charTokens: CharToken[]) => {
  let vertices: number[] = [];

  charTokens.forEach((charToken) => {
    if (isEnter(charToken.text)) {
      return;
    }

    const path = charToken.glyph.getPath(
      charToken.x,
      charToken.y,
      charToken.charConfig.fontSize
    );

    const { solidTriangles, bezierTriangles } = pathToTriangles(path);

    solidTriangles.forEach(({ p0, p1, p2 }) => {
      [p0, p1, p2].forEach((p) => {
        vertices.push(p.x, p.y, -1, 0, 0);
      });
    });

    bezierTriangles.forEach(({ p0, p1, p2 }) => {
      [p0, p1, p2].forEach((p) => {
        vertices.push(p.x, p.y, p.k, p.l, p.m);
      });
    });
  });

  return vertices;
};
