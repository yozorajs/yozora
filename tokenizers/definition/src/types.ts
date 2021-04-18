import type { Definition, DefinitionType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastBlockToken,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'
import type { LinkDestinationCollectingState } from './util/link-destination'
import type { LinkLabelCollectingState } from './util/link-label'
import type { LinkTitleCollectingState } from './util/link-title'

export type T = DefinitionType
export type Node = Definition
export const uniqueName = '@yozora/tokenizer-definition'

export interface Token extends PartialYastBlockToken<T> {
  /**
   *
   */
  lines: PhrasingContentLine[]
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: LinkLabelCollectingState
  /**
   * Link destination
   */
  destination: LinkDestinationCollectingState | null
  /**
   * Link title
   */
  title: LinkTitleCollectingState | null
  /**
   * The line number of the first matched character of the link label
   */
  lineNoOfLabel: number
  /**
   * The line number of the first matched character of the link destination
   */
  lineNoOfDestination: number
  /**
   * The line number of the first matched character of the link title
   */
  lineNoOfTitle: number
}

export type TokenizerProps = Partial<BaseTokenizerProps>