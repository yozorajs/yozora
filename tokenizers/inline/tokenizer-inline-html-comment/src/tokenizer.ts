import { AsciiCodePoint } from '@yozora/character'
import { calcStringFromCodePoints } from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseState,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  InlineHtmlCommentDataNode,
  InlineHtmlCommentDataNodeType,
  InlineHtmlCommentMatchPhaseState,
  InlineHtmlCommentPotentialToken,
  InlineHtmlCommentPreMatchPhaseState,
  InlineHtmlCommentTokenDelimiter,
} from './types'


type T = InlineHtmlCommentDataNodeType


/**
 * Lexical Analyzer for InlineHtmlCommentDataNode
 *
 * An HTML comment consists of '<!--' + text + '-->', where text does not start
 * with '>' or '->', does not end with '-', and does not contain '--'
 * @see https://github.github.com/gfm/#html-comment
 */
export class InlineHtmlCommentTokenizer extends BaseInlineTokenizer<T>
  implements
  InlineTokenizer<T>,
  InlineTokenizerPreMatchPhaseHook<
  T,
  InlineHtmlCommentPreMatchPhaseState,
  InlineHtmlCommentTokenDelimiter,
  InlineHtmlCommentPotentialToken>,
  InlineTokenizerMatchPhaseHook<
  T,
  InlineHtmlCommentPreMatchPhaseState,
  InlineHtmlCommentMatchPhaseState>,
  InlineTokenizerParsePhaseHook<
  T,
  InlineHtmlCommentMatchPhaseState,
  InlineHtmlCommentDataNode>
{

  public readonly name = 'InlineHtmlCommentTokenizer'
  public readonly uniqueTypes: T[] = [InlineHtmlCommentDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(
    rawContent: RawContent,
    startIndex: number,
    endIndex: number,
  ): Iterator<void, InlineHtmlCommentTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { codePositions } = rawContent
    const delimiters: InlineHtmlCommentTokenDelimiter[] = []

    let hasFreeOpenerDelimiter = false
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      for (let i = startIndex; i < endIndex; ++i) {
        const p = codePositions[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          // match '<!--'
          case AsciiCodePoint.OPEN_ANGLE: {
            if (i + 3 >= endIndex) break
            if (codePositions[i + 1].codePoint !== AsciiCodePoint.EXCLAMATION_MARK) break
            if (codePositions[i + 2].codePoint !== AsciiCodePoint.MINUS_SIGN) break
            if (codePositions[i + 3].codePoint !== AsciiCodePoint.MINUS_SIGN) break

            // text dose not start with '>'
            if (
              i + 4 < endIndex &&
              codePositions[i + 4].codePoint === AsciiCodePoint.CLOSE_ANGLE
            ) {
              i += 4
              break
            }

            // text dose not start with '->', and does not end with -
            if (
              i + 5 < endIndex
              && codePositions[i + 4].codePoint === AsciiCodePoint.MINUS_SIGN
              && codePositions[i + 5].codePoint === AsciiCodePoint.CLOSE_ANGLE
            ) {
              i += 5
              break
            }

            const _startIndex = i, _endIndex = i + 4
            const openerDelimiter: InlineHtmlCommentTokenDelimiter = {
              type: 'opener',
              startIndex: _startIndex,
              endIndex: _endIndex,
              thickness: _endIndex - _startIndex,
            }
            delimiters.push(openerDelimiter)

            hasFreeOpenerDelimiter = true
            i = _endIndex - 1
            break
          }
          // match '-->'
          case AsciiCodePoint.MINUS_SIGN: {
            const _startIndex = i
            for (++i; i < endIndex; i += 1) {
              if (codePositions[i].codePoint !== AsciiCodePoint.MINUS_SIGN) break
            }

            const hyphenCount = i - p.offset
            if (!hasFreeOpenerDelimiter || hyphenCount < 2) break
            hasFreeOpenerDelimiter = false

            // text does not contain '--' and does not end with -
            if (
              hyphenCount > 2 ||
              i >= endIndex ||
              codePositions[i].codePoint !== AsciiCodePoint.CLOSE_ANGLE
            ) break

            const closerDelimiter: InlineHtmlCommentTokenDelimiter = {
              type: 'closer',
              startIndex: _startIndex,
              endIndex: i + 1,
              thickness: i + 1- _startIndex,
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
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: InlineHtmlCommentTokenDelimiter[],
  ): InlineHtmlCommentPotentialToken[] {
    const potentialTokens: InlineHtmlCommentPotentialToken[] = []

    let opener: InlineHtmlCommentTokenDelimiter | null = null
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
          const potentialToken: InlineHtmlCommentPotentialToken = {
            type: InlineHtmlCommentDataNodeType,
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
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    rawContent: RawContent,
    potentialToken: InlineHtmlCommentPotentialToken,
    innerState: InlineTokenizerPreMatchPhaseState[],
  ): InlineHtmlCommentPreMatchPhaseState {
    const result: InlineHtmlCommentPreMatchPhaseState = {
      type: InlineHtmlCommentDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      openerDelimiter: potentialToken.openerDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      children: innerState,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    preMatchPhaseState: InlineHtmlCommentPreMatchPhaseState,
  ): InlineHtmlCommentMatchPhaseState | false {
    const result: InlineHtmlCommentMatchPhaseState = {
      type: InlineHtmlCommentDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
      openerDelimiter: preMatchPhaseState.openerDelimiter,
      closerDelimiter: preMatchPhaseState.closerDelimiter,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: InlineHtmlCommentMatchPhaseState,
  ): InlineHtmlCommentDataNode {
    const { startIndex, endIndex } = matchPhaseState
    const value: string = calcStringFromCodePoints(
      rawContent.codePositions, startIndex, endIndex)
    const result: InlineHtmlCommentDataNode = {
      type: InlineHtmlCommentDataNodeType,
      value,
    }
    return result
  }
}
