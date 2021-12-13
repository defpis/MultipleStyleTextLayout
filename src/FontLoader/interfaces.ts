import { FONT_WEIGHT_STYLES, LOCAL, REMOTE } from "./const";

export interface Defer<T> {
  promise: Promise<T>;
  status: "pending" | "fulfilled" | "rejected";
}

export interface AgentFontInfo {
  path: string;
  postscriptName: string;
  family: string;
  style: string;
  weight: number;
  width: number;
  italic: boolean;
  monospace: boolean;
}

export interface GoogleFontInfo {
  family: string;
  category: string;
  files: {
    [key: number]: string;
  };
  kind: string;
  lastModified: string;
  subsets: string[];
  variants: string[];
  version: string;
}

export type FontType = typeof LOCAL | typeof REMOTE;

export interface MatchFontMeta {
  style: string;
  weight: number;
  italic: boolean;
}

export type FontMeta = {
  type: FontType;
  family: string;
  path: string;
  data: AgentFontInfo | GoogleFontInfo;
} & MatchFontMeta;

export interface FontInfo {
  [key: string]: FontMeta;
}

export type FONT_WEIGHT_STYLE_KEY = keyof typeof FONT_WEIGHT_STYLES;
