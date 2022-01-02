import { ThematicBreakType } from '@yozora/ast'
import { AsciiCodePoint, isUnicodeWhitespaceCharacter } from '@yozora/character'
import type {
  IMatchBlockHook,
  IParseBlockHook,
  IPhrasingContentLine,
  IResultOfEatAndInterruptPreviousSibling,
  IResultOfEatOpener,
  IResultOfParse,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'
import {
  BaseBlockTokenizer,
  TokenizerPriority,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import type { INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for ThematicBreak.
 *
 * A line consisting of 0-3 spaces of indentation, followed by a sequence of
 * three or more matching -, _, or * characters, each followed optionally by
 * any number of spaces or tabs, forms a thematic break.
 *
 * @see https://github.github.com/gfm/#thematic-break
 */
export class ThematicBreakTokenizer
  extends BaseBlockTokenizer
  implements ITokenizer, IMatchBlockHook<T, IToken>, IParseBlockHook<T, IToken, INode>
{
  public readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    /**
     * Four spaces is too much
     * @see https://github.github.com/gfm/#example-19
     */
    if (line.countOfPrecedeSpaces >= 4) return null

    const { nodePoints, startIndex, endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex + 2 >= endIndex) return null

    let marker: number
    let count = 0
    let continuous = true
    let hasPotentialInternalSpace = false
    for (let i = firstNonWhitespaceIndex; i < endIndex; ++i) {
      const c = nodePoints[i]

      /**
       * Spaces are allowed between the characters
       * Spaces are allowed at the end
       * @see https://github.github.com/gfm/#example-21
       * @see https://github.github.com/gfm/#example-22
       * @see https://github.github.com/gfm/#example-23
       * @see https://github.github.com/gfm/#example-24
       */
      if (isUnicodeWhitespaceCharacter(c.codePoint)) {
        hasPotentialInternalSpace = true
        continue
      }

      /**
       * As it is traversed from a non-empty character, if a blank character
       * has been encountered before, it means that there is an internal space
       */
      if (hasPotentialInternalSpace) {
        continuous = false
      }

      switch (c.codePoint) {
        /**
         * A line consisting of 0-3 spaces of indentation, followed by a
         * sequence of three or more matching '-', '_', or '*' characters,
         * each followed optionally by any number of spaces or tabs, forms
         * a thematic break
         */
        case AsciiCodePoint.MINUS_SIGN:
        case AsciiCodePoint.UNDERSCORE:
        case AsciiCodePoint.ASTERISK: {
          if (count <= 0) {
            marker = c.codePoint
            count += 1
            break
          }
          /**
           * It is required that all of the non-whitespace characters be the same
           * @see https://github.github.com/gfm/#example-26
           */
          if (c.codePoint !== marker!) return null
          count += 1
          break
        }
        /**
         * No other characters may occur in the line
         * @see https://github.github.com/gfm/#example-25
         */
        default:
          return null
      }
    }

    /**
     * Not enough characters
     * @see https://github.github.com/gfm/#example-16
     */
    if (count < 3) return null

    const token: IToken = {
      nodeType: ThematicBreakType,
      position: {
        start: calcStartYastNodePoint(nodePoints, startIndex),
        end: calcEndYastNodePoint(nodePoints, endIndex - 1),
      },
      marker: marker!,
      continuous,
    }
    return { token, nextIndex: endIndex, saturated: true }
  }

  /**
   * @override
   * @see IMatchBlockHook
   */
  public eatAndInterruptPreviousSibling(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken> {
    const result = this.eatOpener(line)
    if (result == null) return null
    return {
      token: result.token,
      nextIndex: result.nextIndex,
      remainingSibling: prevSiblingToken,
    }
  }

  /**
   * @override
   * @see IParseBlockHook
   */
  public parseBlock(): IResultOfParse<T, INode> {
    const node: INode = { type: ThematicBreakType }
    return node
  }
}
