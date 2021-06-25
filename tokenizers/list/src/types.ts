import type { List, ListType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastBlockToken,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import type { ListItemToken as _ListItemToken } from '@yozora/tokenizer-list-item'

export type T = ListType
export type Node = List
export const uniqueName = '@yozora/tokenizer-list'

export type ListItemToken = _ListItemToken & YastBlockToken

export interface Token extends PartialYastBlockToken<T> {
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
  children: ListItemToken[]
}

export type TokenizerProps = Partial<BaseTokenizerProps>
