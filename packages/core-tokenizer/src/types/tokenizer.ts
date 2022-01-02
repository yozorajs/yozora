import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { IMatchBlockHook } from './match-block/hook'
import type { IMatchInlinePhaseApi } from './match-inline/api'
import type { IParseBlockHook } from './parse-block/hook'
import type { IParseInlineHook } from './parse-inline/hook'
import type { IPartialYastBlockToken, IPartialYastInlineToken } from './token'

/**
 * IYastNode ITokenizer.
 */
export interface ITokenizer {
  /**
   * Name of a tokenizer (in order to identify a unique IYastNode ITokenizer)
   */
  readonly name: string
  /**
   * Priority of the tokenizer for handling tighter token situations.
   *
   * For example: Inline code spans, links, images, and HTML tags group more
   * tightly than emphasis.
   *
   * @see https://github.github.com/gfm/#can-open-emphasis #rule17
   */
  readonly priority: number
  /**
   * Returns a string representing the tokenizer.
   */
  toString(): string
}

/**
 * Fallback ITokenizer on the processing block structure phase .
 */
export interface IBlockFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  Node extends IYastNode<T> = IYastNode<T>,
> extends ITokenizer,
    IMatchBlockHook<T, IToken>,
    IParseBlockHook<T, IToken, Node> {}

/**
 * Fallback ITokenizer on the processing inline structure phase .
 */
export interface IInlineFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  Node extends IYastNode<T> = IYastNode<T>,
> extends ITokenizer,
    IParseInlineHook<T, IToken, Node> {
  /**
   * @param startIndex
   * @param endIndex
   * @param api
   */
  findAndHandleDelimiter(
    startIndex: number,
    endIndex: number,
    api: Readonly<Omit<IMatchInlinePhaseApi, 'resolveInternalTokens'>>,
  ): IToken
}
