import type { YastNodeType } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
} from '@yozora/core-tokenizer'
import { BaseBlockTokenizer, PhrasingContentType, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for ListItem.
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export class ListItemTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IHookContext>
  implements IBlockTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
    this.enableTaskListItem = props.enableTaskListItem ?? false
    this.emptyItemCouldNotInterruptedTypes = props.emptyItemCouldNotInterruptedTypes ?? [
      PhrasingContentType,
      ParagraphType,
    ]
  }

  public readonly enableTaskListItem: boolean
  public readonly emptyItemCouldNotInterruptedTypes: ReadonlyArray<YastNodeType>

  public override readonly match: IMatchBlockHookCreator<T, IToken, IHookContext> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = parse
}
