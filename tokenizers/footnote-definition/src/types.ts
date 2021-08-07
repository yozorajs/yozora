import type { FootnoteDefinition, FootnoteDefinitionType } from '@yozora/ast'
import type { NodeInterval, NodePoint } from '@yozora/character'
import type {
  BaseBlockTokenizerProps,
  PartialYastBlockToken,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type T = FootnoteDefinitionType
export type Node = FootnoteDefinition
export const uniqueName = '@yozora/tokenizer-footnote-definition'

export interface Token extends PartialYastBlockToken<T> {
  /**
   * Footnote label
   */
  label: NodeInterval & { nodePoints: ReadonlyArray<NodePoint> }
  /**
   *
   */
  children: YastBlockToken[]
  /**
   * Resolved definition label.
   */
  _label?: string
  /**
   * Resolved definition identifier.
   */
  _identifier?: string
}

export type TokenizerProps = Partial<BaseBlockTokenizerProps>
