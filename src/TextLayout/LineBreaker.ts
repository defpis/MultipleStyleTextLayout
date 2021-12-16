import {
  TextLine,
  CharToken,
  ParagraphToken,
  TextGlobalConfig,
} from "./interfaces";
import { isEnter, isSpace } from "./utils";
import { getLetterSpacing, measureCharTokens } from "./TextMeasurer";

export const lineBreak = (
  paragraphToken: ParagraphToken,
  globalConfig: TextGlobalConfig
) => {
  const lines: TextLine[] = [];
  const line: TextLine = {
    text: "",
    tokens: [],
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    lineHeight: 0,
    baseLine: 0,
  };
  let prevToken: CharToken | undefined = undefined;

  const addNewLine = (
    text: string,
    tokens: CharToken[],
    width: number,
    height: number,
    lineHeight: number,
    baseLine: number
  ) => {
    if (line.text) {
      lines.push({ ...line });
    }
    line.text = text;
    line.width = width;
    line.height = height;
    line.lineHeight = lineHeight;
    line.baseLine = baseLine;
    line.tokens = [...tokens];
    prevToken = tokens[tokens.length - 1];
  };

  const appendLine = (
    text: string,
    tokens: CharToken[],
    width: number,
    height: number,
    lineHeight: number,
    baseLine: number,
    prevCharLetterSpacing: number
  ) => {
    line.text += text;
    line.width += prevCharLetterSpacing + width;
    if (prevToken) {
      // 前面有字符，需要修改其宽度加上字间距
      prevToken.width += prevCharLetterSpacing;
    }
    line.height = Math.max(line.height, height);
    line.lineHeight = Math.max(line.lineHeight, lineHeight);
    line.baseLine = Math.max(line.baseLine, baseLine);
    line.tokens = [...line.tokens, ...tokens];
    prevToken = tokens[tokens.length - 1];
  };

  const wordWrapWidth = globalConfig.wordWrap
    ? globalConfig.wordWrapWidth
    : Infinity;

  paragraphToken.children.forEach((segmentToken) => {
    const charTokens = segmentToken.children;

    const {
      width: segmentWidth,
      height: segmentHeight,
      lineHeight: segmentLineHeight,
      baseLine: segmentBaseLine,
    } = measureCharTokens(charTokens, prevToken);

    const segmentPrevCharLetterSpacing = getLetterSpacing(
      prevToken,
      charTokens[0]
    );

    if (
      line.width + segmentPrevCharLetterSpacing + segmentWidth >
      wordWrapWidth
    ) {
      if (segmentWidth > wordWrapWidth) {
        charTokens.forEach((currToken) => {
          const charPrevCharLetterSpacing = getLetterSpacing(
            prevToken,
            currToken
          );

          // measureCharTokens的setData为true时，测量segment的时候已经写入了每个字符的宽高
          const {
            width: charWidth,
            height: charHeight,
            lineHeight: charLineHeight,
            baseLine: charBaseLine,
          } = currToken;

          // 需要折叠末尾的空格和换行符，否则当宽度小于单个字符宽度时，会导致空格和换行符单独成行
          if (
            line.width + charPrevCharLetterSpacing + charWidth >
              wordWrapWidth &&
            !isSpace(currToken.text) &&
            !isEnter(currToken.text)
          ) {
            // 为什么这里还需要重新测量？因为换行之后，相邻字偶间距变化导致字符宽度改变
            const {
              width: charWidth,
              height: charHeight,
              lineHeight: charLineHeight,
              baseLine: charBaseLine,
            } = measureCharTokens([currToken], null);

            addNewLine(
              currToken.text,
              [currToken],
              charWidth,
              charHeight,
              charLineHeight,
              charBaseLine
            );
          } else {
            appendLine(
              currToken.text,
              [currToken],
              charWidth,
              charHeight,
              charLineHeight,
              charBaseLine,
              charPrevCharLetterSpacing
            );
          }
        });
      } else {
        addNewLine(
          segmentToken.text,
          charTokens,
          segmentWidth,
          segmentHeight,
          segmentLineHeight,
          segmentBaseLine
        );
      }
    } else {
      appendLine(
        segmentToken.text,
        charTokens,
        segmentWidth,
        segmentHeight,
        segmentLineHeight,
        segmentBaseLine,
        segmentPrevCharLetterSpacing
      );
    }
  });

  lines.push({ ...line });

  return lines;
};
