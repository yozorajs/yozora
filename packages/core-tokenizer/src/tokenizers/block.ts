import type { Node, NodeType } from '@yozora/ast'
import { TokenizerType } from '../constant'
import type { IMatchBlockHookCreator } from '../types/match-block/hook'
import type { IParseBlockHookCreator } from '../types/parse-block/hook'
import type { IPhrasingContentLine } from '../types/phrasing-content'
import type { IPartialBlockToken } from '../types/token'
import type { IBlockTokenizer, ITokenizer } from '../types/tokenizer'

/**
 * Params for constructing a BaseBlockTokenizer.
 */
export interface IBaseBlockTokenizerProps {
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
 * Base block tokenizer.
 */
export abstract class BaseBlockTokenizer<
  T extends NodeType = NodeType,
  IToken extends IPartialBlockToken<T> = IPartialBlockToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> implements IBlockTokenizer<T, IToken, INode, IThis>
{
  public readonly type = TokenizerType.BLOCK
  public readonly name: string
  public readonly priority: number

  public abstract match: IMatchBlockHookCreator<T, IToken, IThis>
  public abstract parse: IParseBlockHookCreator<T, IToken, INode, IThis>

  constructor(props: IBaseBlockTokenizerProps) {
    this.name = props.name
    this.priority = props.priority
  }

  public extractPhrasingContentLines(
    _token: Readonly<IToken>,
  ): ReadonlyArray<IPhrasingContentLine> | null {
    return null
  }

  public buildBlockToken(
    _lines: ReadonlyArray<IPhrasingContentLine>,
    _originalToken: IToken,
  ): (IToken & IPartialBlockToken) | null {
    return null
  }

  /**
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}
