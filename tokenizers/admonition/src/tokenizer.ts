import { AdmonitionType } from '@yozora/ast'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IBlockTokenizer,
  IMatchBlockHookCreator,
  IParseBlockHookCreator,
} from '@yozora/core-tokenizer'
import { TokenizerPriority } from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import { match } from './match'
import { parse } from './parse'
import type { INode, IThis, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Admonition.
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export class AdmonitionTokenizer
  extends FencedBlockTokenizer<T, INode, IThis>
  implements IBlockTokenizer<T, IToken, INode, IThis>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: AdmonitionType,
      markers: [AsciiCodePoint.COLON],
      markersRequired: 3,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IThis> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IThis> = parse
}
