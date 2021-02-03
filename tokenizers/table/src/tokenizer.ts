import type {
  EnhancedYastNodePoint,
  YastNodePoint,
} from '@yozora/tokenizercore'
import type { YastBlockNode } from '@yozora/tokenizercore-block'
import type {
  Table,
  TableColumn,
  TableMatchPhaseState,
  TableMatchPhaseStateData,
  TablePostMatchPhaseState,
} from './types/table'
import type {
  TableCell,
  TableCellMatchPhaseState,
  TableCellPostMatchPhaseState,
} from './types/table-cell'
import type {
  TableRow,
  TableRowMatchPhaseState,
  TableRowPostMatchPhaseState,
} from './types/table-row'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import {
  BlockTokenizer,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
  ImmutableBlockTokenizerContext,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
  PhrasingContentType,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import { calcPositionFromChildren } from '@yozora/tokenizercore-block'
import { TableAlignType, TableType } from './types/table'
import { TableCellType } from './types/table-cell'
import { TableRowType } from './types/table-row'


// YastNode type
type T = TableType | TableRowType | TableCellType

// Match phase state
type MS =
  | TableMatchPhaseState
  | TableRowMatchPhaseState
  | TableCellMatchPhaseState

// Post-Match phase state
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
 * Params for constructing TableTokenizer
 */
export interface TableTokenizerProps {

}


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
export class TableTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'TableTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly recognizedTypes: ReadonlyArray<T> = [
    TableType,
    TableRowType,
    TableCellType,
  ]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(props: TableTokenizerProps = {}) {

  }

  /**
   * @override
   * @see BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    states: ReadonlyArray<BlockTokenizerPostMatchPhaseState>,
  ): BlockTokenizerPostMatchPhaseState[] {
    // Check if the context exists.
    const context = this.getContext()
    if (context == null) {
      return states as BlockTokenizerPostMatchPhaseState[]
    }

    const results: BlockTokenizerPostMatchPhaseState[] = []
    for (const originalState of states) {
      let lines = context.extractPhrasingContentLines(originalState)

      // Cannot extract a valid PhrasingContentMatchPhaseStateData,
      // or no non-blank lines exists
      if (lines == null || lines.length <= 0) {
        results.push(originalState)
        continue
      }

      // Find delimiter row
      let delimiterLineIndex = 1, columns: TableColumn[] | null = null
      for (; delimiterLineIndex < lines.length; ++delimiterLineIndex) {
        const previousLine = lines[delimiterLineIndex - 1]
        const line = lines[delimiterLineIndex]
        columns = this.calcTableColumn(nodePoints, line, previousLine)
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
        lines = lines.slice(0, delimiterLineIndex - 1)
        const nextOriginalMatchPhaseState = context
          .buildPostMatchPhaseState(originalState, lines)
        if (nextOriginalMatchPhaseState != null) {
          results.push(nextOriginalMatchPhaseState)
        }
      }

      const rows: TableRowPostMatchPhaseState[] = []

      // process table header
      const headRow = this.calcTableRow(
        nodePoints, context, lines[delimiterLineIndex - 1], columns)
      rows.push(headRow)

      // process table body
      for (let i = delimiterLineIndex + 1; i < lines.length; ++i) {
        const row = this.calcTableRow(nodePoints, context, lines[i], columns)
        rows.push(row)
      }

      // process table
      const table: TablePostMatchPhaseState = {
        type: TableType,
        columns,
        position: calcPositionFromChildren(rows)!,
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    postMatchState: Readonly<PMS>,
    children?: YastBlockNode[],
  ): ResultOfParse<T, Table | TableRow | TableCell> {
    let state: Table | TableRow | TableCell
    switch (postMatchState.type) {
      case TableType: {
        state = {
          type: TableType,
          columns: (postMatchState as TableMatchPhaseStateData).columns,
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

        /**
         * Include a pipe in a cell’s content by escaping it, including inside
         * other inline spans
         * @see https://github.github.com/gfm/#example-200
         */
        for (const phrasingContent of state.children) {
          if (phrasingContent.type !== PhrasingContentType) continue
          const nextContents: EnhancedYastNodePoint[] = []
          const endIndex = phrasingContent.contents.length - 1
          for (let i = 0; i < endIndex; ++i) {
            const p = phrasingContent.contents[i]
            if (p.codePoint === AsciiCodePoint.BACKSLASH) {
              const q = phrasingContent.contents[i + 1]
              if (q.codePoint !== AsciiCodePoint.VERTICAL_SLASH) nextContents.push(p)
              nextContents.push(q)
              i += 1
              continue
            }
            nextContents.push(p)
          }

          if (endIndex >= 0) nextContents.push(phrasingContent.contents[endIndex])
          phrasingContent.contents = nextContents
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    currentLine: PhrasingContentLine,
    previousLine: PhrasingContentLine,
  ): TableColumn[] | null {
    /**
     * The previous line of the delimiter line must not be blank line
     */
    if (previousLine.firstNonWhitespaceIndex >= previousLine.endIndex) {
      return null
    }

    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-57
     */
    if (currentLine.firstNonWhitespaceIndex - currentLine.startIndex >= 4) return null

    const columns: TableColumn[] = []

    /**
     * eat leading optional pipe
     */
    let p = nodePoints[currentLine.firstNonWhitespaceIndex]
    let cIndex = (p.codePoint === AsciiCodePoint.VERTICAL_SLASH)
      ? currentLine.firstNonWhitespaceIndex + 1
      : currentLine.firstNonWhitespaceIndex

    for (; cIndex < currentLine.endIndex;) {
      for (; cIndex < currentLine.endIndex; ++cIndex) {
        p = nodePoints[cIndex]
        if (!isWhiteSpaceCharacter(p.codePoint)) break
      }
      if (cIndex >= currentLine.endIndex) break

      // eat left optional colon
      let leftColon = false
      if (p.codePoint === AsciiCodePoint.COLON) {
        leftColon = true
        cIndex += 1
      }

      let hyphenCount = 0
      for (; cIndex < currentLine.endIndex; ++cIndex) {
        p = nodePoints[cIndex]
        if (p.codePoint !== AsciiCodePoint.MINUS_SIGN) break
        hyphenCount += 1
      }

      // hyphen must be exist
      if (hyphenCount <= 0) return null

      // eat right optional colon
      let rightColon = false
      if (cIndex < currentLine.endIndex && p.codePoint === AsciiCodePoint.COLON) {
        rightColon = true
        cIndex += 1
      }

      // eating next pipe
      for (; cIndex < currentLine.endIndex; ++cIndex) {
        p = nodePoints[cIndex]
        if (isWhiteSpaceCharacter(p.codePoint)) continue
        if (p.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
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
    for (let pIndex = previousLine.startIndex; pIndex < previousLine.endIndex; ++pIndex) {
      const p = nodePoints[pIndex]
      if (isWhiteSpaceCharacter(p.codePoint)) continue

      if (p.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
        if (hasNonWhitespaceBeforePipe || cellCount > 0) cellCount += 1
        hasNonWhitespaceBeforePipe = false
        continue
      }

      hasNonWhitespaceBeforePipe = true

      /**
       * Include a pipe in a cell’s content by escaping it,
       * including inside other inline spans
       */
      if (p.codePoint === AsciiCodePoint.BACKSLASH) pIndex += 1
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    context: ImmutableBlockTokenizerContext,
    line: PhrasingContentLine,
    columns: TableColumn[],
  ): TableRowPostMatchPhaseState {
    const { firstNonWhitespaceIndex, startIndex, endIndex } = line

    // eat leading pipe
    let p = nodePoints[firstNonWhitespaceIndex]
    let i = (p.codePoint === AsciiCodePoint.VERTICAL_SLASH)
      ? firstNonWhitespaceIndex + 1
      : firstNonWhitespaceIndex

    // eat table cells
    const cells: TableCellPostMatchPhaseState[] = []
    for (; i < endIndex; i += 1) {
      /**
       * Spaces between pipes and cell content are trimmed
       */
      for (; i < endIndex; ++i) {
        p = nodePoints[i]
        if (!isWhiteSpaceCharacter(p.codePoint)) break
      }

      // Start point of the table-cell.
      const startPoint: YastNodePoint = i < endIndex
        ? calcStartYastNodePoint(nodePoints, i)
        : calcEndYastNodePoint(nodePoints, endIndex - 1)

      // Eating cell contents.
      const cellStartIndex = i, cellFirstNonWhiteSpaceIndex = i
      for (; i < endIndex; ++i) {
        p = nodePoints[i]
        /**
         * Include a pipe in a cell’s content by escaping it,
         * including inside other inline spans
         */
        if (p.codePoint === AsciiCodePoint.BACKSLASH) {
          i += 1
          continue
        }

        // pipe are boundary character
        if (p.codePoint === AsciiCodePoint.VERTICAL_SLASH) break
      }
      let cellEndIndex = i
      for (; cellEndIndex > cellStartIndex; --cellEndIndex) {
        const p = nodePoints[cellEndIndex - 1]
        if (!isWhiteSpaceCharacter(p.codePoint)) break
      }

      // End point of the table-cell
      const endPoint: YastNodePoint = calcEndYastNodePoint(nodePoints, i - 1)

      const phrasingContent: PhrasingContentPostMatchPhaseState | null =
        cellFirstNonWhiteSpaceIndex >= cellEndIndex
          ? null
          : context.buildPhrasingContentPostMatchPhaseState(
            nodePoints,
            [{
              nodePoints,
              startIndex: cellStartIndex,
              endIndex: cellEndIndex,
              firstNonWhitespaceIndex: cellFirstNonWhiteSpaceIndex,
            }])

      const cell: TableCellPostMatchPhaseState = {
        type: TableCellType,
        position: { start: startPoint, end: endPoint },
        children: phrasingContent == null ? [] : [phrasingContent],
      }
      cells.push(cell)

      /**
       * If there are greater, the excess is ignored
       * @see https://github.github.com/gfm/#example-204
       */
      if (cells.length >= columns.length) break
    }

    // Start point of the table-row
    const startPoint: YastNodePoint = calcStartYastNodePoint(nodePoints, startIndex)

    // End point of the table-row
    const endPoint: YastNodePoint =
      calcEndYastNodePoint(nodePoints, endIndex - 1)

    /**
     * The remainder of the table’s rows may vary in the number of cells.
     * If there are a number of cells fewer than the number of cells in
     * the header row, empty cells are inserted. If there are greater,
     * the excess is ignored
     * @see https://github.github.com/gfm/#example-204
     */
    for (let c = cells.length; c < columns.length; ++c) {
      const cell: TableCellPostMatchPhaseState = {
        type: TableCellType,
        position: { start: { ...endPoint }, end: { ...endPoint } },
        children: [],
      }
      cells.push(cell)
    }

    const row: TableRowPostMatchPhaseState = {
      type: TableRowType,
      position: { start: startPoint, end: endPoint },
      children: cells,
    }
    return row
  }
}
