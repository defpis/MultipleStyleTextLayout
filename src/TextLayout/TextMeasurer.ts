import { AUTO_LINE_HEIGHT, CharToken } from "./interfaces";
import { isEnter } from "./utils";

export const getAdvanceWidth = (currToken: CharToken, kerning = 0) => {
  return (
    ((currToken.glyph.advanceWidth + kerning) / currToken.font.unitsPerEm) *
    currToken.charConfig.fontSize
  );
};

export const getKerning = (currToken: CharToken, nextToken: CharToken) => {
  return currToken.font === nextToken.font
    ? currToken.font.getKerningValue(
        currToken.glyph.index,
        nextToken.glyph.index
      )
    : 0;
};

export const getAutoLineHeight = (currToken: CharToken) => {
  const { ascender, descender, lineGap } = currToken.font.tables.hhea;
  return (
    ((ascender - descender + lineGap) / currToken.font.unitsPerEm) *
    currToken.charConfig.fontSize
  );
};

export const getLineHeight = (currToken: CharToken) => {
  if (currToken.charConfig.lineHeight === AUTO_LINE_HEIGHT) {
    return getAutoLineHeight(currToken);
  } else {
    return currToken.charConfig.lineHeight;
  }
};

export const getBaseLine = (currToken: CharToken) => {
  const { ascender, lineGap } = currToken.font.tables.hhea;
  return (
    ((ascender + lineGap / 2) / currToken.font.unitsPerEm) *
    currToken.charConfig.fontSize
  );
};

export const getLetterSpacing = (
  currToken?: CharToken,
  nextToken?: CharToken
) => {
  if (currToken && nextToken && !isEnter(nextToken.text)) {
    return currToken.charConfig.letterSpacing;
  }
  return 0;
};

export const measureCharTokens = (
  charTokens: CharToken[],
  prevToken: CharToken | null = null
) => {
  let width = 0;
  let height = 0;
  let lineHeight = 0;
  let baseLine = 0;

  if (charTokens.length && prevToken) {
    const currToken = prevToken;
    const nextToken = charTokens[0];

    const kerning = getKerning(currToken, nextToken);
    width +=
      (kerning / currToken.font.unitsPerEm) * currToken.charConfig.fontSize;
  }

  charTokens.forEach((currToken, index) => {
    let glyphWidth = 0;

    if (!isEnter(currToken.text)) {
      const nextToken = charTokens[index + 1];

      let kerning = 0;
      if (nextToken) {
        kerning = getKerning(currToken, nextToken);
      }

      glyphWidth =
        getAdvanceWidth(currToken, kerning) +
        getLetterSpacing(currToken, nextToken);

      width += glyphWidth;
    }

    const glyphHeight = getAutoLineHeight(currToken);
    const glyphLineHeight = getLineHeight(currToken);
    const glyphBaseLine = getBaseLine(currToken);

    height = Math.max(height, glyphHeight);
    lineHeight = Math.max(lineHeight, glyphLineHeight);
    baseLine = Math.max(baseLine, glyphBaseLine);

    // 在引用上写入宽高和基线位置
    currToken.width = glyphWidth;
    currToken.height = glyphHeight;
    currToken.lineHeight = glyphLineHeight;
    currToken.baseLine = glyphBaseLine;
  });

  return { width, height, lineHeight, baseLine };
};
