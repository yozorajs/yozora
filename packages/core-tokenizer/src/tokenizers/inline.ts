import type { NodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfFindDelimiters,
} from '../types/lifecycle/match-inline'
import type { YastTokenDelimiter } from '../types/token'
import type { Tokenizer } from '../types/tokenizer'

/**
 * Params for constructing a BaseInlineTokenizer.
 */
export interface BaseInlineTokenizerProps {
  /**
   * Tokenizer name.
   */
  name: string
  /**
   * Priority of the tokenizer.
   */
  priority: number
}

/**
 * Base inline tokenizer.
 */
export abstract class BaseInlineTokenizer<Delimiter extends YastTokenDelimiter>
  implements Tokenizer
{
  public readonly name: string
  public readonly priority: number

  constructor(props: BaseInlineTokenizerProps) {
    this.name = props.name
    this.priority = props.priority
  }

  /**
   * Create delimiter finder.
   *
   * @param nodePoints
   * @param api
   */
  public *findDelimiter(
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfFindDelimiters<Delimiter> {
    let lastEndIndex = -1
    let delimiter: Delimiter | null = null
    while (true) {
      const [startIndex, endIndex] = yield delimiter

      // Read from cache.
      if (lastEndIndex === endIndex) {
        if (delimiter == null || delimiter.startIndex >= startIndex) continue
      }
      lastEndIndex = endIndex

      delimiter = this._findDelimiter(startIndex, endIndex, nodePoints, api)
    }
  }

  /**
   * Find an inline token delimiter (called by `this.findDelimiter()`).
   *
   * @param nodePoints
   * @param api
   */
  protected abstract _findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): Delimiter | null

  /**
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}
