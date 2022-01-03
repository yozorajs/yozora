import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
} from '@yozora/core-tokenizer'
import { BaseBlockTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for FootnoteDefinition.
 * @see https://github.github.com/gfm/#link-label
 * @see https://github.github.com/gfm/#link-reference-definition
 * @see https://github.com/syntax-tree/mdast-util-footnote
 * @see https://github.com/remarkjs/remark-footnotes
 * @see https://www.markdownguide.org/extended-syntax/#footnotes
 */
export class FootnoteDefinitionTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IHookContext>
  implements IBlockTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
  }

  public readonly indent = 4

  public override readonly match: IMatchBlockHookCreator<T, IToken, IHookContext> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = parse
}
