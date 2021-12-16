import "./index.css";
import _ from "lodash";
import * as PIXI from "pixi.js";
import { click, zoom } from "./utils";
import { Text } from "./Text";
import {
  AUTO_LINE_HEIGHT,
  HorizontalAlignType,
  TextConfig,
  LetterCaseType,
  VerticalAlignType,
  getTextPosByPos,
  TextPos,
  goLineStart,
  goWordStart,
  goLeft,
  goLineEnd,
  goWordEnd,
  goRight,
  goTextStart,
  goUp,
  goTextEnd,
  goDown,
  getIdxByTextPos,
  getTextPosByIdx,
  getPosByTextPos,
  isEnter,
  CharType,
} from "./TextLayout";
import { SelectRenderer } from "./SelectRenderer";
import { peekLine, peekWord } from "./TextLayout/TextSelection";

const app = new PIXI.Application({
  view: document.querySelector("#app") as HTMLCanvasElement,
  backgroundColor: 0xeeeeee,
  backgroundAlpha: 1.0,
  autoDensity: true,
  resolution: window.devicePixelRatio,
  antialias: true,
  resizeTo: window,
});

app.stage.interactive = true;

const setHitArea = () => {
  const o = app.stage.toLocal({ x: 0, y: 0 });
  app.stage.hitArea = new PIXI.Rectangle(
    o.x,
    o.y,
    app.renderer.width / app.stage.scale.x,
    app.renderer.height / app.stage.scale.y
  );
};

zoom(app.view, (translate, scale) => {
  app.stage.position.set(translate.x, translate.y);
  app.stage.scale.set(scale.x, scale.y);
  setHitArea();
});

setHitArea();

const testText: string = require("./assets/test.txt");
const textIdxs = Array.from(testText).map(() => 0);

const defaultTextConfig: TextConfig = {
  text: testText,
  charConfigIndexs: textIdxs,
  charConfigMap: {
    0: {
      fontFamily: "Inter",
      fontWeight: "Regular",
      fontSize: 36,
      lineHeight: AUTO_LINE_HEIGHT,
      letterSpacing: 20,
      letterCase: LetterCaseType.Origin,
    },
  },
  globalConfig: {
    width: 1000,
    height: 1000,
    wordWrap: true,
    wordWrapWidth: 1000,
    paragraphSpacing: 0,
    horizontalAlign: HorizontalAlignType.Center,
    verticalAlign: VerticalAlignType.Center,
  },
};

const text = new Text(defaultTextConfig);
app.stage.addChild(text);

const selectRenderer = new SelectRenderer(text);

const onDown = (ev: PIXI.InteractionEvent) => {
  const layoutInfo = text.layoutInfo!;

  const pos = text.toLocal(ev.data.global);
  const textPos = getTextPosByPos(pos, text.layoutInfo!);
  selectRenderer.start = selectRenderer.end = textPos;
  selectRenderer.render();

  click({
    2: () => {
      const pos1 = text.toLocal(ev.data.global);
      const textPos = getTextPosByPos(pos1, layoutInfo);
      const pos2 = getPosByTextPos(textPos, layoutInfo);

      const tokens = layoutInfo.lines[textPos.row].tokens;
      const lastToken = tokens[tokens.length - 1];

      let right = true;
      if (lastToken) {
        const maxIdx = isEnter(lastToken.text)
          ? tokens.length - 1
          : tokens.length;

        if (textPos.col === maxIdx) {
          right = false;
        } else if (textPos.col === 0) {
          right = true;
        } else {
          right = pos1.x >= pos2.x;
        }
      }

      const textIdx = getIdxByTextPos(textPos, layoutInfo);
      const { start, end, type } = peekWord(textIdx, layoutInfo.tokens, right);

      if (type === CharType.ENTER || type === CharType.SPACE) {
        selectRenderer.start = getTextPosByIdx(start, layoutInfo, false);
        selectRenderer.end = getTextPosByIdx(end, layoutInfo, true);
      } else {
        selectRenderer.start = getTextPosByIdx(start, layoutInfo, true);
        selectRenderer.end = getTextPosByIdx(end, layoutInfo, false);
      }

      selectRenderer.render();
    },
    3: () => {
      const pos1 = text.toLocal(ev.data.global);
      const textPos = getTextPosByPos(pos1, layoutInfo);
      const pos2 = getPosByTextPos(textPos, layoutInfo);

      const tokens = layoutInfo.lines[textPos.row].tokens;
      const lastToken = tokens[tokens.length - 1];

      let right = true;
      if (lastToken) {
        const maxIdx = isEnter(lastToken.text)
          ? tokens.length - 1
          : tokens.length;

        if (textPos.col === maxIdx) {
          right = false;
        } else if (textPos.col === 0) {
          right = true;
        } else {
          right = pos1.x >= pos2.x;
        }
      }

      const textIdx = getIdxByTextPos(textPos, layoutInfo);
      const { start, end, type } = peekLine(textIdx, layoutInfo.tokens, right);

      if (type === CharType.ENTER) {
        const startNextLine = end === layoutInfo.tokens.length;

        selectRenderer.start = getTextPosByIdx(end, layoutInfo, startNextLine);
        selectRenderer.end = getTextPosByIdx(end, layoutInfo, startNextLine);
      } else {
        selectRenderer.start = getTextPosByIdx(start, layoutInfo, true);
        selectRenderer.end = getTextPosByIdx(end, layoutInfo, false);
      }

      selectRenderer.render();
    },
    4: () => {
      selectRenderer.start = { row: 0, col: 0 };
      const maxRow = layoutInfo.lines.length - 1;
      const maxCol = layoutInfo.lines[maxRow].tokens.length;
      selectRenderer.end = { row: maxRow, col: maxCol };
      selectRenderer.render();
    },
  });

  app.stage.on("pointermove", onMove);
  app.stage.on("pointerup", onUp);
};

const onMove = (ev: PIXI.InteractionEvent) => {
  const layoutInfo = text.layoutInfo!;
  const pos = text.toLocal(ev.data.global);
  const textPos = getTextPosByPos(pos, layoutInfo);
  selectRenderer.end = textPos;
  selectRenderer.render();
};

const onUp = (ev: PIXI.InteractionEvent) => {
  app.stage.off("pointermove", onMove);
  app.stage.off("pointerup", onUp);
};

app.stage.on("pointerdown", onDown);

const onKeydown = (ev: KeyboardEvent) => {
  if (["Shift", "Alt", "Meta"].includes(ev.key)) {
    return;
  }

  ev.stopPropagation();
  ev.preventDefault();

  const layoutInfo = text.layoutInfo!;
  const fromHighlightToCursor = selectRenderer.isSelected && !ev.shiftKey;
  const { start, end } = selectRenderer.getOrderedTextPos();

  let textPos = selectRenderer.end;
  let nextTextPos: TextPos;

  switch (ev.key) {
    case "ArrowLeft": {
      if (ev.metaKey) {
        nextTextPos = goLineStart(textPos, layoutInfo);
      } else if (ev.altKey) {
        nextTextPos = goWordStart(textPos, layoutInfo);
      } else {
        if (fromHighlightToCursor) {
          nextTextPos = start;
        } else {
          nextTextPos = goLeft(textPos, layoutInfo);
        }
      }
      break;
    }
    case "ArrowRight": {
      if (ev.metaKey) {
        nextTextPos = goLineEnd(textPos, layoutInfo);
      } else if (ev.altKey) {
        nextTextPos = goWordEnd(textPos, layoutInfo);
      } else {
        if (fromHighlightToCursor) {
          nextTextPos = end;
        } else {
          nextTextPos = goRight(textPos, layoutInfo);
        }
      }
      break;
    }
    case "ArrowUp": {
      if (ev.metaKey) {
        nextTextPos = goTextStart(layoutInfo);
      } else {
        nextTextPos = goUp(textPos, layoutInfo);
      }
      break;
    }
    case "ArrowDown": {
      if (ev.metaKey) {
        nextTextPos = goTextEnd(layoutInfo);
      } else {
        nextTextPos = goDown(textPos, layoutInfo);
      }
      break;
    }
    default: {
      throw new Error(`Unknown keyboard event key: ${ev.key}`);
    }
  }

  selectRenderer.end = nextTextPos;

  if (!ev.shiftKey) {
    selectRenderer.start = nextTextPos;
  }

  selectRenderer.render();
};

document.addEventListener("keydown", onKeydown);
