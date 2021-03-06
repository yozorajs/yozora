import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, VirtualCodePoint } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastMeta as Meta,
} from '@yozora/core-tokenizer'
import type {
  Break as Node,
  BreakToken as Token,
  BreakTokenDelimiter as Delimiter,
  BreakType as T,
} from './types'
import { BreakTokenMarkerType, BreakType } from './types'

/**
 * Params for constructing BreakTokenizer
 */
export interface BreakTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}

/**
 * Lexical Analyzer for a line break.
 *
 * A line break (not in a code span or HTML tag) that is preceded by two or more
 * spaces and does not occur at the end of a block is parsed as a hard line
 * break (rendered in HTML as a <br /> tag)
 * @see https://github.github.com/gfm/#hard-line-breaks
 *
 * A regular line break (not in a code span or HTML tag) that is not preceded
 * by two or more spaces or a backslash is parsed as a softbreak. (A softbreak
 * may be rendered in HTML either as a line ending or as a space. The result
 * will be the same in browsers.
 * @see https://github.github.com/gfm/#soft-line-breaks
 *
 * @see https://github.com/syntax-tree/mdast#break
 */
export class BreakTokenizer
  implements
    Tokenizer<T>,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly name: string = BreakTokenizer.name
  public readonly recognizedTypes: T[] = [BreakType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = BreakTokenizer.name
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  constructor(props: BreakTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex + 1; i < endIndex; ++i) {
      if (nodePoints[i].codePoint !== VirtualCodePoint.LINE_END) continue

      const p = nodePoints[i - 1]
      let _start: number | null = null
      let markerType: BreakTokenMarkerType | null = null
      switch (p.codePoint) {
        /**
         * For a more visible alternative, a backslash
         * before the line ending may be used instead of two spaces
         * @see https://github.github.com/gfm/#example-655
         */
        case AsciiCodePoint.BACKSLASH: {
          let x = i - 2
          for (; x >= startIndex; x -= 1) {
            if (nodePoints[x].codePoint !== AsciiCodePoint.BACKSLASH) break
          }
          if (((i - x) & 1) === 0) {
            _start = i - 1
            markerType = BreakTokenMarkerType.BACKSLASH
          }
          break
        }
        /**
         * - A line break (not in a code span or HTML tag) that is preceded
         *   by two or more spaces and does not occur at the end of a block
         *   is parsed as a hard line break (rendered in HTML as a <br /> tag)
         * - More than two spaces can be used
         * - Leading spaces at the beginning of the next line are ignored
         *
         * @see https://github.github.com/gfm/#example-654
         * @see https://github.github.com/gfm/#example-656
         * @see https://github.github.com/gfm/#example-657
         */
        case AsciiCodePoint.SPACE: {
          let x = i - 2
          for (; x >= startIndex; x -= 1) {
            if (nodePoints[x].codePoint !== AsciiCodePoint.SPACE) break
          }

          if (i - x > 2) {
            _start = x + 1
            markerType = BreakTokenMarkerType.MORE_THAN_TWO_SPACES
          }
          break
        }
      }

      if (_start == null || markerType == null) continue

      const _end = i
      const delimiter: Delimiter = {
        type: 'full',
        markerType,
        startIndex: _start,
        endIndex: _end,
      }
      return delimiter
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processFullDelimiter(
    fullDelimiter: Delimiter,
  ): ResultOfProcessFullDelimiter<T, Token> {
    const token: Token = {
      type: BreakType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
    }
    return token
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(): Node {
    const result: Node = { type: BreakType }
    return result
  }
}
