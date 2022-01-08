import type {
  ITable,
  ITableColumn,
  IYastNodePosition,
  TableCellType,
  TableRowType,
  TableType,
} from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = TableType
export type INode = ITable
export const uniqueName = '@yozora/tokenizer-table'

export interface IToken extends IPartialYastBlockToken<TableType> {
  /**
   * Table column configuration items
   */
  columns: ITableColumn[]
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
  contents: IPhrasingContentToken[]
}
