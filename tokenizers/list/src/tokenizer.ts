import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
  IPostMatchBlockHookCreator,
} from '@yozora/core-tokenizer'
import { BaseBlockTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { parse } from './parse'
import { postMatch } from './postMatch'
import type { IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Params for constructing ListTokenizer
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ListTokenizerProps {}

/**
 * Lexical Analyzer for List.
 *
 * A list is a sequence of one or more list items of the same type.
 * The list items may be separated by any number of blank lines.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export class ListTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IHookContext>
  implements IBlockTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IHookContext> = () => {
    return {
      isContainingBlock: true,
      eatOpener: () => null,
    }
  }

  public readonly postMatch: IPostMatchBlockHookCreator<IHookContext> = postMatch

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = parse
}
