import type { IListItem, ListItemType, TaskStatus, YastNodeType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

export type T = ListItemType
export type INode = IListItem
export const uniqueName = '@yozora/tokenizer-list-item'

export interface IToken extends IPartialYastBlockToken<T> {
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
  children: IYastBlockToken[]
}

export interface IHookContext extends ITokenizer {
  /**
   * Specify an array of IYastNode types that could not be interrupted
   * by this ITokenizer if the current list-item is empty.
   * @see https://github.github.com/gfm/#example-263
   */
  readonly emptyItemCouldNotInterruptedTypes: ReadonlyArray<YastNodeType>

  /**
   * Should enable task list item (extension).
   */
  readonly enableTaskListItem: boolean
}

export interface ITokenizerProps extends Partial<IBaseBlockTokenizerProps> {
  /**
   * Specify an array of IYastNode types that could not be interrupted
   * by this ITokenizer if the current list-item is empty.
   * @see https://github.github.com/gfm/#example-263
   */
  readonly emptyItemCouldNotInterruptedTypes?: YastNodeType[]

  /**
   * Should enable task list item (extension).
   */
  readonly enableTaskListItem?: boolean
}
