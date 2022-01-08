import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
} from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { IDelimiter, IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Node.
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export class LinkReferenceTokenizer
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
