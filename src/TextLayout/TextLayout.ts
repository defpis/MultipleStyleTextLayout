import _ from "lodash";
import {
  HorizontalAlignType,
  TextGlobalConfig,
  TextLine,
  VerticalAlignType,
} from "./interfaces";
import { isEnter, isSpace } from "./utils";

export const getLeftOffset = (
  width: number,
  lineWidth: number,
  horizontalAlign: HorizontalAlignType
): number => {
  let leftOffset = 0;

  if (horizontalAlign === HorizontalAlignType.Center) {
    leftOffset = (width - lineWidth) / 2;
  }

  if (horizontalAlign === HorizontalAlignType.Right) {
    leftOffset = width - lineWidth;
  }

  return leftOffset;
};

export const getTopOffset = (
  height: number,
  textHeight: number,
  verticalAlign: VerticalAlignType
): number => {
  let topOffset = 0;

  if (verticalAlign === VerticalAlignType.Center) {
    topOffset = (height - textHeight) / 2;
  }

  if (verticalAlign === VerticalAlignType.Bottom) {
    topOffset = height - textHeight;
  }

  return topOffset;
};

export const textLayout = (
  textLines: TextLine[][],
  globalConfig: TextGlobalConfig
) => {
  const layoutRect = { x: Infinity, y: Infinity, width: 0, height: 0 };
  const dirtyRect = { x: Infinity, y: Infinity, width: 0, height: 0 };

  layoutRect.height += textLines.reduce(
    (acc, cur) => cur.reduce((a, c) => a + c.lineHeight, acc),
    0
  );
  layoutRect.height +=
    Math.max(textLines.length - 1, 0) * globalConfig.paragraphSpacing;

  let top = (layoutRect.y = getTopOffset(
    globalConfig.height,
    layoutRect.height,
    globalConfig.verticalAlign
  ));

  textLines.forEach((paragraphLines) => {
    paragraphLines.forEach((line) => {
      // 不是由于换行符折行时，需要减去末尾的空格宽度
      let minusWidth = 0;
      const lastToken = line.tokens[line.tokens.length - 1];

      if (lastToken && !isEnter(lastToken.text)) {
        for (let i = line.tokens.length - 1; i >= 0; i--) {
          if (!isSpace(line.tokens[i].text)) {
            break;
          }
          minusWidth += line.tokens[i].width;
        }
      }

      let left = getLeftOffset(
        globalConfig.width,
        line.width - minusWidth,
        globalConfig.horizontalAlign
      );

      line.x = left;
      line.y = top - (line.height - line.lineHeight) / 2;

      layoutRect.x = Math.min(layoutRect.x, line.x);
      layoutRect.width = Math.max(layoutRect.width, line.width);

      dirtyRect.x = Math.min(dirtyRect.x, line.x);
      dirtyRect.width = Math.max(dirtyRect.width, line.width);

      const renderHeight = Math.max(line.height, line.lineHeight);
      const renderOffset = (renderHeight - line.height) / 2;

      dirtyRect.y = Math.min(dirtyRect.y, line.y - renderOffset);
      dirtyRect.height = Math.max(
        dirtyRect.height,
        line.y + renderHeight - renderOffset - dirtyRect.y
      );

      line.tokens.forEach((currToken) => {
        currToken.x = left;
        currToken.y = line.y + line.baseLine;

        left += currToken.width;
      });

      top += line.lineHeight;
    });

    top += globalConfig.paragraphSpacing;
  });

  const lines = _.flatten(textLines);

  return {
    layoutRect,
    dirtyRect,
    lines,
  };
};
