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
 * Lexical Analyzer for ImageReference.
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.github.com/gfm/#images
 */
export class ImageReferenceTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode, IThis>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode, IThis>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken, IThis> = match

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode, IThis> = parse
}
