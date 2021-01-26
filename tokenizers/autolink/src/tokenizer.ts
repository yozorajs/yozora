import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  Autolink as PS,
  AutolinkMatchPhaseState as MS,
  AutolinkTokenDelimiter as TD,
  AutolinkType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { AutolinkType } from './types'
import { eatAutolinkAbsoluteURI } from './util/uri'


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for Autolink
 */
export class AutolinkTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'AutolinkTokenizer'
  public readonly uniqueTypes: T[] = [AutolinkType]

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
        if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_ANGLE) continue

        const nextIndex = eatAutolinkAbsoluteURI(nodePoints, i + 1, endIndex)
        if (nextIndex == null) continue

        if (nextIndex >= endIndex) break

        if (nodePoints[nextIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE) {
          i = nextIndex - 1
          continue
        }

        const openDelimiter: TD = {
          type: 'opener',
          startIndex: i,
          endIndex: i + 1,
        }
        const closerDelimiter: TD = {
          type: 'closer',
          startIndex: nextIndex,
          endIndex: endIndex + 1,
        }
        delimiters.push(openDelimiter, closerDelimiter)

        i = nextIndex
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

    let opener: TD | null = null
    for (const delimiter of delimiters) {
      switch (delimiter.type) {
        case 'opener':
          opener = delimiter
          break
        case 'closer': {
          if (opener == null) break
          const closer = delimiter
          const state: MS = {
            type: AutolinkType,
            openerDelimiter: opener,
            closerDelimiter: closer,
          }
          results.push({
            state,
            startIndex: opener.startIndex,
            endIndex: closer.endIndex,
            innerRawContents: [{
              startIndex: opener.endIndex,
              endIndex: closer.startIndex,
            }]
          })
          opener = null
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
    parsedChildren?: YastInlineNode[],
  ): PS {
    const startIndex = matchPhaseState.openerDelimiter.endIndex
    const endIndex = matchPhaseState.closerDelimiter.startIndex

    // Backslash-escapes do not work inside autolink.
    const url = calcStringFromNodePoints(nodePoints, startIndex, endIndex)

    const result: PS = {
      type: AutolinkType,
      url,
      children: parsedChildren || [],
    }
    return result
  }
}
