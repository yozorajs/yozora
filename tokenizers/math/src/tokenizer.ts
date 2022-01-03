import { MathType } from '@yozora/ast'
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
import type { IHookContext, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for fenced math block.
 * @see https://github.com/remarkjs/remark-math
 */
export class MathTokenizer
  extends FencedBlockTokenizer<T, INode, IHookContext>
  implements IBlockTokenizer<T, IToken, INode, IHookContext>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: MathType,
      markers: [AsciiCodePoint.DOLLAR_SIGN],
      markersRequired: 2,
    })
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken, IHookContext> = match

  public override readonly parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = parse
}
