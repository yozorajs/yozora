import { ParagraphType } from '@yozora/ast'
import type {
  IMatchBlockHookCreator,
  IPhrasingContentLine,
  IResultOfEatContinuationText,
  IResultOfEatLazyContinuationText,
  IResultOfEatOpener,
} from '@yozora/core-tokenizer'
import { calcPositionFromPhrasingContentLines } from '@yozora/core-tokenizer'
import type { IHookContext, IToken, T } from './types'

/**
 * A sequence of non-blank lines that cannot be interpreted as other kinds
 * of blocks forms a paragraph. The contents of the paragraph are the result
 * of parsing the paragraph’s raw content as inlines. The paragraph’s raw
 * content is formed by concatenating the lines and removing initial and
 * final whitespace.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#paragraphs
 */
export const match: IMatchBlockHookCreator<T, IToken, IHookContext> = function () {
  return {
    isContainingBlock: false,
    eatOpener,
    eatContinuationText,
    eatLazyContinuationText,
  }

  function eatOpener(line: Readonly<IPhrasingContentLine>): IResultOfEatOpener<T, IToken> {
    const { endIndex, firstNonWhitespaceIndex } = line
    if (firstNonWhitespaceIndex >= endIndex) return null

    const lines: Array<Readonly<IPhrasingContentLine>> = [line]
    const position = calcPositionFromPhrasingContentLines(lines)
    const token: IToken = {
      nodeType: ParagraphType,
      position,
      lines,
    }
    return { token, nextIndex: endIndex }
  }

  function eatContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatContinuationText {
    const { endIndex, firstNonWhitespaceIndex } = line

    /**
     * Paragraphs can contain multiple lines, but no blank lines
     * @see https://github.github.com/gfm/#example-190
     */
    if (firstNonWhitespaceIndex >= endIndex) {
      return { status: 'notMatched' }
    }

    token.lines.push(line)
    return { status: 'opening', nextIndex: endIndex }
  }

  function eatLazyContinuationText(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
  ): IResultOfEatLazyContinuationText {
    const result = eatContinuationText(line, token)
    return result as IResultOfEatLazyContinuationText
  }
}
