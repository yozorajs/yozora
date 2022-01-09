import type { YastNodeType } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
} from '@yozora/core-tokenizer'
import { BaseBlockTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

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
  extends BaseBlockTokenizer<T, IToken, INode, IThis>
  implements IBlockTokenizer<T, IToken, INode, IThis>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
    this.enableTaskListItem = props.enableTaskListItem ?? false
    this.emptyItemCouldNotInterruptedTypes = props.emptyItemCouldNotInterruptedTypes ?? [
      ParagraphType,
    ]
  }

  public readonly enableTaskListItem: boolean
  public readonly emptyItemCouldNotInterruptedTypes: ReadonlyArray<YastNodeType>

  public override readonly match: IMatchBlockHookCreator<T, IToken, IThis> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis> = parse
}
