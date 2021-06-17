import type { YastNode } from '@yozora/ast'
import { InlineMathType } from '@yozora/ast'
import type { NodeInterval, NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  isSpaceLike,
} from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfFindDelimiters,
  ResultOfProcessSingleDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  TokenizerPriority,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for inlineMath.
 */
export class InlineMathTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node>
{
  public readonly backtickRequired: boolean

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
    this.backtickRequired = props.backtickRequired ?? true
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public *findDelimiter(
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfFindDelimiters<Delimiter> {
    const blockStartIndex: number = api.getBlockStartIndex()
    const blockEndIndex: number = api.getBlockEndIndex()

    const potentialDelimiters: YastTokenDelimiter[] = []
    for (let i = blockStartIndex; i < blockEndIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          /**
           * Note that unlink code spans, backslash escapes works in inline-math.
           * @see https://github.github.com/gfm/#example-348
           */
          i += 1
          break
        /**
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         *
         * the left flanking string pattern is: <BACKTICK STRING><DOLLAR_SIGN>.
         * eg: `$, ``$
         *
         * A backtick string is a string of one or more backtick
         * characters '`' that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.BACKTICK: {
          const _startIndex = i

          // matched as many backtick as possible
          i = eatOptionalCharacters(
            nodePoints,
            i + 1,
            blockEndIndex,
            AsciiCodePoint.BACKTICK,
          )

          // No dollar character found after backtick string
          if (
            i >= blockEndIndex ||
            nodePoints[i].codePoint !== AsciiCodePoint.DOLLAR_SIGN
          ) {
            break
          }

          const delimiter: YastTokenDelimiter = {
            type: 'opener',
            startIndex: _startIndex,
            endIndex: i + 1,
          }
          potentialDelimiters.push(delimiter)
          break
        }
        /**
         * the right flanking string pattern is: <DOLLAR_SIGN><BACKTICK STRING>.
         * eg: $`, $``
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.DOLLAR_SIGN: {
          // matched as many backtick as possible
          const _startIndex = i
          i = eatOptionalCharacters(
            nodePoints,
            i + 1,
            blockEndIndex,
            AsciiCodePoint.BACKTICK,
          )

          // A dollar sign followed by a dollar sign is not part of a valid
          // inlineMath delimiter
          if (
            i < blockEndIndex &&
            nodePoints[i].codePoint === AsciiCodePoint.DOLLAR_SIGN
          ) {
            break
          }

          const thickness: number = i - _startIndex

          // No backtick character found after dollar
          if (thickness <= 1) {
            if (this.backtickRequired) break
            const delimiter: YastTokenDelimiter = {
              type: 'both',
              startIndex: _startIndex,
              endIndex: i,
            }
            potentialDelimiters.push(delimiter)
            break
          }

          const delimiter: YastTokenDelimiter = {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: i,
          }
          potentialDelimiters.push(delimiter)
          i -= 1
          break
        }
      }
    }

    let pIndex = 0
    let lastEndIndex = -1
    let delimiter: Delimiter | null = null
    while (pIndex < potentialDelimiters.length) {
      const [startIndex, endIndex] = yield delimiter

      // Read from cache.
      if (lastEndIndex === endIndex) {
        if (delimiter == null || delimiter.startIndex >= startIndex) continue
      }
      lastEndIndex = endIndex

      let openerDelimiter: NodeInterval | null = null
      let closerDelimiter: NodeInterval | null = null
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        for (; pIndex < potentialDelimiters.length; ++pIndex) {
          const delimiter = potentialDelimiters[pIndex]
          if (delimiter.startIndex >= startIndex && delimiter.type !== 'closer')
            break
        }
        if (pIndex + 1 >= potentialDelimiters.length) break

        openerDelimiter = potentialDelimiters[pIndex]
        const thickness = openerDelimiter.endIndex - openerDelimiter.startIndex
        for (let i = pIndex + 1; i < potentialDelimiters.length; ++i) {
          const delimiter = potentialDelimiters[i]
          if (
            delimiter.type !== 'opener' &&
            delimiter.endIndex - delimiter.startIndex === thickness
          ) {
            closerDelimiter = delimiter
            break
          }
        }

        // No matched inlineCode closer marker found, try next one.
        if (closerDelimiter != null) break
      }

      if (closerDelimiter == null) return

      delimiter = {
        type: 'full',
        startIndex: openerDelimiter!.startIndex,
        endIndex: closerDelimiter.endIndex,
        thickness: closerDelimiter.endIndex - closerDelimiter.startIndex,
      }
    }
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processSingleDelimiter(
    delimiter: Delimiter,
  ): ResultOfProcessSingleDelimiter<T, Token> {
    const token: Token = {
      nodeType: InlineMathType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      thickness: delimiter.thickness,
    }
    return [token]
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
  ): Node {
    let startIndex: number = token.startIndex + token.thickness
    let endIndex: number = token.endIndex - token.thickness

    let isAllSpace = true
    for (let i = startIndex; i < endIndex; ++i) {
      if (isSpaceLike(nodePoints[i].codePoint)) continue
      isAllSpace = false
      break
    }

    /**
     * If the resulting string both begins and ends with a space character,
     * but doesn't consist entirely of space characters, a single space
     * character is removed from the front and back. This allows you to
     * include code that begins or endsWith backtick characters, which must
     * be separated by whitespace from theopening or closing backtick strings.
     * @see https://github.github.com/gfm/#example-340
     *
     * Only spaces, and not unicode whitespace in general, are stripped
     * in this way
     * @see https://github.github.com/gfm/#example-343
     *
     * No stripping occurs if the code span contains only spaces
     * @see https://github.github.com/gfm/#example-344
     */
    if (!isAllSpace && startIndex + 2 < endIndex) {
      const firstCharacter = nodePoints[startIndex].codePoint
      const lastCharacter = nodePoints[endIndex - 1].codePoint
      if (isSpaceLike(firstCharacter) && isSpaceLike(lastCharacter)) {
        startIndex += 1
        endIndex -= 1
      }
    }

    const result: Node = {
      type: InlineMathType,
      value: calcStringFromNodePoints(nodePoints, startIndex, endIndex).replace(
        /\n/,
        ' ',
      ),
    }
    return result
  }
}
