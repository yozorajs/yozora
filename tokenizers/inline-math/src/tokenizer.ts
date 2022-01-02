import type { IYastNode } from '@yozora/ast'
import { InlineMathType } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints, isSpaceLike } from '@yozora/character'
import type {
  IMatchInlineHook,
  IMatchInlinePhaseApi,
  IParseInlineHook,
  IParseInlinePhaseApi,
  IResultOfFindDelimiters,
  IResultOfProcessSingleDelimiter,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalCharacters,
} from '@yozora/core-tokenizer'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for inlineMath.
 */
export class InlineMathTokenizer
  extends BaseInlineTokenizer<IDelimiter>
  implements
    ITokenizer,
    IMatchInlineHook<T, IDelimiter, IToken>,
    IParseInlineHook<T, IToken, INode>
{
  public readonly backtickRequired: boolean

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
    this.backtickRequired = props.backtickRequired ?? true
  }

  /**
   * @override
   * @see BaseInlineTokenizer
   */
  public override *findDelimiter(
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfFindDelimiters<IDelimiter> {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const blockStartIndex: number = api.getBlockStartIndex()
    const blockEndIndex: number = api.getBlockEndIndex()

    const potentialDelimiters: IYastTokenDelimiter[] = []
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
          i = eatOptionalCharacters(nodePoints, i + 1, blockEndIndex, AsciiCodePoint.BACKTICK)

          // No dollar character found after backtick string
          if (i >= blockEndIndex || nodePoints[i].codePoint !== AsciiCodePoint.DOLLAR_SIGN) {
            break
          }

          const delimiter: IYastTokenDelimiter = {
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
          i = eatOptionalCharacters(nodePoints, i + 1, blockEndIndex, AsciiCodePoint.BACKTICK)

          // A dollar sign followed by a dollar sign is not part of a valid
          // inlineMath delimiter
          if (i < blockEndIndex && nodePoints[i].codePoint === AsciiCodePoint.DOLLAR_SIGN) {
            break
          }

          const thickness: number = i - _startIndex

          // No backtick character found after dollar
          if (thickness <= 1) {
            if (this.backtickRequired) break
            const delimiter: IYastTokenDelimiter = {
              type: 'both',
              startIndex: _startIndex,
              endIndex: i,
            }
            potentialDelimiters.push(delimiter)
            break
          }

          const delimiter: IYastTokenDelimiter = {
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
    let delimiter: IDelimiter | null = null
    while (pIndex < potentialDelimiters.length) {
      const [startIndex, endIndex] = yield delimiter

      // Read from cache.
      if (lastEndIndex === endIndex) {
        if (delimiter == null || delimiter.startIndex >= startIndex) continue
      }
      lastEndIndex = endIndex

      let openerDelimiter: INodeInterval | null = null
      let closerDelimiter: INodeInterval | null = null
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        for (; pIndex < potentialDelimiters.length; ++pIndex) {
          const delimiter = potentialDelimiters[pIndex]
          if (delimiter.startIndex >= startIndex && delimiter.type !== 'closer') break
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
   * @see BaseInlineTokenizer
   */
  protected override _findDelimiter(): null {
    return null
  }

  /**
   * @override
   * @see IMatchInlineHook
   */
  public processSingleDelimiter(delimiter: IDelimiter): IResultOfProcessSingleDelimiter<T, IToken> {
    const token: IToken = {
      nodeType: InlineMathType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
      thickness: delimiter.thickness,
    }
    return [token]
  }

  /**
   * @override
   * @see IParseInlineHook
   */
  public parseInline(
    token: IToken,
    children: IYastNode[],
    api: Readonly<IParseInlinePhaseApi>,
  ): INode {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
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

    const result: INode = {
      type: InlineMathType,
      value: calcStringFromNodePoints(nodePoints, startIndex, endIndex).replace(/\n/, ' '),
    }
    return result
  }
}
