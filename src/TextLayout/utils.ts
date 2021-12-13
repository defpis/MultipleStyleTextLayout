export const isEnter = (char: string) => {
  return char === "\n";
};

export const isSpace = (char: string) => {
  return [" ", " "].includes(char); // 中英文空格
};

export const textSplit = (text: string) => {
  const paragraphs = text.split(/(?<=\n)/); // '' => ['']
  const lastParagraph = paragraphs[paragraphs.length - 1];
  const lastChar = lastParagraph[lastParagraph.length - 1]; // 可能为undefined

  if (isEnter(lastChar)) {
    paragraphs.push("");
  }

  return paragraphs;
};

export enum CharType {
  ENTER,
  SPACE,
  PUNCTUATION,
  CHARACTER,
}

export const getCharType = (char: string) => {
  if (isEnter(char)) {
    return CharType.ENTER;
  }

  if (isSpace(char)) {
    return CharType.SPACE;
  }

  if ([",", "，", ".", "。", "!", "！", "?", "？"].includes(char)) {
    return CharType.PUNCTUATION;
  }

  return CharType.CHARACTER;
};
