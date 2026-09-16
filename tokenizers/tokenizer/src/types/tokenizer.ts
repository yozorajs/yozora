import type { Node, NodeType } from '@yozora/ast'
import type { TokenizerType } from '../constant'
import type { IMatchBlockHookCreator } from './match-block/hook'
import type { IMatchInlinePhaseApi } from './match-inline/api'
import type { IMatchInlineHookCreator } from './match-inline/hook'
import type { IParseBlockHookCreator } from './parse-block/hook'
import type { IParseInlineHookCreator } from './parse-inline/hook'
import type { IPhrasingContentLine } from './phrasing-content'
import type { IPartialBlockToken, IPartialInlineToken, ITokenDelimiter } from './token'

export interface ITokenizer {
  /**
   * Tokenizer type
   */
  readonly type: TokenizerType
  /**
   * Name of a tokenizer (in order to identify a unique Node ITokenizer)
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

export interface IBlockTokenizer<
  T extends NodeType = NodeType,
  IToken extends IPartialBlockToken<T> = IPartialBlockToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> extends ITokenizer {
  readonly type: TokenizerType.BLOCK
  readonly match: IMatchBlockHookCreator<T, IToken, IThis>
  readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis>

  /**
   * Extract array of IPhrasingContentLine from a given IBlockToken.
   * @param token
   */
  extractPhrasingContentLines(token: Readonly<IToken>): readonly IPhrasingContentLine[] | null

  /**
   * Build BlockTokenizerPostMatchPhaseToken from
   * a PhrasingContentMatchPhaseToken.
   * @param lines
   * @param originalToken
   */
  buildBlockToken(
    lines: readonly IPhrasingContentLine[],
    originalToken: IToken,
  ): (IToken & IPartialBlockToken) | null
}

export type IBlockFallbackTokenizer<
  T extends NodeType = NodeType,
  IToken extends IPartialBlockToken<T> = IPartialBlockToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> = IBlockTokenizer<T, IToken, INode, IThis>

export interface IInlineTokenizer<
  T extends NodeType = NodeType,
  IDelimiter extends ITokenDelimiter = ITokenDelimiter,
  IToken extends IPartialInlineToken<T> = IPartialInlineToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> extends ITokenizer {
  readonly type: TokenizerType.INLINE
  readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis>
  readonly parse: IParseInlineHookCreator<T, IToken, INode, IThis>
}

export interface IInlineFallbackTokenizer<
  T extends NodeType = NodeType,
  IToken extends IPartialInlineToken<T> = IPartialInlineToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> extends IInlineTokenizer<T, ITokenDelimiter, IToken, INode, IThis> {
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
