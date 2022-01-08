import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { IDelimiter, IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for inline footnote.
 * @see https://github.com/syntax-tree/mdast-util-footnote
 * @see https://github.com/remarkjs/remark-footnotes
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#links
 * @see https://www.markdownguide.org/extended-syntax/#footnotes
 */
export class FootnoteTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> =
    match

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = parse
}
