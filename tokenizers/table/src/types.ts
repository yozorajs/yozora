import type {
  Table,
  TableCell,
  TableCellType,
  TableColumn,
  TableRow,
  TableRowType,
  TableType,
} from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PhrasingContentToken,
  YastBlockToken,
} from '@yozora/core-tokenizer'

export type T = TableType | TableRowType | TableCellType
export type Node = Table | TableRow | TableCell
export type Token = TableToken | TableRowToken | TableCellToken
export const uniqueName = '@yozora/tokenizer-table'

export interface TableToken extends YastBlockToken<TableType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
  /**
   * Table rows
   */
  children: TableRowToken[]
}

export interface TableRowToken extends YastBlockToken<TableRowType> {
  /**
   * Table cells
   */
  children: TableCellToken[]
}

export interface TableCellToken extends YastBlockToken<TableCellType> {
  /**
   * Contents of table cell.
   */
  children: PhrasingContentToken[]
}

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
