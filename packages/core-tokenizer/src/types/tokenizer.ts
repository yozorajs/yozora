import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { TokenizerType } from '../constant'
import type { IMatchBlockHookCreator } from '../types/match-block/hook'
import type { IMatchInlinePhaseApi } from '../types/match-inline/api'
import type { IMatchInlineHookCreator } from '../types/match-inline/hook'
import type { IParseBlockHookCreator } from '../types/parse-block/hook'
import type { IParseInlineHookCreator } from '../types/parse-inline/hook'
import type { IPostMatchBlockHookCreator } from '../types/post-match-block/hook'
import type {
  IPartialYastBlockToken,
  IPartialYastInlineToken,
  IYastBlockToken,
  IYastTokenDelimiter,
} from '../types/token'
import type { IPhrasingContent, IPhrasingContentLine } from './phrasing-content'

export interface ITokenizer {
  /**
   * Tokenizer type
   */
  readonly type: TokenizerType
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

export interface IBlockTokenizer<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
  IThis extends ITokenizer = ITokenizer,
> extends ITokenizer {
  readonly type: TokenizerType.BLOCK
  readonly match: IMatchBlockHookCreator<T, IToken, IThis>
  readonly postMatch?: IPostMatchBlockHookCreator<IThis>
  readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis>

  /**
   * Extract array of IPhrasingContentLine from a given IYastBlockToken.
   * @param token
   */
  extractPhrasingContentLines(token: Readonly<IToken>): ReadonlyArray<IPhrasingContentLine> | null

  /**
   * Build BlockTokenizerPostMatchPhaseToken from
   * a PhrasingContentMatchPhaseToken.
   * @param lines
   * @param originalToken
   */
  buildBlockToken(
    lines: ReadonlyArray<IPhrasingContentLine>,
    originalToken: IToken,
  ): (IToken & IYastBlockToken) | null
}

export interface IBlockFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
  IThis extends ITokenizer = ITokenizer,
> extends IBlockTokenizer<T, IToken, INode, IThis> {
  /**
   * Build PhrasingContent from PhrasingContentToken.
   * @param lines
   * @returns
   */
  buildPhrasingContent(lines: ReadonlyArray<IPhrasingContentLine>): IPhrasingContent | null
}

export interface IInlineTokenizer<
  T extends YastNodeType = YastNodeType,
  IDelimiter extends IYastTokenDelimiter = IYastTokenDelimiter,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
  IThis extends ITokenizer = ITokenizer,
> extends ITokenizer {
  readonly type: TokenizerType.INLINE
  readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis>
  readonly parse: IParseInlineHookCreator<T, IToken, INode, IThis>
}

export interface IInlineFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
> extends IInlineTokenizer<T, IYastTokenDelimiter, IToken, INode> {
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
