import { FontLoader } from "./FontLoader";
import { RATIO_AGENT_API_URL } from "./config";
import { LOCAL } from "./const";
import { FontInfo, AgentFontInfo } from "./interfaces";

export async function queryLocalFontInfo(): Promise<Record<string, FontInfo>> {
  return fetch(`${RATIO_AGENT_API_URL}/font-info`)
    .then((res) => res.json())
    .then((data: Record<string, AgentFontInfo>) =>
      Object.values(data).reduce((acc, cur) => {
        if (!acc[cur.family]) {
          acc[cur.family] = {};
        }

        const weights = acc[cur.family]!;

        if (weights[cur.style]) {
          console.warn(
            `Agent font ${FontLoader.genId(cur.family, cur.style)} duplicated.`
          );
        }

        weights[cur.style] = {
          type: LOCAL,
          family: cur.family,
          style: cur.style,
          weight: cur.weight,
          italic: cur.italic,
          path: `${RATIO_AGENT_API_URL}/font-file?postscriptName=${cur.postscriptName}`,
          data: cur,
        };

        return acc;
      }, {} as Record<string, FontInfo>)
    );
}
