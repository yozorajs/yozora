/**
 * Virtual code point for special code points.
 */
export enum VirtualCodePoint {
  /**
   * Represent a line end.
   * @see https://github.github.com/gfm/#line-ending
   */
  LINE_END = -0x0001,
  /**
   * Represent one of expansion spaces of a tab.
   * @see https://github.github.com/gfm/#tabs
   */
  SPACE = -0x0002,
}
