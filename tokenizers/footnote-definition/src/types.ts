import type { FootnoteDefinition, FootnoteDefinitionType } from '@yozora/ast'
import type { NodeInterval, NodePoint } from '@yozora/character'
import type {
  BaseTokenizerProps,
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
}

export type TokenizerProps = Partial<BaseTokenizerProps>
