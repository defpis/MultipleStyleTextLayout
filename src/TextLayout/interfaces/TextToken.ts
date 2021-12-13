import { TextPartialConfig } from "./TextConfig";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 位置信息
 */
export interface CharRectMixin extends Rect {
  lineHeight: number;
  baseLine: number;
}

/**
 * 字体配置
 */
export interface CharFontMixin {
  font: opentype.Font;
  glyph: opentype.Glyph;
}

export type CharToken = {
  text: string;
  index: number;
  charConfig: TextPartialConfig;
} & CharFontMixin &
  CharRectMixin;

export interface SegmentToken {
  text: string;
  children: CharToken[];
}

export interface ParagraphToken {
  text: string;
  children: SegmentToken[];
}

export interface TextToken {
  text: string;
  children: ParagraphToken[];
}
