import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { InlineTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the post-match phase
 */
export interface InlineTokenizerPostMatchPhaseHook {
  /**
   * Transform matchStates
   * matchPhaseStates are peers nodes that have a common parent node
   */
  transformMatch: (
    codePositions: DataNodeTokenPointDetail[],
    matchPhaseStates: Readonly<InlineTokenizerMatchPhaseState[]>,
  ) => InlineTokenizerMatchPhaseState[]
}
