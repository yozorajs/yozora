import { isWhiteSpaceCharacter } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerEatingInfo,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import {
  ParagraphDataNode,
  ParagraphDataNodeType,
  ParagraphMatchPhaseState,
  ParagraphPreMatchPhaseState,
} from './types/paragraph'
import {
  PhrasingContentDataNode,
  PhrasingContentDataNodeType,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from './types/phrasing-content'


type T = ParagraphDataNodeType | PhrasingContentDataNodeType



/**
 * Lexical Analyzer for ParagraphDataNode
 *
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 * @see https://github.github.com/gfm/#paragraphs
 */
export class ParagraphTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPreMatchPhaseHook<
      T,
      ParagraphPreMatchPhaseState>,
    BlockTokenizerMatchPhaseHook<
      T,
      ParagraphPreMatchPhaseState,
      ParagraphMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      ParagraphMatchPhaseState,
      ParagraphDataNode | PhrasingContentDataNode>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [
    ParagraphDataNodeType,
    PhrasingContentDataNodeType
  ]

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatNewMarker(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ): { nextIndex: number, state: ParagraphPreMatchPhaseState } | null {
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo
    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    const state: ParagraphPreMatchPhaseState = {
      type: ParagraphDataNodeType,
      opening: true,
      parent: parentState,
      lines: [line],
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ParagraphPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (eatingInfo.isBlankLine) return null
    const { startIndex, endIndex, firstNonWhiteSpaceIndex } = eatingInfo

    const line: PhrasingContentLine = {
      codePositions: codePositions.slice(startIndex, endIndex),
      firstNonWhiteSpaceIndex: firstNonWhiteSpaceIndex - startIndex,
    }
    state.lines.push(line)
    return { nextIndex: endIndex, saturated: false }
  }

  /**
   * hook of @BlockTokenizerPreMatchPhaseHook
   */
  public eatLazyContinuationText(
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    state: ParagraphPreMatchPhaseState,
  ): { nextIndex: number, saturated: boolean } | null {
    return this.eatContinuationText(codePositions, eatingInfo, state)
  }

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: ParagraphPreMatchPhaseState,
  ): ParagraphMatchPhaseState {
    const phrasingContent: PhrasingContentMatchPhaseState = {
      type: PhrasingContentDataNodeType,
      classify: 'flow',
      lines: preMatchPhaseState.lines,
    }
    const result: ParagraphMatchPhaseState = {
      type: ParagraphDataNodeType,
      classify: 'flow',
      children: [phrasingContent],
    }
    return result
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ParagraphMatchPhaseState | PhrasingContentMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): ParagraphDataNode | PhrasingContentDataNode {
    const self = this
    switch (matchPhaseState.type) {
      case ParagraphDataNodeType: {
        const result: ParagraphDataNode = {
          type: ParagraphDataNodeType,
          children: children as [PhrasingContentDataNode],
        }
        return result
      }
      case PhrasingContentDataNodeType: {
        const result: PhrasingContentDataNode = {
          type: matchPhaseState.type,
          contents: [],
        }

        const contents = []
        const { lines, } = matchPhaseState as PhrasingContentMatchPhaseState
        for (let i = 0; i + 1 < lines.length; ++i) {
          const line = lines[i]
          const { firstNonWhiteSpaceIndex, codePositions } = line
          const endIndex = codePositions.length

          /**
           * Leading spaces are skipped
           * @see https://github.github.com/gfm/#example-192
           */
          for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
            contents.push(codePositions[i])
          }
        }

        /**
         * Final spaces are stripped before inline parsing, so a phrasingContent that
         * ends with two or more spaces will not end with a hard line break
         * @see https://github.github.com/gfm/#example-196
         */
        if (lines.length > 0) {
          const line = lines[lines.length - 1]
          const { firstNonWhiteSpaceIndex, codePositions } = line

          let lastNonWhiteSpaceIndex = codePositions.length - 1
          for (; lastNonWhiteSpaceIndex >= 0; --lastNonWhiteSpaceIndex) {
            const c = codePositions[lastNonWhiteSpaceIndex]
            if (!isWhiteSpaceCharacter(c.codePoint)) break
          }
          for (let i = firstNonWhiteSpaceIndex; i <= lastNonWhiteSpaceIndex; ++i) {
            contents.push(codePositions[i])
          }
        }

        if (self.parseInlineData != null) {
          const innerData = self.parseInlineData(
            contents, 0, contents.length, preParsePhaseState.meta)
          result.contents = innerData
        }
        return result
      }
    }
  }
}
