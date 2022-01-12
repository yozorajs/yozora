import type { FootnoteDefinition, FootnoteDefinitionType } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

export type T = FootnoteDefinitionType
export type INode = FootnoteDefinition
export const uniqueName = '@yozora/tokenizer-footnote-definition'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * Footnote label
   */
  label: INodeInterval & { nodePoints: ReadonlyArray<INodePoint> }
  /**
   *
   */
  children: IYastBlockToken[]
  /**
   * Resolved definition label.
   */
  _label?: string
  /**
   * Resolved definition identifier.
   */
  _identifier?: string
}

export interface IThis extends ITokenizer {
  indent: number
}

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
