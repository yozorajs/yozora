import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type { ContentFragment, InlineDataNodeType, RawContent } from '../base'


/**
 * Params of eatDelimiters.next
 */
export interface NextParamsOfEatDelimiters extends ContentFragment {
  /**
   * precedingCodePosition is the preceding character info of the
   * codePositions[startIndex] (skipped internal atomic tokens).
   * `null` means no such character
   */
  precedingCodePosition: DataNodeTokenPointDetail | null
  /**
   * followingCodePosition is the following character info of the
   * codePositions[endIndex-1] (skipped internal atomic tokens).
   * `null` means no such character
   */
  followingCodePosition: DataNodeTokenPointDetail | null
}


/**
 *
 */
export interface InlineTokenDelimiter<
  T extends string = 'opener' | 'closer' | 'both'
  > extends ContentFragment {
  /**
   * Type of Delimiter
   */
  type: T
  /**
   * Thickness of this Delimiter
   */
  thickness: number
}


/**
 *
 */
export interface InlinePotentialToken<
  T extends InlineDataNodeType = InlineDataNodeType,
  D extends InlineTokenDelimiter<string> = InlineTokenDelimiter,
  > extends ContentFragment {
  /**
   * Type of token
   */
  type: T
  /**
   * Start/Left Delimiter of token
   */
  openerDelimiter?: D
  /**
   * End/Right Delimiter of token
   */
  closerDelimiter?: D
  /**
   * Expose the internal list of raw content fragments that need further
   * processing, the list will be handed over to the context for recursive
   * analysis to get the internal tokens of the current inline token.
   *
   * These content fragments will be processed before assemblePreMatchState.
   */
  innerRawContents?: ContentFragment[]
}


/**
 * State of match phase
 */
export interface InlineTokenizerMatchPhaseState<
  T extends InlineDataNodeType = InlineDataNodeType,
  > {
  /**
   * Type of match phase state
   */
  type: T
  /**
   * Start index of state in codePositions
   */
  startIndex: number
  /**
   * End index of state in codePositions
   */
  endIndex: number
  /**
   *
   */
  children?: InlineTokenizerMatchPhaseState[]
}


/**
 * State-tree of match phase
 */
export interface InlineTokenizerMatchPhaseStateTree extends InlineTokenizerMatchPhaseState<'root'> {
  /**
   * Root type of match phase state-tree
   */
  type: 'root'
  /**
   *
   */
  children: InlineTokenizerMatchPhaseState[]
}


/**
 * Hooks in the match phase
 */
export interface InlineTokenizerMatchPhaseHook<
  T extends InlineDataNodeType = InlineDataNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  TD extends InlineTokenDelimiter<string> = InlineTokenDelimiter,
  PT extends InlinePotentialToken<T, InlineTokenDelimiter<string>> = InlinePotentialToken<T, TD>
  > {
  /**
   * This method will be called many times when processing codePositions
   * of one leaf block node. This is because the content seen by the current
   * tokenizer may be multiple content segments generated by splitting the
   * original content when the tokenizer with higher priority is processed.
   * These fragments will be passed to eatDelimiter for processing in turn.
   *
   * # Params
   *
   * - [blockStartIndex, blockEndIndex) is a half-closed interval that specifies
   *   the range of available positions for codePositions of current data block
   *
   * @returns An array of DelimiterItem matched during the generator lifetime
   *          when processing the content of a leaf block node
   */
  eatDelimiters: (
    rawContent: RawContent,
    blockStartIndex: number,
    blockEndIndex: number,
  ) => Iterator<void, TD[], NextParamsOfEatDelimiters | null>

  /**
   * Process the delimiter stack.
   *
   * # Params
   *
   * - delimiters are DelimiterItems collected in the multiple eatDelimiters
   *   executed while processing a leaf block node
   */
  eatPotentialTokens: (
    rawContent: RawContent,
    delimiters: TD[],
  ) => PT[]

  /**
   *
   * Format/Remove the given preMatchState
   *
   * @return
   *  - {MS}: format preMatchState to the returned matchState
   *  - {null}: ignore this preMatchState
   */
  match: (
    rawContent: RawContent,
    token: PT,
    innerState: InlineTokenizerMatchPhaseState[],
  ) => MS | null
}