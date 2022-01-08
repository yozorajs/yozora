import { TextType } from '@yozora/ast'
import type {
  IInlineFallbackTokenizer,
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
 * Lexical Analyzer for Text.
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export class TextTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>
  implements
    IInlineTokenizer<T, IDelimiter, IToken, INode, IHookContext>,
    IInlineFallbackTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FALLBACK,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IHookContext> =
    match

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = parse

  public findAndHandleDelimiter(startIndex: number, endIndex: number): IToken {
    const token: IToken = {
      nodeType: TextType,
      startIndex,
      endIndex,
    }
    return token
  }
}
