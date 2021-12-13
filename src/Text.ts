import _ from "lodash";
import * as PIXI from "pixi.js";
import shaderSource from "./assets/shaders/text/loop-blinn";
import { fontLoader, FontLoader } from "./FontLoader";
import { g } from "./global";
import {
  TextConfig,
  textFallback,
  TextPartialConfig,
  isEnter,
  LayoutInfo,
  layout,
} from "./TextLayout";
import { textParse } from "./TextParser";

const VERTEX_SIZE = 5;
const FLOAT_SIZE = 4;
const STRIDE_SIZE = VERTEX_SIZE * FLOAT_SIZE;

const program = new PIXI.Program(shaderSource.vs, shaderSource.fs);
const shader = new PIXI.Shader(program);

const loadFonts = async (
  chars: string[],
  charConfigIndexs: number[],
  charConfigMap: Record<number, TextPartialConfig>
) => {
  const fontPromises: Record<string, Promise<opentype.Font>> = {};

  for (let i = 0; i < chars.length; i++) {
    if (isEnter(chars[i])) {
      continue;
    }

    const { fontFamily: family, fontWeight: weight } =
      charConfigMap[charConfigIndexs[i]];

    const id = FontLoader.genId(family, weight);

    if (!!fontPromises[id]) {
      continue;
    }

    fontPromises[id] = fontLoader.getFont(family, weight);
  }

  await Promise.all(Object.values(fontPromises));
};

export class Text extends PIXI.Container {
  program = program;
  shader = shader;
  buffer = new PIXI.Buffer();
  size = 0;
  geometry = new PIXI.Geometry([this.buffer])
    .addAttribute(
      "iPos",
      this.buffer,
      2,
      false,
      PIXI.TYPES.FLOAT,
      STRIDE_SIZE,
      0 * FLOAT_SIZE
    )
    .addAttribute(
      "iKLM",
      this.buffer,
      3,
      false,
      PIXI.TYPES.FLOAT,
      STRIDE_SIZE,
      2 * FLOAT_SIZE
    );
  state = PIXI.State.for2d();

  _textConfig: TextConfig;
  layoutInfo?: LayoutInfo;

  g = new PIXI.Graphics();

  constructor(textConfig: TextConfig) {
    super();
    this.addChild(this.g);

    this._textConfig = textConfig;
    this._update();
  }

  get textConfig() {
    return this._textConfig;
  }

  set textConfig(textConfig: TextConfig) {
    this._textConfig = textConfig;
    this._update();
  }

  async _update() {
    await fontLoader.ensureSetCandidateFont();

    const chars = Array.from(this.textConfig.text);

    if (g.debug) {
      console.log("chars: ", chars);
    }

    await loadFonts(
      chars,
      this.textConfig.charConfigIndexs,
      this.textConfig.charConfigMap
    );

    textFallback
      .fallbackChars(
        chars,
        this.textConfig.charConfigIndexs,
        this.textConfig.charConfigMap
      )
      .then((fallbackFonts) => {
        if (fallbackFonts.length > 0) {
          this.parse();
        }
      });

    this.parse();
  }

  parse() {
    this.layoutInfo = layout(this.textConfig);
    const positions = textParse(this.layoutInfo.tokens);
    this.buffer.update(positions);
    this.size = positions.length;
  }

  _render(renderer: PIXI.Renderer) {
    this.g.clear();

    this.g
      .lineStyle(1, 0x000000)
      .drawRect(
        0,
        0,
        this.textConfig.globalConfig.width,
        this.textConfig.globalConfig.height
      )
      .closePath();

    if (this.layoutInfo) {
      this.g
        .lineStyle(1, 0xff0000, 0.5)
        .drawRect(
          this.layoutInfo.layoutRect.x,
          this.layoutInfo.layoutRect.y,
          this.layoutInfo.layoutRect.width,
          this.layoutInfo.layoutRect.height
        )
        .endFill();

      this.g
        .lineStyle(1, 0x00ff00, 0.5)
        .drawRect(
          this.layoutInfo.dirtyRect.x,
          this.layoutInfo.dirtyRect.y,
          this.layoutInfo.dirtyRect.width,
          this.layoutInfo.dirtyRect.height
        )
        .endFill();
    }

    if (this.size > 0) {
      this.renderText(renderer);
    }
  }

  renderText(renderer: PIXI.Renderer) {
    renderer.batch.flush();

    this.shader.uniforms.translationMatrix =
      this.transform.worldTransform.toArray(true);

    renderer.shader.bind(this.shader);

    this.state.blend = true;
    this.state.blendMode = PIXI.BLEND_MODES.NORMAL;

    renderer.state.set(this.state);

    renderer.geometry.bind(this.geometry, this.shader);

    renderer.geometry.draw(
      PIXI.DRAW_MODES.TRIANGLES,
      this.size / VERTEX_SIZE,
      0,
      this.geometry.instanceCount
    );
  }
}
