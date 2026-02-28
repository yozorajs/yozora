import type { List, ListType, NodeType, TaskStatus } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IBlockToken,
  IPartialBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = ListType
export type INode = List
export const uniqueName = '@yozora/tokenizer-list'

export interface IToken extends IPartialBlockToken<T> {
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
  children: IBlockToken[]
}

export interface IThis extends ITokenizer {
  /**
   * Specify an array of Node types that could not be interrupted
   * by this ITokenizer if the current list-item is empty.
   * @see https://github.github.com/gfm/#example-263
   */
  readonly emptyItemCouldNotInterruptedTypes: readonly NodeType[]

  /**
   * Should enable task list item (extension).
   */
  readonly enableTaskListItem: boolean
}

export interface ITokenizerProps extends Partial<IBaseBlockTokenizerProps> {
  /**
   * Specify an array of Node types that could not be interrupted
   * by this ITokenizer if the current list-item is empty.
   * @see https://github.github.com/gfm/#example-263
   */
  readonly emptyItemCouldNotInterruptedTypes?: NodeType[]

  /**
   * Should enable task list item (extension).
   */
  readonly enableTaskListItem?: boolean
}
