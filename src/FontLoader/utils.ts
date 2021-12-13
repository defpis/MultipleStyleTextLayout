import { toNumber } from "lodash";
import {
  FONT_WEIGHT_STYLES,
  ITALIC,
  ITALIC_LOWERCASE,
  REGULAR,
  REGULAR_LOWERCASE,
} from "./const";
import { FontInfo, FONT_WEIGHT_STYLE_KEY, MatchFontMeta } from "./interfaces";

export function getFontInfoFromFontWeightStr(
  fontWeight: string,
  separator: string | RegExp
) {
  let weight = 400;
  let italic = false;
  let style = REGULAR;

  if (fontWeight === ITALIC_LOWERCASE) {
    italic = true;
    style = ITALIC;
  } else if (fontWeight !== REGULAR_LOWERCASE) {
    const [weightStr, styleStr] = fontWeight.split(separator, 2);

    weight = toNumber(weightStr);
    italic = styleStr === ITALIC_LOWERCASE;

    const styles = FONT_WEIGHT_STYLES[weight as FONT_WEIGHT_STYLE_KEY];

    if (styles) {
      style = styles[0];
    } else {
      console.warn(`${weight} didn't match FONT_WEIGHT_STYLES.`);
    }

    style = `${style}${italic ? ` ${ITALIC}` : ""}`;
  }

  return {
    weight,
    italic,
    style,
  };
}

export function matchMostRelatedFont(
  fontInfo: FontInfo,
  fontMeta: MatchFontMeta
) {
  const { weight, italic } = fontMeta;
  const weights = Object.values(fontInfo);

  let searchWeights = weights.filter((item) => item.italic === italic);

  // 相同italic优先，没有找全部
  if (!searchWeights.length) {
    searchWeights = weights;
  }

  let matched = weights[0];
  let min = Infinity;

  for (let i = 0; i < searchWeights.length; i++) {
    const currentWeight = searchWeights[i];
    const diff = Math.abs(toNumber(currentWeight.weight) - toNumber(weight));
    if (diff === 0) {
      matched = currentWeight;
      break;
    }
    if (diff < min) {
      matched = currentWeight;
      min = diff;
    }

    // [300, 500] -> 400 => 300
    // [400, 600] -> 500 => 600
    if (
      diff === min && weight <= 400
        ? currentWeight.weight < matched.weight
        : currentWeight.weight > matched.weight
    ) {
      matched = currentWeight;
    }
  }

  return matched;
}
