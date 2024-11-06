import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { matchWithBacktick } from './matchWithBacktick'
import { parse } from './parse'
import type { IDelimiter, INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName, uniqueName_withBacktick } from './types'

/**
 * Lexical Analyzer for inlineMath.
 */
export class InlineMathTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IThis>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode, IThis>
{
  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis>
  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IThis>

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    const backtickRequired: boolean = props.backtickRequired ?? true
    const name: string = props.name ?? (backtickRequired ? uniqueName_withBacktick : uniqueName)
    const priority: TokenizerPriority =
      props.priority ??
      (backtickRequired ? TokenizerPriority.ATOMIC : TokenizerPriority.INTERRUPTABLE_INLINE)

    super({ name, priority })
    this.match = backtickRequired ? matchWithBacktick : match
    this.parse = parse
  }
}
