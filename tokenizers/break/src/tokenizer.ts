import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import { uniqueName } from './types'
import type { IDelimiter, IHookContext, INode, IToken, ITokenizerProps, T } from './types'

/**
 * Lexical Analyzer for a line break.
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 * @see https://github.com/syntax-tree/mdast#break
 */
export class BreakTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.SOFT_INLINE,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> =
    match

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = parse
}
