import type { IResultOfFindDelimiters } from '../types/match-inline/hook'
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
   * Returns a string representing the tokenizer.
   * @override
   */
  public toString(): string {
    return this.name
  }
}

export function* genFindDelimiter<IDelimiter extends IYastTokenDelimiter>(
  _findDelimiter: (startIndex: number, endIndex: number) => IDelimiter | null,
): IResultOfFindDelimiters<IDelimiter> {
  let lastEndIndex = -1
  let delimiter: IDelimiter | null = null
  while (true) {
    const [startIndex, endIndex] = yield delimiter

    // Read from cache.
    if (lastEndIndex === endIndex) {
      if (delimiter == null || delimiter.startIndex >= startIndex) continue
    }
    lastEndIndex = endIndex

    delimiter = _findDelimiter(startIndex, endIndex)
  }
}
