// 某些配置奇怪是因为兼容figma导入数据

export const AUTO_LINE_HEIGHT = "auto";
export type LineHeight = number | typeof AUTO_LINE_HEIGHT;

export enum LetterCaseType {
  Origin = "ORIGINAL",
  Lower = "LOWER",
  Upper = "UPPER",
  Title = "TITLE",
}

export interface TextPartialConfig {
  /**
   * 字体配置
   * "Roboto Regular"
   */
  fontFamily: string;
  fontWeight: string;

  /**
   * 字体大小
   * 12
   * 如果是百分比需要提前转换为绝对值
   */
  fontSize: number;

  /**
   * 行高
   * 'auto'
   * 如果是百分比需要提前转换为绝对值
   */
  lineHeight: LineHeight;

  /**
   * 字间距
   * 0
   * 如果是百分比需要提前转换为绝对值
   */
  letterSpacing: number;

  /**
   * 字母大小写
   * LetterCaseType.Origin
   */
  letterCase: LetterCaseType;
}

export enum HorizontalAlignType {
  Left = "LEFT",
  Center = "CENTER",
  Right = "RIGHT",
}

export enum VerticalAlignType {
  Top = "TOP",
  Center = "CENTER",
  Bottom = "BOTTOM",
}

export interface TextGlobalConfig {
  /**
   * 文本框宽度
   * 0
   */
  width: number;

  /**
   * 文本框高度
   * 0
   */
  height: number;

  /**
   * 是否折行
   * false
   */
  wordWrap: boolean;

  /**
   * 折行宽度
   * 0
   */
  wordWrapWidth: number;

  /**
   * 段间距
   * 0
   * 仅支持绝对值
   */
  paragraphSpacing: number;

  /**
   * 水平对齐
   * HorizontalAlignType.Left
   */
  horizontalAlign: HorizontalAlignType;

  /**
   * 垂直对齐
   * VerticalAlignType.Top
   */
  verticalAlign: VerticalAlignType;
}

/**
 * 排版输入
 */
export interface TextConfig {
  /**
   * 文本字符串
   */
  text: string;

  /**
   * 字符配置索引
   */
  charConfigIndexs: Array<number>;

  /**
   * 字符配置映射
   */
  charConfigMap: Record<number, TextPartialConfig>;

  /**
   * 文本全局配置
   */
  globalConfig: TextGlobalConfig;
}
