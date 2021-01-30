import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
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


/**
 * Lexical Analyzer for Autolink
 */
export class AutolinkTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'AutolinkTokenizer'
  public readonly recognizedTypes: T[] = [AutolinkType]

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex; i < endIndex; ++i) {
      if (nodePoints[i].codePoint !== AsciiCodePoint.OPEN_ANGLE) continue

      const nextIndex = eatAutolinkAbsoluteURI(nodePoints, i + 1, endIndex)
      if (nextIndex == null) continue

      if (nextIndex >= endIndex) break

      if (nodePoints[nextIndex].codePoint !== AsciiCodePoint.CLOSE_ANGLE) {
        i = nextIndex - 1
        continue
      }

      const delimiter: TD = {
        type: 'full',
        startIndex: i,
        endIndex: nextIndex + 1,
        content: {
          startIndex: i + 1,
          endIndex: nextIndex,
        }
      }
      return delimiter
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHoo
   */
  public processFullDelimiter(
    fullDelimiter: TD,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessFullDelimiter<T, MS> {
    const state: MS = {
      type: AutolinkType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      content: fullDelimiter.content,
    }

    const context = this.getContext()
    if (context != null) {
      state.children = context.resolveFallbackStates(
        [],
        state.content.startIndex,
        state.content.endIndex,
        nodePoints,
        meta
      )
    }
    return state
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: MS,
    parsedChildren: YastInlineNode[] | undefined,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): PS {
    const { content } = matchPhaseState

    // Backslash-escapes do not work inside autolink.
    const url = calcStringFromNodePoints(
      nodePoints, content.startIndex, content.endIndex)

    const result: PS = {
      type: AutolinkType,
      url,
      children: parsedChildren || [],
    }
    return result
  }
}
