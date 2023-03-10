import type {
  Position,
  Table,
  TableCellType,
  TableColumn,
  TableRowType,
  TableType,
} from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = TableType
export type INode = Table
export const uniqueName = '@yozora/tokenizer-table'

export interface IToken extends IPartialBlockToken<TableType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
  /**
   * Table rows
   */
  rows: ITableRowToken[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>

export interface ITableRowToken extends IPartialBlockToken<TableRowType> {
  cells: ITableCellToken[]
}

export interface ITableCellToken extends IPartialBlockToken<TableCellType> {
  position: Position
  lines: IPhrasingContentLine[]
}
