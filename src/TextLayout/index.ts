import _ from "lodash";
import { g } from "../global";
import { TextConfig, LayoutInfo, TextLine } from "./interfaces";
import { textLayout } from "./TextLayout";
import { textTokenizer } from "./TextTokenizer";
import { lineBreak } from "./LineBreaker";
import { textSplit } from "./utils";

export const layout = (textConfig: TextConfig): LayoutInfo => {
  const paragraphs = textSplit(textConfig.text);

  const textToken = textTokenizer.tokenize(
    paragraphs,
    textConfig.charConfigIndexs,
    textConfig.charConfigMap
  );

  const textLines: TextLine[][] = [];

  textToken.children.forEach((paragraphToken) => {
    const paragraphLines = lineBreak(paragraphToken, textConfig.globalConfig);

    if (!paragraphToken.text) {
      if (textLines.length) {
        const lastLines = textLines[textLines.length - 1];
        const lastLine = lastLines[lastLines.length - 1];
        const lastToken = lastLine.tokens[lastLine.tokens.length - 1];

        paragraphLines[0].height = lastToken.height;
        paragraphLines[0].lineHeight = lastToken.lineHeight;
        paragraphLines[0].baseLine = lastToken.baseLine;
      } else {
        // TODO 根据最近文字配置计算行高和基线位置
        paragraphLines[0].height = 100;
        paragraphLines[0].lineHeight = 100;
        paragraphLines[0].baseLine = 60;
      }
    }

    textLines.push(paragraphLines);
  });

  const layout = textLayout(textLines, textConfig.globalConfig);
  const tokens = _.flatten(layout.lines.map((line) => line.tokens));

  if (g.debug) {
    console.log("paragraphs: ", paragraphs);
    console.log("textToken: ", textToken);
    console.log("textLines: ", textLines);
    console.log("layout: ", layout);
    console.log("tokens: ", tokens);
  }

  return {
    text: textConfig.text,
    ...layout,
    tokens,
  };
};

export * from "./interfaces";
export * from "./utils";
export * from "./TextFallback";
export * from "./LineBreaker";
export * from "./TextLayout";
export * from "./TextTokenizer";
export * from "./TextLocation";
export * from "./TextMovement";
