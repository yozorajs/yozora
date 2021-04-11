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
   * List type.
   */
  listType: string
  /**
   * The starting number of a ordered list-item.
   */
  start?: number
  /**
   * Marker of a bullet list-item, or delimiter of an ordered list-item.
   */
  marker: number
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
