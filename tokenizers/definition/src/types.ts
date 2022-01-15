import type { Definition, DefinitionType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'
import type { ILinkDestinationCollectingState } from './util/link-destination'
import type { ILinkLabelCollectingState } from './util/link-label'
import type { ILinkTitleCollectingState } from './util/link-title'

export type T = DefinitionType
export type INode = Definition
export const uniqueName = '@yozora/tokenizer-definition'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   *
   */
  lines: Array<Readonly<IPhrasingContentLine>>
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: ILinkLabelCollectingState
  /**
   * Link destination
   */
  destination: ILinkDestinationCollectingState | null
  /**
   * Link title
   */
  title: ILinkTitleCollectingState | null
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
  /**
   * Resolved definition label.
   */
  _label?: string
  /**
   * Resolved definition identifier.
   */
  _identifier?: string
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
