import type { RootMeta as Meta, YastNode } from '@yozora/ast'
import { InlineCodeType } from '@yozora/ast'
import type { CodePoint, NodeInterval, NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcStringFromNodePoints,
  isLineEnding,
  isSpaceCharacter,
} from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import { BaseTokenizer } from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for inlineCode.
 *
 * Syntax for images is like the syntax for links, with one difference. Instead
 * of link text, we have an image description. The rules for this are the same
 * as for link text, except that
 *
 *    (a) an image description starts with '![' rather than '[', and
 *    (b) an image description may contain links. An image description has
 *        inline elements as its contents. When an image is rendered to HTML,
 *        this is standardly used as the image’s alt attribute.
 *
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export class InlineCodeTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
    this.delimiterGroup = props.delimiterGroup ?? this.name
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public *findDelimiter(
    initialStartIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    const potentialDelimiters: YastTokenDelimiter[] = []
    for (let i = initialStartIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          if (
            i < endIndex &&
            nodePoints[i].codePoint === AsciiCodePoint.BACKTICK
          ) {
            let j = i + 1
            for (; j < endIndex; ++j) {
              if (nodePoints[j].codePoint !== AsciiCodePoint.BACKTICK) break
            }

            /**
             * Note that backslash escapes do not work in code spans.
             * All backslashes are treated literally
             * @see https://github.github.com/gfm/#example-348
             */
            potentialDelimiters.push({
              type: 'closer',
              startIndex: i,
              endIndex: j,
            })

            if (j > i + 1) {
              potentialDelimiters.push({
                type: 'opener',
                startIndex: i + 1,
                endIndex: j,
              })
            }
          }
          break
        /**
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         */
        case AsciiCodePoint.BACKTICK: {
          const _startIndex = i

          // matched as many backtick as possible
          for (; i + 1 < endIndex; ++i) {
            if (nodePoints[i + 1].codePoint !== p.codePoint) break
          }

          potentialDelimiters.push({
            type: 'both',
            startIndex: _startIndex,
            endIndex: i + 1,
          })
          break
        }
      }
    }

    let pIndex = 0,
      startIndex = initialStartIndex
    while (pIndex < potentialDelimiters.length) {
      for (; pIndex < potentialDelimiters.length; ++pIndex) {
        const delimiter = potentialDelimiters[pIndex]
        if (delimiter.startIndex >= startIndex && delimiter.type !== 'closer')
          break
      }
      if (pIndex + 1 >= potentialDelimiters.length) break

      const openerDelimiter = potentialDelimiters[pIndex]
      const thickness = openerDelimiter.endIndex - openerDelimiter.startIndex
      let closerDelimiter: NodeInterval | null = null

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
      if (closerDelimiter == null) {
        pIndex += 1
        continue
      }

      const delimiter: Delimiter = {
        type: 'full',
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        thickness,
      }
      startIndex = yield delimiter
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processFullDelimiter(fullDelimiter: Delimiter): Token | null {
    const token: Token = {
      _tokenizer: this.name,
      nodeType: InlineCodeType,
      startIndex: fullDelimiter.startIndex,
      endIndex: fullDelimiter.endIndex,
      thickness: fullDelimiter.thickness,
    }
    return token
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
      type: InlineCodeType,
      value: calcStringFromNodePoints(nodePoints, startIndex, endIndex).replace(
        /\n/g,
        ' ',
      ),
    }
    return result
  }
}

/**
 * Line endings are treated like spaces
 * @see https://github.github.com/gfm/#example-345
 * @see https://github.github.com/gfm/#example-346
 */
function isSpaceLike(c: CodePoint): boolean {
  return isSpaceCharacter(c) || isLineEnding(c)
}
