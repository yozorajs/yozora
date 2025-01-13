import { HtmlType } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  IBlockToken,
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatContinuationText,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { calcEndPoint, calcStartPoint, eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import { eatEndCondition1, eatStartCondition1 } from './conditions/c1'
import { eatEndCondition2, eatStartCondition2 } from './conditions/c2'
import { eatEndCondition3, eatStartCondition3 } from './conditions/c3'
import { eatEndCondition4, eatStartCondition4 } from './conditions/c4'
import { eatEndCondition5, eatStartCondition5 } from './conditions/c5'
import { eatStartCondition6 } from './conditions/c6'
import { eatStartCondition7 } from './conditions/c7'
import type { HtmlBlockConditionType, IThis, IToken, T } from './types'
import { eatHTMLTagName } from './util/eat-html-tagname'

/**
 * An HTML block is a group of lines that is treated as raw HTML (and will not
 * be escaped in HTML output).
 *
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 */
export const match: IMatchBlockHookCreator<T, IToken, IThis> = function () {
  return {
    isContainingBlock: false,
    eatOpener,
    eatAndInterruptPreviousSibling,
    eatContinuationText,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * The opening tag can be indented 1-3 spaces, but not 4.
     * @see https://github.github.com/gfm/#example-152
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (
      firstNonWhitespaceIndex >= endIndex ||
      nodePoints[firstNonWhitespaceIndex].codePoint !== AsciiCodePoint.OPEN_ANGLE
    )
      return null

    const i = firstNonWhitespaceIndex + 1
    const startResult = eatStartCondition(nodePoints, i, endIndex)
    if (startResult == null) return null

    const { condition } = startResult

    /**
     * The end tag can occur on the same line as the start tag.
     * @see https://github.github.com/gfm/#example-145
     * @see https://github.github.com/gfm/#example-146
     */
    let saturated = false
    if (condition !== 6 && condition !== 7) {
      const endResult = eatEndCondition(nodePoints, startResult.nextIndex, endIndex, condition)
      if (endResult != null) saturated = true
    }

    const nextIndex = endIndex
    const token: IToken = {
      nodeType: HtmlType,
      position: {
        start: calcStartPoint(nodePoints, startIndex),
        end: calcEndPoint(nodePoints, nextIndex - 1),
      },
      condition,
      lines: [line],
    }
    return { token, nextIndex, saturated }
  }

  function eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    const result = eatOpener(line)
    if (result == null || result.token.condition === 7) return null
    const { token, nextIndex } = result
    return {
      token,
      nextIndex,
      remainingSibling: prevSiblingToken,
      saturated: result.saturated,
    }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatContinuationText {
    const { nodePoints, endIndex, firstNonWhitespaceIndex } = line
    const nextIndex = eatEndCondition(
      nodePoints,
      firstNonWhitespaceIndex,
      endIndex,
      token.condition,
    )
    if (nextIndex === -1) return { status: 'notMatched' }

    token.lines.push(line)
    if (nextIndex != null) return { status: 'closing', nextIndex: endIndex }
    return { status: 'opening', nextIndex: endIndex }
  }

  function eatStartCondition(
    nodePoints: ReadonlyArray<INodePoint>,
    startIndex: number,
    endIndex: number,
  ): { condition: HtmlBlockConditionType; nextIndex: number } | null {
    let nextIndex: number | null = null
    if (startIndex >= endIndex) return null

    // condition 2
    nextIndex = eatStartCondition2(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 2 }

    // condition 3
    nextIndex = eatStartCondition3(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 3 }

    // condition 4
    nextIndex = eatStartCondition4(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 4 }

    // condition 5
    nextIndex = eatStartCondition5(nodePoints, startIndex, endIndex)
    if (nextIndex != null) return { nextIndex, condition: 5 }

    if (nodePoints[startIndex].codePoint !== AsciiCodePoint.SLASH) {
      const tagNameStartIndex = startIndex
      const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
      if (tagNameEndIndex == null) return null

      const tagNameInterval: INodeInterval = {
        startIndex: tagNameStartIndex,
        endIndex: tagNameEndIndex,
      }
      const rawTagName = calcStringFromNodePoints(
        nodePoints,
        tagNameInterval.startIndex,
        tagNameInterval.endIndex,
      )
      const tagName = rawTagName.toLowerCase()

      // condition1
      nextIndex = eatStartCondition1(nodePoints, tagNameInterval.endIndex, endIndex, tagName)
      if (nextIndex != null) return { nextIndex, condition: 1 }

      // condition 6
      nextIndex = eatStartCondition6(nodePoints, tagNameInterval.endIndex, endIndex, tagName)
      if (nextIndex != null) return { nextIndex, condition: 6 }

      // condition 7
      nextIndex = eatStartCondition7(nodePoints, tagNameInterval.endIndex, endIndex, tagName, true)
      if (nextIndex != null) return { nextIndex, condition: 7 }

      // fallback
      return null
    }

    const tagNameStartIndex = startIndex + 1
    const tagNameEndIndex = eatHTMLTagName(nodePoints, tagNameStartIndex, endIndex)
    if (tagNameEndIndex == null) return null

    const tagNameInterval: INodeInterval = {
      startIndex: tagNameStartIndex,
      endIndex: tagNameEndIndex,
    }
    const rawTagName = calcStringFromNodePoints(
      nodePoints,
      tagNameInterval.startIndex,
      tagNameInterval.endIndex,
    )
    const tagName = rawTagName.toLowerCase()

    // condition 6
    nextIndex = eatStartCondition6(nodePoints, tagNameInterval.endIndex, endIndex, tagName)
    if (nextIndex != null) return { nextIndex, condition: 6 }

    // condition 7.
    nextIndex = eatStartCondition7(nodePoints, tagNameInterval.endIndex, endIndex, tagName, false)
    if (nextIndex != null) return { nextIndex, condition: 7 }

    // fallback
    return null
  }

  function eatEndCondition(
    nodePoints: ReadonlyArray<INodePoint>,
    startIndex: number,
    endIndex: number,
    condition: HtmlBlockConditionType,
  ): -1 | number | null {
    switch (condition) {
      case 1: {
        const nextIndex = eatEndCondition1(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 2: {
        const nextIndex = eatEndCondition2(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 3: {
        const nextIndex = eatEndCondition3(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 4: {
        const nextIndex = eatEndCondition4(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 5: {
        const nextIndex = eatEndCondition5(nodePoints, startIndex, endIndex)
        return nextIndex == null ? null : endIndex
      }
      case 6:
      case 7: {
        const firstNonWhitespaceIndex = eatOptionalWhitespaces(nodePoints, startIndex, endIndex)
        return firstNonWhitespaceIndex >= endIndex ? -1 : null
      }
    }
  }
}
