import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  NextParamsOfEatDelimiters,
} from '@yozora/tokenizercore-inline'
import type {
  InlineHtmlComment as PS,
  InlineHtmlCommentMatchPhaseState as MS,
  InlineHtmlCommentPotentialToken as PT,
  InlineHtmlCommentTokenDelimiter as TD,
  InlineHtmlCommentType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { InlineHtmlCommentType } from './types'


/**
 * Lexical Analyzer for PS
 *
 * An HTML comment consists of '<!--' + text + '-->', where text does not start
 * with '>' or '->', does not end with '-', and does not contain '--'
 * @see https://github.github.com/gfm/#html-comment
 */
export class InlineHtmlCommentTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD, PT>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{

  public readonly name = 'InlineHtmlCommentTokenizer'
  public readonly uniqueTypes: T[] = [InlineHtmlCommentType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public * eatDelimiters(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): Iterator<void, TD[], NextParamsOfEatDelimiters | null> {
    const delimiters: TD[] = []

    let hasFreeOpenerDelimiter = false
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          // match '<!--'
          case AsciiCodePoint.OPEN_ANGLE: {
            if (i + 3 >= endIndex) break
            if (nodePoints[i + 1].codePoint !== AsciiCodePoint.EXCLAMATION_MARK) break
            if (nodePoints[i + 2].codePoint !== AsciiCodePoint.MINUS_SIGN) break
            if (nodePoints[i + 3].codePoint !== AsciiCodePoint.MINUS_SIGN) break

            // text dose not start with '>'
            if (
              i + 4 < endIndex &&
              nodePoints[i + 4].codePoint === AsciiCodePoint.CLOSE_ANGLE
            ) {
              i += 4
              break
            }

            // text dose not start with '->', and does not end with -
            if (
              i + 5 < endIndex
              && nodePoints[i + 4].codePoint === AsciiCodePoint.MINUS_SIGN
              && nodePoints[i + 5].codePoint === AsciiCodePoint.CLOSE_ANGLE
            ) {
              i += 5
              break
            }

            const _startIndex = i, _endIndex = i + 4
            const openerDelimiter: TD = {
              type: 'opener',
              startIndex: _startIndex,
              endIndex: _endIndex,
            }
            delimiters.push(openerDelimiter)

            hasFreeOpenerDelimiter = true
            i = _endIndex - 1
            break
          }
          // match '-->'
          case AsciiCodePoint.MINUS_SIGN: {
            const _startIndex = i
            for (i += 1; i < endIndex; i += 1) {
              if (nodePoints[i].codePoint !== AsciiCodePoint.MINUS_SIGN) break
            }

            const hyphenCount = i - _startIndex
            if (!hasFreeOpenerDelimiter || hyphenCount < 2) break
            hasFreeOpenerDelimiter = false

            // text does not contain '--' and does not end with -
            if (
              hyphenCount > 2 ||
              i >= endIndex ||
              nodePoints[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
            ) break

            const closerDelimiter: TD = {
              type: 'closer',
              startIndex: _startIndex,
              endIndex: i + 1,
            }
            delimiters.push(closerDelimiter)
            break
          }
        }
      }
    }
    return delimiters
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public eatPotentialTokens(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    delimiters: TD[],
  ): PT[] {
    const potentialTokens: PT[] = []

    let opener: TD | null = null
    for (const delimiter of delimiters) {
      switch (delimiter.type) {
        case 'opener':
          if (opener == null) {
            opener = delimiter
          }
          break
        case 'both':
          if (opener == null) {
            opener = delimiter
            break
          }
        case 'closer': {
          if (opener == null) break
          const closer = delimiter
          const potentialToken: PT = {
            type: InlineHtmlCommentType,
            startIndex: opener.startIndex,
            endIndex: closer.endIndex,
            openerDelimiter: opener,
            closerDelimiter: closer,
            innerRawContents: [{
              startIndex: opener.endIndex,
              endIndex: closer.startIndex,
            }]
          }
          potentialTokens.push(potentialToken)
          opener = null
          break
        }
      }
    }
    return potentialTokens
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public match(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    potentialToken: PT,
    innerStates: InlineTokenizerMatchPhaseState[],
  ): MS | null {
    const result: MS = {
      type: InlineHtmlCommentType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      openerDelimiter: potentialToken.openerDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      children: innerStates,
    }
    return result
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
    const { startIndex, endIndex } = matchPhaseState
    const value: string = calcStringFromNodePoints(nodePoints, startIndex, endIndex)
    const result: PS = {
      type: InlineHtmlCommentType,
      value,
    }
    return result
  }
}
