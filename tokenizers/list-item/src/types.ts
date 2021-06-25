import type {
  ListItem,
  ListItemType,
  TaskStatus,
  YastNodeType,
} from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastBlockToken,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type T = ListItemType
export type Node = ListItem
export const uniqueName = '@yozora/tokenizer-list-item'

export interface Token extends PartialYastBlockToken<T> {
  /**
   * Is it an ordered list item.
   */
  ordered: boolean
  /**
   * Marker of bullet list-item, or a delimiter of ordered list-item.
   */
  marker: number
  /**
   * Marker type of the list.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#attr-type
   */
  orderType?: '1' | 'a' | 'A' | 'i' | 'I'
  /**
   * Serial number of ordered list-item.
   */
  order?: number
  /**
   * Status of a todo task.
   */
  status?: TaskStatus
  /**
   * Indent of a list item.
   */
  indent: number
  /**
   * list-item 起始的空行数量
   * The number of blank lines at the beginning of a list-item
   */
  countOfTopBlankLine: number
  /**
   * Child token nodes.
   */
  children: YastBlockToken[]
}

export interface TokenizerProps extends Partial<BaseTokenizerProps> {
  /**
   * Specify an array of YastNode types that could not be interrupted
   * by this Tokenizer if the current list-item is empty.
   * @see https://github.github.com/gfm/#example-263
   */
  readonly emptyItemCouldNotInterruptedTypes?: YastNodeType[]

  /**
   * Should enable task list item (extension).
   */
  readonly enableTaskListItem?: boolean
}
