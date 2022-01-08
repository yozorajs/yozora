import type { IYastNodePosition } from '@yozora/ast'
import { EcmaImportType } from '@yozora/ast'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/character'
import type {
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { calcEndYastNodePoint, calcStartYastNodePoint } from '@yozora/core-tokenizer'
import type { IThis, IToken, T } from './types'
import { regex1, regex2, regex3, resolveNameImports } from './util'

/**
 * Examples
 *
 *    import '@yozora/parser'
 *    import Parser from '@yozora/parser'
 *    import Parser, { YozoraParserProps } from '@yozora/parser'
 *    import { YozoraParserProps } from '@yozora/parser'
 *    import { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 *
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function () {
  return {
    isContainingBlock: false,
    eatOpener,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * Four spaces are too much
     * @see https://github.github.com/gfm/#example-180
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex + 8 >= endIndex) return null

    const i = firstNonWhitespaceIndex

    if (nodePoints[i].codePoint !== AsciiCodePoint.LOWERCASE_I) return null
    if (nodePoints[i + 1].codePoint !== AsciiCodePoint.LOWERCASE_M) return null
    if (nodePoints[i + 2].codePoint !== AsciiCodePoint.LOWERCASE_P) return null
    if (nodePoints[i + 3].codePoint !== AsciiCodePoint.LOWERCASE_O) return null
    if (nodePoints[i + 4].codePoint !== AsciiCodePoint.LOWERCASE_R) return null
    if (nodePoints[i + 5].codePoint !== AsciiCodePoint.LOWERCASE_T) return null

    const [left, right] = calcTrimBoundaryOfCodePoints(
      nodePoints,
      firstNonWhitespaceIndex,
      endIndex,
    )
    const text: string = calcStringFromNodePoints(nodePoints, left, right)
    let m: RegExpExecArray | null

    let token: IToken | null = null
    const position = (): IYastNodePosition => ({
      start: calcStartYastNodePoint(nodePoints, startIndex),
      end: calcEndYastNodePoint(nodePoints, endIndex - 1),
    })

    // eslint-disable-next-line no-cond-assign
    if ((m = regex1.exec(text)) != null) {
      token = {
        nodeType: EcmaImportType,
        position: position(),
        moduleName: m[2],
        defaultImport: null,
        namedImports: [],
      }
    }

    // eslint-disable-next-line no-cond-assign
    else if ((m = regex2.exec(text)) != null) {
      token = {
        nodeType: EcmaImportType,
        position: position(),
        moduleName: m[3],
        defaultImport: m[1],
        namedImports: [],
      }
    }

    // eslint-disable-next-line no-cond-assign
    else if ((m = regex3.exec(text)) != null) {
      token = {
        nodeType: EcmaImportType,
        position: position(),
        moduleName: m[4],
        defaultImport: m[1],
        namedImports: resolveNameImports(m[2]),
      }
    }

    return token === null ? null : { token, nextIndex: endIndex, saturated: true }
  }
}
