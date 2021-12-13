import {
  CharToken,
  ParagraphToken,
  SegmentToken,
  TextPartialConfig,
  TextToken,
} from "./interfaces";
import { textFallback, TextFallback } from "./TextFallback";
import LineBreaker from "linebreak";
import { MatchFontMeta } from "../FontLoader";
import { isEnter } from "./utils";

export class TextTokenizer {
  textFallback: TextFallback;

  constructor(textFallback: TextFallback) {
    this.textFallback = textFallback;
  }

  get fontLoader() {
    return this.textFallback.fontLoader;
  }

  tokenize(
    paragraphs: string[],
    charConfigIndexs: number[],
    charConfigMap: Record<number, TextPartialConfig>
  ) {
    const textToken: TextToken = {
      text: paragraphs.join(""),
      children: [],
    };

    let index = 0;

    paragraphs.forEach((paragraph) => {
      const paragraphToken: ParagraphToken = {
        text: paragraph,
        children: [],
      };

      const breaker = new LineBreaker(paragraph);
      let last = 0;
      let bk;

      while ((bk = breaker.nextBreak())) {
        const segment = paragraph.slice(last, bk.position);

        const segmentToken: SegmentToken = {
          text: segment,
          children: [],
        };

        Array.from(segment).forEach((char) => {
          const charConfig = charConfigMap[charConfigIndexs[index]];
          const { fontFamily: family, fontWeight: weight } = charConfig;

          // 获取当前字体
          let originalFont = this.fontLoader.getFontFromCache(family, weight);

          // 匹配信息不存在使用候选字体信息
          const fontMeta: MatchFontMeta = this.fontLoader.getFontMetaFromCache(
            family,
            weight
          ) || { ...TextFallback.DEFAULT_MATCH_FONT_META, style: weight };

          let font: opentype.Font;
          let glyph: opentype.Glyph;

          if (isEnter(char)) {
            // 换行符会触发回退，额外处理
            font = originalFont
              ? originalFont
              : this.fontLoader.candidateFont!.font;
            // 获取的字形可能存在宽度，后续使用要小心
            glyph = font.glyphs.get(0); // .notdef
          } else {
            if (originalFont) {
              const idx = originalFont.charToGlyphIndex(char);
              if (idx || this.textFallback.cannotFallbackChars.has(char)) {
                font = originalFont;
                glyph = font.charToGlyph(char);
              } else {
                const fbFont = this.textFallback.getCharFallbackFontFromCache(
                  char,
                  [family],
                  fontMeta,
                  true
                );

                if (fbFont) {
                  font = fbFont;
                  glyph = font.charToGlyph(char);
                } else {
                  font = originalFont;
                  glyph = font.charToGlyph(" "); // whitespace
                }
              }
            } else {
              const fbFont = this.textFallback.getCharFallbackFontFromCache(
                char,
                [family],
                fontMeta,
                true
              );

              if (fbFont) {
                font = fbFont;
                glyph = font.charToGlyph(char);
              } else {
                font = this.fontLoader.candidateFont!.font;
                glyph = font.glyphs.get(0); // .notdef
              }
            }
          }

          const charToken: CharToken = {
            text: char,
            index,
            charConfig,
            font,
            glyph,
            // 占位
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            baseLine: 0,
          };

          segmentToken.children.push(charToken);

          index++;
        });

        paragraphToken.children.push(segmentToken);
        last = bk.position;
      }

      textToken.children.push(paragraphToken);
    });

    return textToken;
  }
}

export const textTokenizer = new TextTokenizer(textFallback);
