import opentype from "opentype.js";
import { FontMeta } from "./interfaces";

export async function getFont(fw: FontMeta) {
  return opentype.load(fw.path);
}
