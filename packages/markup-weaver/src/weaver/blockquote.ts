import type { Blockquote } from '@yozora/ast'
import { BlockquoteType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

export interface IBlockquoteWeaverProps {
  /**
   * Whether to output GitHub callout syntax (e.g., `> [!NOTE]`).
   * @default false
   */
  enableGithubCallout?: boolean
}

/**
 * Blockquote represents a section quoted from somewhere else.
 *
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#blockquote
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/blockquote
 */
export class BlockquoteWeaver implements INodeWeaver<Blockquote> {
  public readonly type = BlockquoteType
  public readonly isBlockLevel = (): boolean => true
  public readonly enableGithubCallout: boolean

  constructor(props: IBlockquoteWeaverProps = {}) {
    this.enableGithubCallout = props.enableGithubCallout ?? false
  }

  public weave(node: Blockquote): INodeMarkup {
    if (this.enableGithubCallout && node.callout) {
      return {
        opener: `> [!${node.callout.toUpperCase()}]\n> `,
        indent: '> ',
      }
    }
    return {
      opener: '> ',
      indent: '> ',
    }
  }
}
