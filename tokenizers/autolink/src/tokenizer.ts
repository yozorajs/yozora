import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { IDelimiter, INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Autolink.
 * @see https://github.github.com/gfm/#autolink
 */
export class AutolinkTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IThis>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode, IThis>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      /**
       * Autolink has the same priority as inline-code.
       * @see https://github.github.com/gfm/#example-355
       * @see https://github.github.com/gfm/#example-356
       */
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = match

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IThis> = parse
}
