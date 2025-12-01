import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
} from '@yozora/core-tokenizer'
import { BaseBlockTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import { parse } from './parse'
import type { INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Blockquote.
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */
export class BlockquoteTokenizer
  extends BaseBlockTokenizer<T, IToken, INode, IThis>
  implements IBlockTokenizer<T, IToken, INode, IThis>
{
  public readonly enableGithubCallout: boolean

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.CONTAINING_BLOCK,
    })
    this.enableGithubCallout = props.enableGithubCallout ?? false
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IThis> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis> = parse
}
