import type {
  InlinePotentialToken,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
} from '@yozora/tokenizercore-inline'
import type {
  InlineHtml as PS,
  InlineHtmlMatchPhaseState as MS,
  InlineHtmlTokenDelimiter as TD,
  InlineHtmlType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  EnhancedYastNodePoint,
  YastMeta as M,
  calcStringFromNodePointsIgnoreEscapes,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { InlineHtmlType } from './types'
import { InlineHtmlCData, eatInlineHtmlCDataDelimiter } from './util/cdata'
import {
  InlineHtmlClosingTag,
  eatInlineHtmlClosingDelimiter,
} from './util/closing'
import {
  InlineHtmlComment,
  eatInlineHtmlCommentDelimiter,
} from './util/comment'
import {
  InlineHtmlDeclaration,
  eatInlineHtmlDeclarationDelimiter,
} from './util/declaration'
import {
  InlineHtmlInstruction,
  eatInlineHtmlInstructionDelimiter,
} from './util/instruction'
import {
  InlineHtmlOpenTag,
  eatInlineHtmlTokenOpenDelimiter,
} from './util/open'


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for InlineHtml
 */
export class InlineHtmlTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'InlineHtmlTokenizer'
  public readonly uniqueTypes: T[] = [InlineHtmlType]

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public * eatDelimiters(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfEatDelimiters<TD> {
    const delimiters: TD[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        i = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
        if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_ANGLE) continue

        const delimiter: TD | null = this.tryToEatDelimiter(nodePoints, i, endIndex)
        if (delimiter == null) continue

        delimiters.push(delimiter)
        i = delimiter.endIndex - 1
      }
    }
    return delimiters
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHoo
   */
  public eatPotentialTokens(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    delimiters: TD[]
  ): ResultOfEatPotentialTokens<T> {
    const results: PT[] = []
    for (const delimiter of delimiters) {
      switch (delimiter.type) {
        case 'open':
          const { tagName, attributes, selfClosed, startIndex, endIndex } = delimiter
          const state: MS = {
            type: InlineHtmlType,
            tagType: 'open',
            tagName,
            attributes,
            selfClosed,
          }
          results.push({ state, startIndex, endIndex })
          break
        case 'closing': {
          const { tagName, startIndex, endIndex } = delimiter
          const state: MS = {
            type: InlineHtmlType,
            tagType: 'closing',
            tagName,
          }
          results.push({ state, startIndex, endIndex })
          break
        }
        case 'declaration': {
          const { type, tagName, startIndex, endIndex, contents } = delimiter
          const state: MS = {
            type: InlineHtmlType,
            tagType: type,
            tagName,
            startIndex: contents.startIndex,
            endIndex: contents.endIndex,
          }
          results.push({ state, startIndex, endIndex })
          break
        }
        case 'comment':
        case 'instruction':
        case 'cdata': {
          const { type, startIndex, endIndex, contents } = delimiter
          const state: MS = {
            type: InlineHtmlType,
            tagType: type,
            startIndex: contents.startIndex,
            endIndex: contents.endIndex,
          }
          results.push({ state, startIndex, endIndex })
          break
        }
      }
    }
    return results
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseState: MS,
  ): PS {
    switch (matchPhaseState.tagType) {
      case 'open': {
        const { tagName, attributes, selfClosed } = matchPhaseState

        const result: InlineHtmlOpenTag = {
          type: InlineHtmlType,
          tagType: 'open',
          tagName: calcStringFromNodePointsIgnoreEscapes(
            nodePoints, tagName.startIndex, tagName.endIndex),
          attributes: attributes.map(attr => {
            const name = calcStringFromNodePointsIgnoreEscapes(
              nodePoints, attr.name.startIndex, attr.name.endIndex)
            if (attr.value == null) return { name }
            const value = calcStringFromNodePointsIgnoreEscapes(
              nodePoints, attr.value.startIndex, attr.value.endIndex)
            return { name, value }
          }),
          selfClosed,
        }
        return result
      }
      case 'closing': {
        const { tagName } = matchPhaseState
        const result: InlineHtmlClosingTag = {
          type: InlineHtmlType,
          tagType: 'closing',
          tagName: calcStringFromNodePointsIgnoreEscapes(
            nodePoints, tagName.startIndex, tagName.endIndex),
        }
        return result
      }
      case 'declaration': {
        const { tagType, tagName, startIndex, endIndex } = matchPhaseState
        const value: string = calcStringFromNodePointsIgnoreEscapes(
          nodePoints, startIndex, endIndex)
        const result: InlineHtmlDeclaration = {
          type: InlineHtmlType,
          tagName: calcStringFromNodePointsIgnoreEscapes(
            nodePoints, tagName.startIndex, tagName.endIndex),
          tagType,
          value,
        }
        return result
      }
      case 'comment':
      case 'instruction':
      case 'cdata': {
        const { tagType, startIndex, endIndex } = matchPhaseState
        const value: string = calcStringFromNodePointsIgnoreEscapes(
          nodePoints, startIndex, endIndex)
        const result:
          | InlineHtmlComment
          | InlineHtmlInstruction
          | InlineHtmlCData
          = { type: InlineHtmlType, tagType, value }
        return result
      }
    }
  }

  /**
   * Try to eat a delimiter
   *
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  protected tryToEatDelimiter(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndex: number,
    endIndex: number,
  ): TD | null {
    let delimiter: TD | null = null

    // Try open tag.
    delimiter = eatInlineHtmlTokenOpenDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try closing tag.
    delimiter = eatInlineHtmlClosingDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try html comment.
    delimiter = eatInlineHtmlCommentDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try processing instruction.
    delimiter = eatInlineHtmlInstructionDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try declaration.
    delimiter = eatInlineHtmlDeclarationDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try CDATA section.
    delimiter = eatInlineHtmlCDataDelimiter(nodePoints, startIndex, endIndex)
    return delimiter
  }
}
