import _ from "lodash";
import {
  clampTextPos,
  getTextPosByPos,
  getIdxByTextPos,
  getPosByTextPos,
  getTextPosByIdx,
} from "./TextLocation";
import { LayoutInfo, TextPos } from "./interfaces";
import { CharType, getCharType, isEnter } from "./utils";

// startNextLine 在遇到 \n 的时候需要特殊处理

export const goLeft = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  let idx = getIdxByTextPos(textPos, layoutInfo);
  idx = _.clamp(idx - 1, 0, layoutInfo.tokens.length);
  return getTextPosByIdx(idx, layoutInfo, true); // 最左可以定位到行首
};

export const goRight = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  let idx = getIdxByTextPos(textPos, layoutInfo);
  idx = _.clamp(idx + 1, 0, layoutInfo.tokens.length);
  // idx 对应的 token 可能不存在，先 clamp 再 -1 取不会报错
  // 末尾为换行符需要将光标定位到下一行开头，使光标移动衔接平滑
  const startNextLine = isEnter(layoutInfo.tokens[idx - 1].text);
  return getTextPosByIdx(idx, layoutInfo, startNextLine);
};

export const goTextStart = (layoutInfo: LayoutInfo) => {
  return getTextPosByIdx(0, layoutInfo); // 永远不会遇到换行符
};

export const goTextEnd = (layoutInfo: LayoutInfo) => {
  return getTextPosByIdx(layoutInfo.tokens.length, layoutInfo, true); // 最后一行为空行定位到行首
};

export const goUp = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const { row, col } = clampTextPos(textPos, layoutInfo);

  // 第一行单独处理
  if (!row) {
    return goTextStart(layoutInfo);
  }

  const { x } = getPosByTextPos(textPos, layoutInfo);
  const { y } = getPosByTextPos({ row: row - 1, col }, layoutInfo);

  return getTextPosByPos({ x, y }, layoutInfo);
};

export const goDown = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const { row, col } = clampTextPos(textPos, layoutInfo);

  // 最后一行单独处理
  if (row === layoutInfo.lines.length - 1) {
    return goTextEnd(layoutInfo);
  }

  const { x } = getPosByTextPos(textPos, layoutInfo);
  const { y } = getPosByTextPos({ row: row + 1, col }, layoutInfo);

  return getTextPosByPos({ x, y }, layoutInfo);
};

export const goLineStart = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const { row } = clampTextPos(textPos, layoutInfo);

  return { row, col: 0 };
};

export const goLineEnd = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  const { row } = clampTextPos(textPos, layoutInfo);

  const tokens = layoutInfo.lines[row].tokens;
  const lastToken = tokens[tokens.length - 1];

  return {
    row,
    // 末尾换行符，需要移动到它之前，否则增加或删除文字会出错
    col: isEnter(lastToken.text) ? tokens.length - 1 : tokens.length,
  };
};

export const goWordStart = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  let idx = getIdxByTextPos(textPos, layoutInfo);

  const getTypeByIdx = (i: number) => getCharType(layoutInfo.tokens[i].text);

  while (idx > 0) {
    const type = getTypeByIdx(idx - 1);
    if (type === CharType.CHARACTER) {
      break;
    }
    idx--;
  }

  while (idx > 0) {
    const type = getTypeByIdx(idx - 1);
    if (
      type === CharType.SPACE ||
      type === CharType.ENTER ||
      type === CharType.PUNCTUATION
    ) {
      break;
    }
    idx--;
  }

  return getTextPosByIdx(idx, layoutInfo, true); // 词最左只能到行首
};

export const goWordEnd = (textPos: TextPos, layoutInfo: LayoutInfo) => {
  let idx = getIdxByTextPos(textPos, layoutInfo);

  const getTypeByIdx = (i: number) => getCharType(layoutInfo.tokens[i].text);

  while (idx < layoutInfo.tokens.length) {
    const type = getTypeByIdx(idx);
    if (type === CharType.CHARACTER) {
      break;
    }
    idx++;
  }

  while (idx < layoutInfo.tokens.length) {
    const type = getTypeByIdx(idx);
    if (
      type === CharType.SPACE ||
      type === CharType.ENTER ||
      type === CharType.PUNCTUATION
    ) {
      break;
    }
    idx++;
  }

  return getTextPosByIdx(idx, layoutInfo, false); // 词最右只能到行尾
};
