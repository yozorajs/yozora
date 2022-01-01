import type { IMatchInlinePhaseApi, IResultOfFindDelimiters } from '../types/lifecycle/match-inline'
import type { IYastTokenDelimiter } from '../types/token'
import type { ITokenizer } from '../types/tokenizer'

/**
 * Params for constructing a BaseInlineTokenizer.
 */
export interface IBaseInlineTokenizerProps {
  /**
   * ITokenizer name.
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
export abstract class BaseInlineTokenizer<IDelimiter extends IYastTokenDelimiter>
  implements ITokenizer
{
  public readonly name: string
  public readonly priority: number

  constructor(props: IBaseInlineTokenizerProps) {
    this.name = props.name
    this.priority = props.priority
  }

  /**
   * Create delimiter finder.
   *
   * @param nodePoints
   * @param api
   */
  public *findDelimiter(api: Readonly<IMatchInlinePhaseApi>): IResultOfFindDelimiters<IDelimiter> {
    let lastEndIndex = -1
    let delimiter: IDelimiter | null = null
    while (true) {
      const [startIndex, endIndex] = yield delimiter

      // Read from cache.
      if (lastEndIndex === endIndex) {
        if (delimiter == null || delimiter.startIndex >= startIndex) continue
      }
      lastEndIndex = endIndex

      delimiter = this._findDelimiter(startIndex, endIndex, api)
    }
  }

  /**
   * Find an inline token delimiter (called by `this.findDelimiter()`).
   *
   * @param api
   */
  protected abstract _findDelimiter(
    startIndex: number,
    endIndex: number,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IDelimiter | null

  /**
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}
