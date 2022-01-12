import type {
  IYastNodePosition,
  Table,
  TableCellType,
  TableColumn,
  TableRowType,
  TableType,
} from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = TableType
export type INode = Table
export const uniqueName = '@yozora/tokenizer-table'

export interface IToken extends IPartialYastBlockToken<TableType> {
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

export interface ITableRowToken extends IPartialYastBlockToken<TableRowType> {
  cells: ITableCellToken[]
}

export interface ITableCellToken extends IPartialYastBlockToken<TableCellType> {
  position: IYastNodePosition
  lines: IPhrasingContentLine[]
}
