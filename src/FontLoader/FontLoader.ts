import { FontInfo, FontMeta } from "./interfaces";
import { queryLocalFontInfo } from "./queryLocalFonts";
import { queryRemoteFontInfo } from "./queryRemoteFonts";
import { ResourceLoader } from "./ResourceLoader";
import opentype from "opentype.js";
import { get } from "lodash";
import { getFont } from "./getFont";

export class FontLoader {
  static LOCAL_FONTS_KEY = "Local Fonts";
  static REMOTE_FONTS_KEY = "Remote Fonts";
  static ALL_FONTS_KEY = "All Fonts";
  static CANDIDATE_FONT_CONFIGS = [
    {
      family: "Roboto",
      style: "Regular",
    },
  ];

  candidateFont: {
    family: string;
    style: string;
    font: opentype.Font;
  } | null = null;

  infoLoader = new ResourceLoader<Record<string, FontInfo>>();
  fontLoader = new ResourceLoader<opentype.Font>();

  static genId(family: string, weight: string) {
    return `${family}-${weight}`;
  }

  async queryLocalFontInfo(): Promise<Record<string, FontInfo>> {
    return this.infoLoader.load(
      FontLoader.LOCAL_FONTS_KEY,
      () => queryLocalFontInfo(),
      () => ({})
    );
  }

  async queryRemoteFontInfo(): Promise<Record<string, FontInfo>> {
    return this.infoLoader.load(
      FontLoader.REMOTE_FONTS_KEY,
      () => queryRemoteFontInfo(),
      () => ({})
    );
  }

  async queryAllFontInfo(): Promise<Record<string, FontInfo>> {
    return this.infoLoader.load(FontLoader.ALL_FONTS_KEY, () =>
      Promise.all([this.queryLocalFontInfo(), this.queryRemoteFontInfo()]).then(
        ([localFonts, remoteFonts]) => ({
          ...localFonts,
          ...remoteFonts,
        })
      )
    );
  }

  async setCandidateFont() {
    if (this.candidateFont) {
      return;
    }

    for (const config of FontLoader.CANDIDATE_FONT_CONFIGS) {
      try {
        const font = await this.getFont(config.family, config.style);
        return (this.candidateFont = { ...config, font });
      } catch (err) {
        console.warn(err);
        continue;
      }
    }

    throw new Error("Candidate font is unavailable!");
  }

  async ensureSetCandidateFont() {
    await this.setCandidateFont();
  }

  async getFont(family: string, weight: string): Promise<opentype.Font> {
    const id = FontLoader.genId(family, weight);

    return this.fontLoader.load(id, () =>
      this.queryAllFontInfo().then(() => {
        const fw = this.getFontMetaFromCache(family, weight);

        if (fw) {
          return getFont(fw);
        } else {
          throw new Error(`${FontLoader.genId(family, weight)} didn't found!`);
        }
      })
    );
  }

  getFontFromCache(family: string, weight: string): opentype.Font | undefined {
    const id = FontLoader.genId(family, weight);

    return this.fontLoader.dataMap[id];
  }

  getFontInfoFromCache(family: string): FontInfo | undefined {
    const allFontInfo = this.infoLoader.dataMap[FontLoader.ALL_FONTS_KEY];

    return get(allFontInfo, [family]);
  }

  getFontMetaFromCache(family: string, weight: string): FontMeta | undefined {
    const allFontInfo = this.infoLoader.dataMap[FontLoader.ALL_FONTS_KEY];

    return get(allFontInfo, [family, weight]); // TODO 模糊匹配
  }
}

export const fontLoader = new FontLoader();
