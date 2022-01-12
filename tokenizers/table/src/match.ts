import type { IYastAlignType, IYastNodePoint, TableColumn } from '@yozora/ast'
import { TableCellType, TableRowType, TableType } from '@yozora/ast'
import { AsciiCodePoint, isWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatLazyContinuationText,
  IResultOfEatOpener,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import { calcEndYastNodePoint, calcStartYastNodePoint } from '@yozora/core-tokenizer'
import type { ITableCellToken, ITableRowToken, IThis, IToken, T } from './types'

/**
 * A table is an arrangement of data with rows and columns, consisting of
 * a single header row, a delimiter row separating the header from the data,
 * and zero or more data rows.
 *
 * Each row consists of cells containing arbitrary text, in which inlines
 * are parsed, separated by pipes (|). A leading and trailing pipe is also
 * recommended for clarity of reading, and if there’s otherwise parsing
 * ambiguity. Spaces between pipes and cell content are trimmed. Block-level
 * elements cannot be inserted in a table.
 *
 * @see https://github.github.com/gfm/#table
 * @see https://github.com/syntax-tree/mdast#tablerow
 * @see https://github.com/syntax-tree/mdast#tablecell
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function (api) {
  return {
    isContainingBlock: false,
    eatOpener,
    eatAndInterruptPreviousSibling,
    eatLazyContinuationText,
  }

  function eatOpener(): IResultOfEatOpener<T, IToken> {
    return null
  }

  function eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-57
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    const columns: TableColumn[] = []

    /**
     * eat leading optional pipe
     */
    let c = nodePoints[firstNonWhitespaceIndex].codePoint
    let cIndex =
      c === AsciiCodePoint.VERTICAL_SLASH ? firstNonWhitespaceIndex + 1 : firstNonWhitespaceIndex
    for (; cIndex < endIndex; ) {
      for (; cIndex < endIndex; ++cIndex) {
        c = nodePoints[cIndex].codePoint
        if (!isWhitespaceCharacter(c)) break
      }
      if (cIndex >= endIndex) break

      // eat left optional colon
      let leftColon = false
      if (c === AsciiCodePoint.COLON) {
        leftColon = true
        cIndex += 1
      }

      let hyphenCount = 0
      for (; cIndex < endIndex; ++cIndex) {
        c = nodePoints[cIndex].codePoint
        if (c !== AsciiCodePoint.MINUS_SIGN) break
        hyphenCount += 1
      }

      // hyphen must be exist
      if (hyphenCount <= 0) return null

      // eat right optional colon
      let rightColon = false
      if (cIndex < endIndex && c === AsciiCodePoint.COLON) {
        rightColon = true
        cIndex += 1
      }

      // eating next pipe
      for (; cIndex < endIndex; ++cIndex) {
        c = nodePoints[cIndex].codePoint
        if (isWhitespaceCharacter(c)) continue
        if (c === AsciiCodePoint.VERTICAL_SLASH) {
          cIndex += 1
          break
        }

        // There are other non-white space characters
        return null
      }

      let align: IYastAlignType = null
      if (leftColon && rightColon) align = 'center'
      else if (leftColon) align = 'left'
      else if (rightColon) align = 'right'
      const column: TableColumn = { align }
      columns.push(column)
    }

    if (columns.length <= 0) return null

    const lines = api.extractPhrasingLines(prevSiblingToken)
    if (lines == null || lines.length < 1) return null

    /**
     * The header row must match the delimiter row in the number of cells.
     * If not, a table will not be recognized
     * @see https://github.github.com/gfm/#example-203
     */
    let cellCount = 0,
      hasNonWhitespaceBeforePipe = false
    const previousLine = lines[lines.length - 1]
    for (let pIndex = previousLine.startIndex; pIndex < previousLine.endIndex; ++pIndex) {
      const p = nodePoints[pIndex]
      if (isWhitespaceCharacter(p.codePoint)) continue

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

    const row = calcTableRow(previousLine, columns)
    const nextIndex = endIndex
    const token: IToken = {
      nodeType: TableType,
      position: {
        start: calcStartYastNodePoint(previousLine.nodePoints, previousLine.startIndex),
        end: calcEndYastNodePoint(nodePoints, nextIndex - 1),
      },
      columns,
      rows: [row],
    }
    return {
      token,
      nextIndex,
      remainingSibling: api.rollbackPhrasingLines(
        lines.slice(0, lines.length - 1),
        prevSiblingToken,
      ),
    }
  }

  function eatLazyContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatLazyContinuationText {
    if (line.firstNonWhitespaceIndex >= line.endIndex) {
      return { status: 'notMatched' }
    }

    const row = calcTableRow(line, token.columns)
    if (row == null) return { status: 'notMatched' }

    token.rows.push(row)
    return { status: 'opening', nextIndex: line.endIndex }
  }

  // process table row
  function calcTableRow(line: IPhrasingContentLine, columns: TableColumn[]): ITableRowToken {
    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line

    // eat leading pipe
    let p = nodePoints[firstNonWhitespaceIndex]
    let i =
      p.codePoint === AsciiCodePoint.VERTICAL_SLASH
        ? firstNonWhitespaceIndex + 1
        : firstNonWhitespaceIndex

    // eat table cells
    const cells: ITableCellToken[] = []
    for (; i < endIndex; i += 1) {
      /**
       * Spaces between pipes and cell content are trimmed
       */
      for (; i < endIndex; ++i) {
        p = nodePoints[i]
        if (!isWhitespaceCharacter(p.codePoint)) break
      }

      // Start point of the table-cell.
      const startPoint: IYastNodePoint =
        i < endIndex
          ? calcStartYastNodePoint(nodePoints, i)
          : calcEndYastNodePoint(nodePoints, endIndex - 1)

      // Eating cell contents.
      const cellStartIndex = i,
        cellFirstNonWhitespaceIndex = i
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
        if (!isWhitespaceCharacter(p.codePoint)) break
      }

      // End point of the table-cell
      const endPoint: IYastNodePoint = calcEndYastNodePoint(nodePoints, i - 1)

      const lines: IPhrasingContentLine[] =
        cellFirstNonWhitespaceIndex >= cellEndIndex
          ? []
          : [
              {
                nodePoints,
                startIndex: cellStartIndex,
                endIndex: cellEndIndex,
                firstNonWhitespaceIndex: cellFirstNonWhitespaceIndex,
                countOfPrecedeSpaces: cellFirstNonWhitespaceIndex - cellStartIndex,
              },
            ]

      const cell: ITableCellToken = {
        nodeType: TableCellType,
        position: { start: startPoint, end: endPoint },
        lines: lines,
      }
      cells.push(cell)

      /**
       * If there are greater, the excess is ignored
       * @see https://github.github.com/gfm/#example-204
       */
      if (cells.length >= columns.length) break
    }

    // Start point of the table-row
    const startPoint: IYastNodePoint = calcStartYastNodePoint(nodePoints, startIndex)

    // End point of the table-row
    const endPoint: IYastNodePoint = calcEndYastNodePoint(nodePoints, endIndex - 1)

    /**
     * The remainder of the table’s rows may vary in the number of cells.
     * If there are a number of cells fewer than the number of cells in
     * the header row, empty cells are inserted. If there are greater,
     * the excess is ignored
     * @see https://github.github.com/gfm/#example-204
     */
    for (let c = cells.length; c < columns.length; ++c) {
      const cell: ITableCellToken = {
        nodeType: TableCellType,
        position: { start: { ...endPoint }, end: { ...endPoint } },
        lines: [],
      }
      cells.push(cell)
    }

    const row: ITableRowToken = {
      nodeType: TableRowType,
      position: { start: startPoint, end: endPoint },
      cells,
    }
    return row
  }
}

/**
 * Find delimiter row
 *
 * The delimiter row consists of cells whose only content are
 * hyphens (-), and optionally, a leading or trailing colon (:),
 * or both, to indicate left, right, or center alignment respectively.
 * @see https://github.github.com/gfm/#delimiter-row
 */
// function calcTableColumn(
//   nodePoints: ReadonlyArray<INodePoint>,
//   currentLine: IPhrasingContentLine,
//   previousLine: IPhrasingContentLine,
// ): TableColumn[] | null {
//   /**
//    * The previous line of the delimiter line must not be blank line
//    */
//   if (previousLine.firstNonWhitespaceIndex >= previousLine.endIndex) {
//     return null
//   }

//   /**
//    * Four spaces is too much
//    * @see https://github.github.com/gfm/#example-57
//    */
//   if (currentLine.firstNonWhitespaceIndex - currentLine.startIndex >= 4) return null

//   const columns: TableColumn[] = []

//   /**
//    * eat leading optional pipe
//    */
//   let p = nodePoints[currentLine.firstNonWhitespaceIndex]
//   let cIndex =
//     p.codePoint === AsciiCodePoint.VERTICAL_SLASH
//       ? currentLine.firstNonWhitespaceIndex + 1
//       : currentLine.firstNonWhitespaceIndex

//   for (; cIndex < currentLine.endIndex; ) {
//     for (; cIndex < currentLine.endIndex; ++cIndex) {
//       p = nodePoints[cIndex]
//       if (!isWhitespaceCharacter(p.codePoint)) break
//     }
//     if (cIndex >= currentLine.endIndex) break

//     // eat left optional colon
//     let leftColon = false
//     if (p.codePoint === AsciiCodePoint.COLON) {
//       leftColon = true
//       cIndex += 1
//     }

//     let hyphenCount = 0
//     for (; cIndex < currentLine.endIndex; ++cIndex) {
//       p = nodePoints[cIndex]
//       if (p.codePoint !== AsciiCodePoint.MINUS_SIGN) break
//       hyphenCount += 1
//     }

//     // hyphen must be exist
//     if (hyphenCount <= 0) return null

//     // eat right optional colon
//     let rightColon = false
//     if (cIndex < currentLine.endIndex && p.codePoint === AsciiCodePoint.COLON) {
//       rightColon = true
//       cIndex += 1
//     }

//     // eating next pipe
//     for (; cIndex < currentLine.endIndex; ++cIndex) {
//       p = nodePoints[cIndex]
//       if (isWhitespaceCharacter(p.codePoint)) continue
//       if (p.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
//         cIndex += 1
//         break
//       }

//       // There are other non-white space characters
//       return null
//     }

//     let align: IYastAlignType = null
//     if (leftColon && rightColon) align = 'center'
//     else if (leftColon) align = 'left'
//     else if (rightColon) align = 'right'
//     const column: TableColumn = { align }
//     columns.push(column)
//   }

//   if (columns.length <= 0) return null

//   /**
//    * The header row must match the delimiter row in the number of cells.
//    * If not, a table will not be recognized
//    * @see https://github.github.com/gfm/#example-203
//    */
//   let cellCount = 0,
//     hasNonWhitespaceBeforePipe = false
//   for (let pIndex = previousLine.startIndex; pIndex < previousLine.endIndex; ++pIndex) {
//     const p = nodePoints[pIndex]
//     if (isWhitespaceCharacter(p.codePoint)) continue

//     if (p.codePoint === AsciiCodePoint.VERTICAL_SLASH) {
//       if (hasNonWhitespaceBeforePipe || cellCount > 0) cellCount += 1
//       hasNonWhitespaceBeforePipe = false
//       continue
//     }

//     hasNonWhitespaceBeforePipe = true

//     /**
//      * Include a pipe in a cell’s content by escaping it,
//      * including inside other inline spans
//      */
//     if (p.codePoint === AsciiCodePoint.BACKSLASH) pIndex += 1
//   }
//   if (hasNonWhitespaceBeforePipe && columns.length > 1) cellCount += 1
//   if (cellCount !== columns.length) return null

//   // Successfully matched to a legal table delimiter line
//   return columns
// }
