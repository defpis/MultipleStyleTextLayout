import { FontLoader } from "./FontLoader";
import { GOOGLE_FONT_API_URL, GOOGLE_FONT_API_KEY } from "./config";
import { REMOTE } from "./const";
import { FontInfo, GoogleFontInfo } from "./interfaces";
import { getFontInfoFromFontWeightStr } from "./utils";

export async function queryRemoteFontInfo(): Promise<Record<string, FontInfo>> {
  return fetch(`${GOOGLE_FONT_API_URL}${GOOGLE_FONT_API_KEY}`)
    .then((res) => res.json())
    .then(({ items }) =>
      items.reduce((acc: Record<string, FontInfo>, cur: GoogleFontInfo) => {
        if (!acc[cur.family]) {
          acc[cur.family] = {};
        }

        const weights = acc[cur.family]!;

        for (const [fontWeight, fileUrl] of Object.entries(cur.files)) {
          const { weight, italic, style } = getFontInfoFromFontWeightStr(
            fontWeight,
            /(?<=[0-9])(?=[a-z])/i
          );

          if (weights[style]) {
            console.warn(
              `Google font ${FontLoader.genId(cur.family, style)} duplicated.`
            );
          }

          weights[style] = {
            type: REMOTE,
            family: cur.family,
            style,
            weight,
            italic,
            path: fileUrl.replace(/^http/, "https"),
            data: cur,
          };
        }

        return acc;
      }, {} as Record<string, FontInfo>)
    );
}
