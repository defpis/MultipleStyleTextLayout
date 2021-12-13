import _ from "lodash";
import * as PIXI from "pixi.js";
import { LayoutInfo, TextLine, TextPos, CharToken } from "./interfaces";
import { isEnter } from "./utils";

export const getRow = (topOffset: number, layoutInfo: LayoutInfo): number => {
  const {
    layoutRect: { y, height },
    lines,
  } = layoutInfo;

  if (!lines.length) {
    return 0;
  }

  const minIdx = 0;
  const maxIdx = lines.length - 1;

  if (topOffset < y) {
    return minIdx;
  }

  if (topOffset >= y + height) {
    return maxIdx;
  }

  let left = 0;
  let right = maxIdx;

  while (left < right) {
    const middle = Math.floor((left + right) / 2);

    if (topOffset < lines[middle].y) {
      right = middle;
    } else if (topOffset >= lines[middle + 1].y) {
      left = middle + 1;
    } else {
      return middle;
    }
  }

  return left;
};

export const getCol = (leftOffset: number, line: TextLine): number => {
  const { x, width, tokens } = line;

  if (!tokens.length) {
    return 0;
  }

  const minIdx = 0;
  const maxIdx = tokens.length - 1;

  if (leftOffset < x) {
    return minIdx;
  }

  if (leftOffset >= x + width) {
    const lastToken = tokens[maxIdx];
    // 光标总是定位到换行符之前
    return isEnter(lastToken.text) ? maxIdx : maxIdx + 1;
  }

  let left = 0;
  let right = maxIdx;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);

    if (leftOffset < tokens[middle].x) {
      right = middle;
    } else if (
      leftOffset >= tokens[middle].x &&
      leftOffset < tokens[middle].x + tokens[middle].width / 2
    ) {
      return middle;
    } else if (
      leftOffset >= tokens[middle].x + tokens[middle].width / 2 &&
      leftOffset < tokens[middle].x + tokens[middle].width
    ) {
      return middle + 1;
    } else {
      left = middle + 1;
    }
  }

  return left;
};

export const getTextPosByPos = (
  pos: PIXI.IPointData,
  layoutInfo: LayoutInfo
) => {
  const row = getRow(pos.y, layoutInfo);
  const line = layoutInfo.lines[row];
  const col = getCol(pos.x, line);
  return { row, col };
};

export const clampRow = (row: number, layoutInfo: LayoutInfo) => {
  const maxRow = layoutInfo.lines.length - 1;
  return _.clamp(row, 0, maxRow);
};

export const clampCol = (col: number, line: TextLine) => {
  const maxCol = line.tokens.length; // 光标的位置不-1
  return _.clamp(col, 0, maxCol);
};

export const clampTextPos = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const row = clampRow(textPos.row, layoutInfo);
  const line = layoutInfo.lines[row];
  const col = clampCol(textPos.col, line);
  return { row, col };
};

export const getPosByTextPos = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const { row, col } = clampTextPos(textPos, layoutInfo);
  const line = layoutInfo.lines[row];

  const maxCol = line.tokens.length;
  const isLast = col === maxCol;

  let x: number;
  let y = line.y;

  if (line.tokens.length) {
    // 光标在最后，索引先-1取最后一个字符
    const token = isLast ? line.tokens[col - 1] : line.tokens[col];
    // 光标在最后，需要定位到末尾字符之后
    x = isLast ? token.x + token.width : token.x;
  } else {
    // 空字符串没有任何token，直接用line的位置
    x = line.x;
  }

  return { x, y };
};

export const getHeightByRow = (row: number, layoutInfo: LayoutInfo) => {
  return layoutInfo.lines[clampRow(row, layoutInfo)].height;
};

export const getLineHeightByRow = (row: number, layoutInfo: LayoutInfo) => {
  return layoutInfo.lines[clampRow(row, layoutInfo)].lineHeight;
};

export const getIdxByTextPos = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const { row, col } = clampTextPos(textPos, layoutInfo);

  let idx = 0;
  for (let i = 0; i < row; i++) {
    idx += layoutInfo.lines[i].tokens.length;
  }
  idx += col;

  return idx;
};

export const getTextPosByIdx = (
  idx: number,
  layoutInfo: LayoutInfo,
  startNextLine = false
) => {
  const maxRow = layoutInfo.lines.length - 1;
  const textPos = { row: 0, col: 0 };

  let cursor = idx;

  while (textPos.row <= maxRow) {
    const maxCol = layoutInfo.lines[textPos.row].tokens.length;

    if (startNextLine ? cursor < maxCol : cursor <= maxCol) {
      textPos.col = cursor;
      return textPos;
    }

    textPos.row += 1;
    cursor -= maxCol;
  }

  return { row: maxRow, col: layoutInfo.lines[maxRow].tokens.length };
};

export const getStrIdxByIdx = (idx: number, layoutInfo: LayoutInfo) => {
  const maxRow = layoutInfo.lines.length - 1;

  let strIdx = 0;
  let row = 0;
  let cursor = idx;

  const sum = (tokens: CharToken[]) => {
    strIdx += tokens.reduce((acc, cur) => acc + cur.text.length, 0);
  };

  while (row <= maxRow) {
    const tokens = layoutInfo.lines[row].tokens;
    const maxCol = tokens.length;

    if (cursor < maxCol) {
      sum(tokens.slice(0, cursor));
      return strIdx;
    }

    sum(tokens);
    row += 1;
    cursor -= maxCol;
  }

  return strIdx;
};
