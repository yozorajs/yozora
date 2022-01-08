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
 * Lexical Analyzer for Autolink (extension).
 *
 * @see https://github.github.com/gfm/#autolinks-extension-
 */
export class AutolinkExtensionTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      /**
       * Autolink has the same priority as links.
       * @see https://github.github.com/gfm/#example-509
       */
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> =
    match

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = parse
}
