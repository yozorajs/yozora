import type { Node, NodeType } from '@yozora/ast'
import type { ICodePoint } from '@yozora/character'
import type { IBlockTokenizer, IMatchBlockHookCreator } from '@yozora/core-tokenizer'
import { BaseBlockTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { match } from './match'
import type { IFencedBlockHookContext, IToken, ITokenizerProps } from './types'

/**
 * Lexical Matcher for FencedBlock.
 *
 * A block fence is a sequence of fence-marker characters (different marker
 * cannot be mixed.) A fenced block begins with a block fence, indented no more
 * than three spaces.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export abstract class FencedBlockTokenizer<
  T extends NodeType = NodeType,
  INode extends Node<T> = Node<T>,
  IThis extends IFencedBlockHookContext<T> = IFencedBlockHookContext<T>,
>
  extends BaseBlockTokenizer<T, IToken<T>, INode, any>
  implements IBlockTokenizer<T, IToken<T>, INode, IThis>
{
  protected readonly nodeType: T
  protected readonly markers: ICodePoint[] = []
  protected readonly markersRequired: number
  protected readonly checkInfoString: ITokenizerProps<T>['checkInfoString']

  /* istanbul ignore next */
  constructor(props: ITokenizerProps<T>) {
    super({
      name: props.name,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
    })
    this.nodeType = props.nodeType
    this.markers = props.markers
    this.markersRequired = props.markersRequired
    this.checkInfoString = props.checkInfoString
  }

  public override readonly match: IMatchBlockHookCreator<T, IToken<T>, IThis> = match
}
