import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  ParagraphDataNodeType,
  ParagraphMatchPhaseState,
  PhrasingContentDataNode,
  PhrasingContentDataNodeType,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import {
  TableAlignType,
  TableColumn,
  TableDataNode,
  TableDataNodeType,
  TableMatchPhaseState,
} from './types/table'
import {
  TableCellDataNode,
  TableCellDataNodeType,
  TableCellMatchPhaseState,
} from './types/table-cell'
import {
  TableRowDataNode,
  TableRowDataNodeType,
  TableRowMatchPhaseState,
} from './types/table-row'


type T = TableDataNodeType | TableRowDataNodeType | TableCellDataNodeType


/**
 * Lexical Analyzer for TableDataNode
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
export class TableTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerParsePhaseHook<
      T,
      TableMatchPhaseState | TableRowMatchPhaseState | TableCellMatchPhaseState,
      TableDataNode | TableRowDataNode | TableCellDataNode>
{
  public readonly name = 'TableTokenizer'
  public readonly uniqueTypes: T[] = [
    TableDataNodeType,
    TableRowDataNodeType,
    TableCellDataNodeType,
  ]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ): BlockTokenizerMatchPhaseState[] {
    const results: BlockTokenizerMatchPhaseState[] = []

    /**
     * Find delimiter row
     *
     * The delimiter row consists of cells whose only content are
     * hyphens (-), and optionally, a leading or trailing colon (:),
     * or both, to indicate left, right, or center alignment respectively.
     * @see https://github.github.com/gfm/#delimiter-row
     */
    const calcTableColumn = (
      currentLine: PhrasingContentLine,
      previousLine: PhrasingContentLine,
    ): TableColumn[] | null => {
      /**
       * The previous line of the delimiter line must not be blank line
       */
      if (previousLine.firstNonWhiteSpaceIndex >= previousLine.codePositions.length) {
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
      let c = currentLine.codePositions[currentLine.firstNonWhiteSpaceIndex]
      let cIndex = (c.codePoint === AsciiCodePoint.VERTICAL_SLASH)
        ? currentLine.firstNonWhiteSpaceIndex + 1
        : currentLine.firstNonWhiteSpaceIndex

      for (; cIndex < currentLine.codePositions.length;) {
        for (; cIndex < currentLine.codePositions.length; ++cIndex) {
          c = currentLine.codePositions[cIndex]
          if (!isWhiteSpaceCharacter(c.codePoint)) break
        }
        if (cIndex >= currentLine.codePositions.length) break

        // eat left optional colon
        let leftColon = false
        if (c.codePoint === AsciiCodePoint.COLON) {
          leftColon = true
          cIndex += 1
        }

        let hyphenCount = 0
        for (; cIndex < currentLine.codePositions.length; ++cIndex) {
          c = currentLine.codePositions[cIndex]
          if (c.codePoint !== AsciiCodePoint.MINUS_SIGN) break
          hyphenCount += 1
        }

        // hyphen must be exist
        if (hyphenCount <= 0) return null

        // eat right optional colon
        let rightColon = false
        if (cIndex < currentLine.codePositions.length && c.codePoint === AsciiCodePoint.COLON) {
          rightColon = true
          cIndex += 1
        }

        // eating next pipe
        for (; cIndex < currentLine.codePositions.length; ++cIndex) {
          c = currentLine.codePositions[cIndex]
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
      for (let pIndex = 0; pIndex < previousLine.codePositions.length; ++pIndex) {
        const c = previousLine.codePositions[pIndex]
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
      if (hasNonWhitespaceBeforePipe) cellCount += 1
      if (cellCount !== columns.length) return null

      // Successfully matched to a legal table delimiter line
      return columns
    }

    /**
     * process table row
     */
    const calcTableRow = (
      line: PhrasingContentLine,
      columns: TableColumn[],
    ): TableRowMatchPhaseState => {
      const { firstNonWhiteSpaceIndex, codePositions } = line

      // eat leading pipe
      let c = codePositions[firstNonWhiteSpaceIndex]
      let i = (c.codePoint === AsciiCodePoint.VERTICAL_SLASH)
        ? firstNonWhiteSpaceIndex + 1
        : firstNonWhiteSpaceIndex

      // eat tableCells
      const tableCells: TableCellMatchPhaseState[] = []
      for (; i < codePositions.length; i += 1) {
        /**
         * Spaces between pipes and cell content are trimmed
         */
        for (; i < codePositions.length; ++i) {
          c = codePositions[i]
          if (!isWhiteSpaceCharacter(c.codePoint)) break
        }

        const contents: DataNodeTokenPointDetail[] = []

        /**
         * eating cell contents
         */
        for (; i < codePositions.length; ++i) {
          c = codePositions[i]
          /**
           * Include a pipe in a cell’s content by escaping it,
           * including inside other inline spans
           */
          if (c.codePoint === AsciiCodePoint.BACK_SLASH) {
            if (i + 1 < codePositions.length) {
              c = codePositions[i + 1]
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

        const tableCell: TableCellMatchPhaseState = {
          type: TableCellDataNodeType,
          classify: 'flow',
          children: [],
        }

        if (contents.length > 0) {
          const phrasingContent: PhrasingContentMatchPhaseState = {
            type: PhrasingContentDataNodeType,
            classify: 'flow',
            lines: [{
              codePositions: contents,
              firstNonWhiteSpaceIndex: 0,
            }]
          }
          tableCell.children = [phrasingContent]
        }

        tableCells.push(tableCell)

        /**
         * If there are greater, the excess is ignored
         * @see https://github.github.com/gfm/#example-204
         */
        if (tableCells.length >= columns.length) break
      }

      /**
       * The remainder of the table’s rows may vary in the number of cells.
       * If there are a number of cells fewer than the number of cells in
       * the header row, empty cells are inserted. If there are greater,
       * the excess is ignored
       * @see https://github.github.com/gfm/#example-204
       */
      for (let i = tableCells.length; i < columns.length; ++i) {
        const tableCell: TableCellMatchPhaseState = {
          type: TableCellDataNodeType,
          classify: 'flow',
          children: [],
        }
        tableCells.push(tableCell)
      }

      const tableRow: TableRowMatchPhaseState = {
        type: TableRowDataNodeType,
        classify: 'flow',
        children: tableCells,
      }
      return tableRow
    }

    /**
     *
     */
    for (const matchPhaseState of matchPhaseStates) {
      switch (matchPhaseState.type) {
        case ParagraphDataNodeType: {
          const originalParagraph = matchPhaseState as ParagraphMatchPhaseState
          const originalPhrasingContent = originalParagraph.children[0]

          // Find delimiter row
          let delimiterLineIndex = 1, columns: TableColumn[] | null = null
          for (; delimiterLineIndex < originalPhrasingContent.lines.length; ++delimiterLineIndex) {
            const previousLine = originalPhrasingContent.lines[delimiterLineIndex - 1]
            const line = originalPhrasingContent.lines[delimiterLineIndex]
            columns = calcTableColumn(line, previousLine)
            if (columns != null) break
          }

          /**
           * Does not match a legal delimiter
           */
          if (columns == null) {
            results.push(matchPhaseState)
            break
          }

          /**
           * Unmatched content above the table will still be treated as a paragraph
           */
          if (delimiterLineIndex > 1) {
            originalPhrasingContent.lines = originalPhrasingContent.lines
              .slice(0, delimiterLineIndex - 2)
            results.push(originalParagraph)
          }

          const tableRows: TableRowMatchPhaseState[] = []

          // process table header
          tableRows.push(
            calcTableRow(originalPhrasingContent.lines[delimiterLineIndex - 1], columns))

          // process table body
          for (let i = delimiterLineIndex + 1; i < originalPhrasingContent.lines.length; ++i) {
            tableRows.push(calcTableRow(originalPhrasingContent.lines[i], columns))
          }

          // process table
          const table: TableMatchPhaseState = {
            type: TableDataNodeType,
            classify: 'flow',
            columns,
            children: tableRows,
          }
          results.push(table)
          break
        }
        default:
          results.push(matchPhaseState)
      }
    }
    return results
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: TableMatchPhaseState | TableRowMatchPhaseState | TableCellMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): TableDataNode | TableRowDataNode | TableCellDataNode {
    switch (matchPhaseState.type) {
      case TableDataNodeType: {
        const result: TableDataNode = {
          type: TableDataNodeType,
          columns: (matchPhaseState as TableMatchPhaseState).columns,
          children: (children || []) as TableRowDataNode[],
        }
        return result
      }
      case TableRowDataNodeType: {
        const result: TableRowDataNode = {
          type: TableRowDataNodeType,
          children: (children || []) as TableCellDataNode[],
        }
        return result
      }
      case TableCellDataNodeType: {
        const result: TableCellDataNode = {
          type: TableCellDataNodeType,
          children: children as [PhrasingContentDataNode],
        }
        return result
      }
    }
  }
}
