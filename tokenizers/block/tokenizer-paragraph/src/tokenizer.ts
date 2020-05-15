import {
  PhrasingContentDataNode,
  PhrasingContentDataNodeType,
  PhrasingContentTokenizerMatchPhaseState,
} from '@yozora/tokenizer-phrasing-content'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import { ParagraphDataNode, ParagraphDataNodeType } from './types'


type T = ParagraphDataNodeType


/**
 * State of match phase of ParagraphTokenizer
 */
export interface ParagraphTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   *
   */
  children: [PhrasingContentTokenizerMatchPhaseState]
}


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
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerParsePhaseHook<
      T,
      ParagraphTokenizerMatchPhaseState,
      ParagraphDataNode>
{
  public readonly name = 'ParagraphTokenizer'
  public readonly uniqueTypes: T[] = [ParagraphDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ): BlockTokenizerMatchPhaseState[] {
    const results: BlockTokenizerMatchPhaseState[] = []
    for (const matchPhaseState of matchPhaseStates) {
      if (matchPhaseState.type === PhrasingContentDataNodeType) {
        const paragraph: ParagraphTokenizerMatchPhaseState = {
          type: ParagraphDataNodeType,
          classify: 'flow',
          children: [matchPhaseState as PhrasingContentTokenizerMatchPhaseState]
        }
        results.push(paragraph)
        continue
      }
      results.push(matchPhaseState)
    }
    return results
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ParagraphTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): ParagraphDataNode {
    const result: ParagraphDataNode = {
      type: matchPhaseState.type,
      children: children as [PhrasingContentDataNode],
    }
    return result
  }
}
