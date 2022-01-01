import type { IList, ListType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import type { IListItemToken as IListItemToken0 } from '@yozora/tokenizer-list-item'

export type T = ListType
export type INode = IList
export const uniqueName = '@yozora/tokenizer-list'

export type IListItemToken = IListItemToken0 & IYastBlockToken

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * Is it an ordered list item.
   */
  ordered: boolean
  /**
   * Marker of a bullet list-item, or delimiter of an ordered list-item.
   */
  marker: number
  /**
   * Marker type of the list.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#attr-type
   */
  orderType?: '1' | 'a' | 'A' | 'i' | 'I'
  /**
   * The starting number of a ordered list-item.
   */
  start?: number
  /**
   * Whether if the list is loose.
   */
  spread: boolean
  /**
   * List items.
   */
  children: IListItemToken[]
}

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
