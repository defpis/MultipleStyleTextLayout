import _ from "lodash";
import { CharToken } from "./interfaces";
import { CharType, getCharType } from "./utils";

export const peekWord = (idx: number, tokens: CharToken[], right = true) => {
  const i = _.clamp(idx, 0, tokens.length);

  const getTypeByIdx = (i: number) => getCharType(tokens[i].text);

  let type: CharType;

  if (i === 0) {
    type = getTypeByIdx(i);
  } else if (i === tokens.length) {
    type = getTypeByIdx(i - 1);
  } else {
    if (right) {
      type = getTypeByIdx(i);
    } else {
      type = getTypeByIdx(i - 1);
    }
  }

  let start = i;
  let end = i;

  const typeCheck = (i: number) => {
    const t = getTypeByIdx(i);

    // 当前空格或换行，选中前后所有空格和换行
    if (type === CharType.ENTER || type === CharType.SPACE) {
      return t === CharType.ENTER || t === CharType.SPACE;
    }

    // 字符和标点匹配相同类型
    return t === type;
  };

  while (start > 0) {
    if (!typeCheck(start - 1)) {
      break;
    }
    start--;
  }
  while (end < tokens.length) {
    if (!typeCheck(end)) {
      break;
    }
    end++;
  }

  return {
    start,
    end,
    type,
  };
};

export const peekLine = (idx: number, tokens: CharToken[], right = true) => {
  const i = _.clamp(idx, 0, tokens.length);

  const getTypeByIdx = (i: number) => getCharType(tokens[i].text);

  let type: CharType;

  if (i === 0) {
    type = getTypeByIdx(i);
  } else if (i === tokens.length) {
    type = getTypeByIdx(i - 1);
  } else {
    if (right) {
      type = getTypeByIdx(i);
    } else {
      type = getTypeByIdx(i - 1);
    }
  }

  let start = i;
  let end = i;

  const typeCheck = (i: number) => {
    const t = getTypeByIdx(i);

    if (type === CharType.ENTER) {
      return t === CharType.ENTER || t === CharType.SPACE;
    }

    return t !== CharType.ENTER;
  };

  while (start > 0) {
    if (!typeCheck(start - 1)) {
      break;
    }
    start--;
  }
  while (end < tokens.length) {
    if (!typeCheck(end)) {
      break;
    }
    end++;
  }

  return {
    start,
    end,
    type,
  };
};
