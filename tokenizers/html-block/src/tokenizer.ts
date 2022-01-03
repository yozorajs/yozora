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
 * Lexical Analyzer for HtmlBlock.
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 */
export class HtmlBlockTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IHookContext>
  implements IBlockTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IHookContext> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = parse
}
