import {
  fontLoader,
  FontLoader,
  FontMeta,
  MatchFontMeta,
  matchMostRelatedFont,
} from "../FontLoader";
import { TextPartialConfig } from "./interfaces";
import unicode from "unicode-properties";
import { isEnter } from "./utils";

export class TextFallback {
  static DEFAULT_MATCH_FONT_META: MatchFontMeta = {
    style: "Regular",
    weight: 400,
    italic: false,
  };

  fontLoader: FontLoader;
  families: Record<string, string[]>;
  cannotFallbackChars = new Set();
  unavailableFamilies = new Set();

  constructor(fontLoader: FontLoader, families: Record<string, string[]>) {
    this.fontLoader = fontLoader;
    this.families = families;
  }

  getAllFontInfo() {
    return this.fontLoader.infoLoader.dataMap[FontLoader.ALL_FONTS_KEY];
  }

  async fallbackChars(
    chars: string[],
    charConfigIndexs: number[],
    charConfigMap: Record<number, TextPartialConfig>
  ) {
    const fbPromises: Record<string, Promise<opentype.Font>> = {};

    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];

      if (isEnter(c)) {
        continue;
      }

      // 无法回退
      if (this.cannotFallbackChars.has(c)) {
        continue;
      }

      // 已异步回退
      if (!!fbPromises[c]) {
        continue;
      }

      const { fontFamily: family, fontWeight: weight } =
        charConfigMap[charConfigIndexs[i]];

      // 获取当前字体
      const font = this.fontLoader.getFontFromCache(family, weight);

      // 当前字体存在
      if (font) {
        const idx = font.charToGlyphIndex(c);

        // 字形可用
        if (idx) {
          continue;
        }
      }

      // 匹配信息不存在使用候选字体信息
      const fontMeta: MatchFontMeta = this.fontLoader.getFontMetaFromCache(
        family,
        weight
      ) || { ...TextFallback.DEFAULT_MATCH_FONT_META, style: weight };

      // 获取回退字体
      const fbFont = this.getCharFallbackFontFromCache(c, [family], fontMeta);

      // 可以同步回退
      if (fbFont) {
        continue;
      }

      // 需要异步回退
      fbPromises[c] = this.fallbackChar(c, [family], fontMeta);
    }

    try {
      return await Promise.all(Object.values(fbPromises)); // FIXME 部分回退成功应该触发回调
    } catch (err) {
      console.warn(err);
      return [];
    }
  }

  getCharFallbackFontFromCache(
    char: string,
    fbStack: string[],
    fontMeta: MatchFontMeta,
    log = false
  ): opentype.Font | undefined {
    const family = fbStack[0];

    const fbFontMeta = this.getNextFallbackFontMetaFromCache(
      char,
      family,
      fontMeta
    );

    if (!fbFontMeta) {
      return;
    }

    const fbFont = this.fontLoader.getFontFromCache(
      fbFontMeta.family,
      fbFontMeta.style
    );

    if (fbFont) {
      const idx = fbFont.charToGlyphIndex(char);
      if (idx) {
        if (log) {
          console.warn(
            `Fallback ${char} from ${FontLoader.genId(
              fbStack[fbStack.length - 1],
              fontMeta.style
            )} to ${FontLoader.genId(fbFontMeta.family, fbFontMeta.style)}`
          );
        }
        return fbFont;
      }
      fbStack.unshift(fbFontMeta.family);
      return this.getCharFallbackFontFromCache(char, fbStack, fontMeta);
    }
  }

  getFallbackFamilies(char: string) {
    const script = unicode.getScript(char.codePointAt(0)); // FIXME 不知道是否可行，有待进一步验证

    const families: string[] = [];

    if (script && script !== "Common") {
      families.push(...(this.families[script] || []));
    }

    families.push(...(this.families["Common"] || []));

    return families.filter((item, index) => families.indexOf(item) === index);
  }

  getNextFallbackFontMetaFromCache(
    char: string,
    family: string,
    fontMeta: MatchFontMeta
  ): FontMeta | undefined {
    const families = this.getFallbackFamilies(char);

    let idx = families.indexOf(family);

    if (idx === -1) {
      idx = 0;
    } else {
      idx++;
    }

    if (idx < families.length) {
      const family = families[idx];
      const fontInfo = this.fontLoader.getFontInfoFromCache(family);

      if (this.unavailableFamilies.has(family) || !fontInfo) {
        return this.getNextFallbackFontMetaFromCache(char, family, fontMeta);
      }

      return matchMostRelatedFont(fontInfo, fontMeta);
    }
  }

  async fallbackChar(
    char: string,
    fbStack: string[],
    fontMeta: MatchFontMeta
  ): Promise<opentype.Font> {
    const family = fbStack[0];

    const fbFontMeta = this.getNextFallbackFontMetaFromCache(
      char,
      family,
      fontMeta
    );

    if (!fbFontMeta) {
      this.cannotFallbackChars.add(char);
      throw new Error(
        `Can't load fallback fonts ${fbStack.slice().reverse()} for ${char}.`
      );
    }

    let fbFont = this.fontLoader.getFontFromCache(
      fbFontMeta.family,
      fbFontMeta.style
    );

    if (!fbFont) {
      try {
        fbFont = await this.fontLoader.getFont(
          fbFontMeta.family,
          fbFontMeta.style
        );
      } catch (err) {
        console.warn(err);

        this.unavailableFamilies.add(fbFontMeta.family);
        fbStack.unshift(fbFontMeta.family);
        return await this.fallbackChar(char, fbStack, fontMeta);
      }
    }

    const idx = fbFont.charToGlyphIndex(char);
    if (idx) {
      console.warn(
        `Load fallback font ${FontLoader.genId(
          fbFontMeta.family,
          fbFontMeta.style
        )} for ${char}.`
      );
      return fbFont;
    } else {
      fbStack.unshift(fbFontMeta.family);
      return await this.fallbackChar(char, fbStack, fontMeta);
    }
  }
}

export const defaultFallbackFonts = {
  Common: ["PingFang SC", "Roboto"],
  Han: ["PingFang SC", "Roboto"],
  Latin: ["PingFang SC", "Roboto"],
};

export const textFallback = new TextFallback(fontLoader, defaultFallbackFonts);
