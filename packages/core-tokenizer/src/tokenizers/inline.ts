import type { Node, NodeType } from '@yozora/ast'
import { TokenizerType } from '../constant'
import type { IMatchInlineHookCreator, IResultOfFindDelimiters } from '../types/match-inline/hook'
import type { IParseInlineHookCreator } from '../types/parse-inline/hook'
import type { IPartialInlineToken, ITokenDelimiter } from '../types/token'
import type { IInlineTokenizer, ITokenizer } from '../types/tokenizer'

/**
 * Params for constructing a BaseInlineTokenizer.
 */
export interface IBaseInlineTokenizerProps {
  /**
   * ITokenizer name.
   */
  name: string
  /**
   * Priority of the tokenizer.
   */
  priority: number
}

/**
 * Base inline tokenizer.
 */
export abstract class BaseInlineTokenizer<
  T extends NodeType = NodeType,
  IDelimiter extends ITokenDelimiter = ITokenDelimiter,
  IToken extends IPartialInlineToken<T> = IPartialInlineToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> implements IInlineTokenizer<T, IDelimiter, IToken, INode, IThis> {
  public readonly type = TokenizerType.INLINE
  public readonly name: string
  public readonly priority: number

  public abstract readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis>
  public abstract readonly parse: IParseInlineHookCreator<T, IToken, INode, IThis>

  constructor(props: IBaseInlineTokenizerProps) {
    this.name = props.name
    this.priority = props.priority
  }

  /**
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}

export function* genFindDelimiter<IDelimiter extends ITokenDelimiter>(
  _findDelimiter: (startIndex: number, endIndex: number) => IDelimiter | null,
): IResultOfFindDelimiters<IDelimiter> {
  let lastEndIndex = -1
  let delimiter: IDelimiter | null = null
  while (true) {
    const [startIndex, endIndex] = yield delimiter

    // Read from cache.
    if (lastEndIndex === endIndex) {
      if (delimiter == null || delimiter.startIndex >= startIndex) continue
    }
    lastEndIndex = endIndex

    delimiter = _findDelimiter(startIndex, endIndex)
  }
}
