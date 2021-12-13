import _ from "lodash";
import { g } from "./global";
import { Text } from "./Text";
import * as PIXI from "pixi.js";
import {
  TextPos,
  getIdxByTextPos,
  getLineHeightByRow,
  getPosByTextPos,
  getTextPosByIdx,
  getStrIdxByIdx,
  getHeightByRow,
} from "./TextLayout";

export class SelectRenderer {
  text: Text;
  highlight = new PIXI.Graphics();

  start: TextPos = {
    row: 0,
    col: 0,
  };
  end: TextPos = {
    row: 0,
    col: 0,
  };

  clearCallback: () => void = _.noop;

  constructor(text: Text) {
    this.text = text;
    this.text.addChild(this.highlight);
  }

  get isSelected() {
    return this.start.row !== this.end.row || this.start.col !== this.end.col;
  }

  render() {
    this.clearCallback();

    if (this.isSelected) {
      this.clearCallback = this.renderHighlight();
    } else {
      this.clearCallback = this.renderCursor();
    }
  }

  renderCursor() {
    const layoutInfo = this.text.layoutInfo!;

    if (g.debug) {
      console.log("cursor start&end: ", this.start);
      const idx = getIdxByTextPos(this.start, layoutInfo);
      console.log("cursor index: ", idx);
      const textPos = getTextPosByIdx(idx, layoutInfo);
      console.log("cursor textPos: ", textPos);
      const strIdx = getStrIdxByIdx(idx, layoutInfo);
      console.log("cursor strIdx: ", strIdx);
    }

    const startPos = getPosByTextPos(this.start, layoutInfo);
    const height = getHeightByRow(this.start.row, layoutInfo);

    this.highlight
      .beginFill(0x0000ff, 0.7)
      .drawRect(startPos.x, startPos.y, 1, height)
      .endFill();

    return () => {
      this.highlight.clear();
    };
  }

  getOrderedTextPos() {
    let { start, end } = this;

    if (start.row > end.row || (start.row === end.row && start.col > end.col)) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    return { start, end };
  }

  renderHighlight() {
    const { start, end } = this.getOrderedTextPos();

    if (g.debug) {
      console.log("highlight start: ", start);
      console.log("highlight end: ", end);
    }

    const layoutInfo = this.text.layoutInfo!;
    const { layoutRect, lines } = layoutInfo;

    const startPos = getPosByTextPos(start, layoutInfo);
    const endPos = getPosByTextPos(end, layoutInfo);

    const selectedRects: PIXI.Rectangle[] = [];

    const getRenderHeightAndOffset = (row: number) => {
      const height = getHeightByRow(row, layoutInfo);
      const lineHeight = getLineHeightByRow(row, layoutInfo);
      const renderHeight = Math.max(height, lineHeight);
      const renderOffset = (renderHeight - height) / 2;

      return {
        renderHeight,
        renderOffset,
      };
    };

    const { renderHeight: startRenderHeight, renderOffset: startRenderOffset } =
      getRenderHeightAndOffset(start.row);

    if (start.row === end.row) {
      selectedRects.push(
        new PIXI.Rectangle(
          startPos.x,
          startPos.y - startRenderOffset,
          endPos.x - startPos.x,
          startRenderHeight
        )
      );
    } else {
      selectedRects.push(
        new PIXI.Rectangle(
          startPos.x,
          startPos.y - startRenderOffset,
          layoutRect.x + layoutRect.width - startPos.x,
          startRenderHeight
        )
      );

      for (let row = start.row + 1; row < end.row; row++) {
        const { renderHeight: rowRenderHeight, renderOffset: rowRenderOffset } =
          getRenderHeightAndOffset(row);

        selectedRects.push(
          new PIXI.Rectangle(
            layoutRect.x,
            lines[row].y - rowRenderOffset,
            layoutRect.width,
            rowRenderHeight
          )
        );
      }

      const { renderHeight: endRenderHeight, renderOffset: endRenderOffset } =
        getRenderHeightAndOffset(end.row);

      selectedRects.push(
        new PIXI.Rectangle(
          layoutRect.x,
          endPos.y - endRenderOffset,
          endPos.x - layoutRect.x,
          endRenderHeight
        )
      );
    }

    this.highlight.beginFill(0x0000ff, 0.3);
    selectedRects.forEach((rect) => {
      this.highlight.drawRect(rect.x, rect.y, rect.width, rect.height);
    });
    this.highlight.endFill();

    return () => {
      this.highlight.clear();
    };
  }
}
