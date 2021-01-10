import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
  BlockTokenizerProps,
  PhrasingContent,
  PhrasingContentLine,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  Table,
  TableColumn,
  TableMatchPhaseStateData,
  TablePostMatchPhaseState,
} from './types/table'
import type {
  TableCell,
  TableCellPostMatchPhaseState,
} from './types/table-cell'
import type { TableRow, TableRowPostMatchPhaseState } from './types/table-row'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  BaseBlockTokenizer,
  PhrasingContentType,
} from '@yozora/tokenizercore-block'
import { TableAlignType, TableType } from './types/table'
import { TableCellType } from './types/table-cell'
import { TableRowType } from './types/table-row'


// YastNode type
type T = TableType | TableRowType | TableCellType

// Match phase state data
type PMS =
  | TablePostMatchPhaseState
  | TableRowPostMatchPhaseState
  | TableCellPostMatchPhaseState

// Parse phase state
type PS =
  | Table
  | TableRow
  | TableCell


/**
 * Lexical Analyzer for Table
 *
 * A table is an arrangement of data with rows and columns, consisting of
 * a single header row, a delimiter row separating the header from the data,
 * and zero or more data rows.
 *
 * Each row consists of cells containing arbitrary text, in which inlines
 * are parsed, separated by pipes (|). A leading and trailing pipe is also
 * recommended for clarity of reading, and if there’s otherwise parsing
 * ambiguity. Spaces between pipes and cell content are trimmed. Block-level
 * elements cannot be inserted in a table.
 * @see https://github.github.com/gfm/#table
 */
export class TableTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'TableTokenizer'
  public readonly uniqueTypes: T[] = [TableType, TableRowType, TableCellType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [],
    })
  }

  /**
   * @override
   * @see BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    states: ReadonlyArray<BlockTokenizerPostMatchPhaseState>,
  ): BlockTokenizerPostMatchPhaseState[] {
    // Check if the context exists.
    const context = this.getContext()
    if (context == null) {
      return states as BlockTokenizerPostMatchPhaseState[]
    }

    const results: BlockTokenizerPostMatchPhaseState[] = []
    for (const originalState of states) {
      const phrasingContentState = context
        .extractPhrasingContentMatchPhaseState(originalState)

      // Cannot extract a valid PhrasingContentMatchPhaseStateData,
      // or no non-blank lines exists
      if (
        phrasingContentState == null ||
        phrasingContentState.lines.length <= 0
      ) {
        results.push(originalState)
        continue
      }

      const { lines } = phrasingContentState

      // Find delimiter row
      let delimiterLineIndex = 1, columns: TableColumn[] | null = null
      for (; delimiterLineIndex < lines.length; ++delimiterLineIndex) {
        const previousLine = lines[delimiterLineIndex - 1]
        const line = lines[delimiterLineIndex]
        columns = this.calcTableColumn(line, previousLine)
        if (columns != null) break
      }

      /**
       * Does not match a legal delimiter
       */
      if (columns == null || delimiterLineIndex >= lines.length) {
        results.push(originalState)
        continue
      }

      /**
       * Unmatched content above the table will still be treated as a paragraph
       */
      if (delimiterLineIndex > 1) {
        phrasingContentState.lines = lines.slice(0, delimiterLineIndex - 1)
        const nextOriginalMatchPhaseState = context
          .buildPostMatchPhaseState(originalState, phrasingContentState)
        if (nextOriginalMatchPhaseState != null) {
          results.push(nextOriginalMatchPhaseState)
        }
      }

      const rows: TableRowPostMatchPhaseState[] = []

      // process table header
      const headRow = this.calcTableRow(
        phrasingContentState.lines[delimiterLineIndex - 1], columns)
      rows.push(headRow)

      // process table body
      for (let i = delimiterLineIndex + 1; i < phrasingContentState.lines.length; ++i) {
        const row = this.calcTableRow(phrasingContentState.lines[i], columns)
        rows.push(row)
      }

      // process table
      const table: TablePostMatchPhaseState = {
        type: TableType,
        columns,
        children: rows,
      }
      results.push(table)
    }

    return results
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseStateData: MSD,
    children?: BlockTokenizerParsePhaseState[],
  ): ResultOfParse<T, Table | TableRow | TableCell> {
    let state: Table | TableRow | TableCell
    switch (matchPhaseStateData.type) {
      case TableType: {
        state = {
          type: TableType,
          columns: (matchPhaseStateData as TableMatchPhaseStateData).columns,
          children: (children || []) as TableRow[],
        }
        break
      }
      case TableRowType: {
        state = {
          type: TableRowType,
          children: (children || []) as TableCell[],
        }
        break
      }
      case TableCellType: {
        state = {
          type: TableCellType,
          children: children as PhrasingContent[],
        }
        break
      }
      default:
        return null
    }
    return { classification: 'flow', state }
  }


  /**
   * Find delimiter row
   *
   * The delimiter row consists of cells whose only content are
   * hyphens (-), and optionally, a leading or trailing colon (:),
   * or both, to indicate left, right, or center alignment respectively.
   * @see https://github.github.com/gfm/#delimiter-row
   */
  protected calcTableColumn(
    currentLine: PhrasingContentLine,
    previousLine: PhrasingContentLine,
  ): TableColumn[] | null {
    /**
     * The previous line of the delimiter line must not be blank line
     */
    if (previousLine.firstNonWhiteSpaceIndex >= previousLine.nodePoints.length) {
      return null
    }

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-57
     */
    if (currentLine.firstNonWhiteSpaceIndex >= 4) {
      return null
    }

    const columns: TableColumn[] = []

    /**
     * eat leading optional pipe
     */
    let c = currentLine.nodePoints[currentLine.firstNonWhiteSpaceIndex]
    let cIndex = (c.codePoint === AsciiCodePoint.VERTICAL_SLASH)
      ? currentLine.firstNonWhiteSpaceIndex + 1
      : currentLine.firstNonWhiteSpaceIndex

    for (; cIndex < currentLine.nodePoints.length;) {
      for (; cIndex < currentLine.nodePoints.length; ++cIndex) {
        c = currentLine.nodePoints[cIndex]
        if (!isWhiteSpaceCharacter(c.codePoint)) break
      }
      if (cIndex >= currentLine.nodePoints.length) break

      // eat left optional colon
      let leftColon = false
      if (c.codePoint === AsciiCodePoint.COLON) {
        leftColon = true
        cIndex += 1
      }

      let hyphenCount = 0
      for (; cIndex < currentLine.nodePoints.length; ++cIndex) {
        c = currentLine.nodePoints[cIndex]
        if (c.codePoint !== AsciiCodePoint.MINUS_SIGN) break
        hyphenCount += 1
      }

      // hyphen must be exist
      if (hyphenCount <= 0) return null

      // eat right optional colon
      let rightColon = false
      if (cIndex < currentLine.nodePoints.length && c.codePoint === AsciiCodePoint.COLON) {
        rightColon = true
        cIndex += 1
      }

      // eating next pipe
      for (; cIndex < currentLine.nodePoints.length; ++cIndex) {
        c = currentLine.nodePoints[cIndex]
        if (isWhiteSpaceCharacter(c.codePoint)) continue
        if (c.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
          cIndex += 1
          break
        }

        // There are other non-white space characters
        return null
      }

      let align: TableAlignType = null
      if (leftColon && rightColon) align = 'center'
      else if (leftColon) align = 'left'
      else if (rightColon) align = 'right'
      const column: TableColumn = { align }
      columns.push(column)
    }

    if (columns.length <= 0) return null

    /**
     * The header row must match the delimiter row in the number of cells.
     * If not, a table will not be recognized
     * @see https://github.github.com/gfm/#example-203
     */
    let cellCount = 0, hasNonWhitespaceBeforePipe = false
    for (let pIndex = 0; pIndex < previousLine.nodePoints.length; ++pIndex) {
      const c = previousLine.nodePoints[pIndex]
      if (isWhiteSpaceCharacter(c.codePoint)) continue

      if (c.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
        if (hasNonWhitespaceBeforePipe || cellCount > 0) cellCount += 1
        hasNonWhitespaceBeforePipe = false
        continue
      }

      hasNonWhitespaceBeforePipe = true

      /**
       * Include a pipe in a cell’s content by escaping it,
       * including inside other inline spans
       */
      if (c.codePoint === AsciiCodePoint.BACK_SLASH) {
        pIndex += 1
      }
    }
    if (hasNonWhitespaceBeforePipe && columns.length > 1) cellCount += 1
    if (cellCount !== columns.length) return null

    // Successfully matched to a legal table delimiter line
    return columns
  }

  /**
   * process table row
   */
  protected calcTableRow(
    line: PhrasingContentLine,
    columns: TableColumn[],
  ): TableRowPostMatchPhaseState {
    const { firstNonWhiteSpaceIndex, nodePoints } = line

    // eat leading pipe
    let c = nodePoints[firstNonWhiteSpaceIndex]
    let i = (c.codePoint === AsciiCodePoint.VERTICAL_SLASH)
      ? firstNonWhiteSpaceIndex + 1
      : firstNonWhiteSpaceIndex

    // eat table cells
    const cells: TableCellPostMatchPhaseState[] = []
    for (; i < nodePoints.length; i += 1) {
      /**
       * Spaces between pipes and cell content are trimmed
       */
      for (; i < nodePoints.length; ++i) {
        c = nodePoints[i]
        if (!isWhiteSpaceCharacter(c.codePoint)) break
      }

      const contents: EnhancedYastNodePoint[] = []

      /**
       * eating cell contents
       */
      for (; i < nodePoints.length; ++i) {
        c = nodePoints[i]
        /**
         * Include a pipe in a cell’s content by escaping it,
         * including inside other inline spans
         */
        if (c.codePoint === AsciiCodePoint.BACK_SLASH) {
          if (i + 1 < nodePoints.length) {
            c = nodePoints[i + 1]
            if (c.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
              contents.push(c)
            }
          }
          i += 1
          continue
        }

        // pipe are boundary character
        if (c.codePoint === AsciiCodePoint.VERTICAL_SLASH) break
        contents.push(c)
      }

      const cell: TableCellPostMatchPhaseState = {
        type: TableCellType,
        children: [],
      }

      if (contents.length > 0) {
        const phrasingContent: PhrasingContentpostMatchPhaseState = {
          type: PhrasingContentType,
          lines: [{
            nodePoints: contents,
            firstNonWhiteSpaceIndex: 0,
          }]
        }
        cell.children = [phrasingContent]
      }

      cells.push(cell)

      /**
       * If there are greater, the excess is ignored
       * @see https://github.github.com/gfm/#example-204
       */
      if (cells.length >= columns.length) break
    }

    /**
     * The remainder of the table’s rows may vary in the number of cells.
     * If there are a number of cells fewer than the number of cells in
     * the header row, empty cells are inserted. If there are greater,
     * the excess is ignored
     * @see https://github.github.com/gfm/#example-204
     */
    for (let i = cells.length; i < columns.length; ++i) {
      const cell: TableCellpostMatchPhaseState = {
        type: TableCellType,
        children: [],
      }
      cells.push(cell)
    }

    const row: TableRowPostMatchPhaseState = {
      type: TableRowType,
      children: cells,
    }
    return row
  }
}
