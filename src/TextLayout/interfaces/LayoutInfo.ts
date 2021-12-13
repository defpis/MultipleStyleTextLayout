import { Rect, CharToken } from "./TextToken";
import { TextLine } from "./TextLine";

export interface LayoutInfo {
  text: string;
  layoutRect: Rect;
  dirtyRect: Rect;
  lines: TextLine[];
  tokens: CharToken[];
}
