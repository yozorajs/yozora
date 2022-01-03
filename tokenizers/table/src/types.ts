import type {
  ITable,
  ITableCell,
  ITableColumn,
  ITableRow,
  TableCellType,
  TableRowType,
  TableType,
} from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentToken,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

export type T = TableType | TableRowType | TableCellType
export type INode = ITable | ITableRow | ITableCell
export type IToken = ITableToken | ITableRowToken | ITableCellToken
export const uniqueName = '@yozora/tokenizer-table'

export interface ITableToken extends IPartialYastBlockToken<TableType> {
  /**
   * Table column configuration items
   */
  columns: ITableColumn[]
  /**
   * Table rows
   */
  children: ITableRowToken[]
}

export interface ITableRowToken extends IYastBlockToken<TableRowType> {
  /**
   * Table cells
   */
  children: ITableCellToken[]
}

export interface ITableCellToken extends IYastBlockToken<TableCellType> {
  /**
   * Contents of table cell.
   */
  children: IPhrasingContentToken[]
}

export type IHookContext = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
