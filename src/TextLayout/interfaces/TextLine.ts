import { CharToken } from "./TextToken";

export interface TextLine {
  text: string;
  tokens: CharToken[];
  x: number;
  y: number;
  width: number;
  height: number;
  lineHeight: number;
  baseLine: number;
}
