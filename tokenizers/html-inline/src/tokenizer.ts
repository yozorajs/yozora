import { HtmlType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
  IResultOfProcessSingleDelimiter,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalWhitespaces,
  genFindDelimiter,
} from '@yozora/core-tokenizer'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'
import { eatHtmlInlineCDataDelimiter } from './util/cdata'
import { eatHtmlInlineClosingDelimiter } from './util/closing'
import { eatHtmlInlineCommentDelimiter } from './util/comment'
import { eatHtmlInlineDeclarationDelimiter } from './util/declaration'
import { eatHtmlInlineInstructionDelimiter } from './util/instruction'
import { eatHtmlInlineTokenOpenDelimiter } from './util/open'

/**
 * Lexical Analyzer for HtmlInline.
 *
 * Text between '<' and '>' that looks like an HTML tag is parsed as a raw HTML
 * tag and will be rendered in HTML without escaping. Tag and attribute names
 * are not limited to current HTML tags, so custom tags (and even, say, DocBook
 * tags) may be used.
 *
 * @see https://github.github.com/gfm/#raw-html
 */
export class HtmlInlineTokenizer
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.ATOMIC,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken> = api => {
    return {
      findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
      processSingleDelimiter,
    }

    function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

      for (let i = startIndex; i < endIndex; ++i) {
        i = eatOptionalWhitespaces(nodePoints, i, endIndex)
        if (i >= endIndex) break

        const c = nodePoints[i].codePoint
        switch (c) {
          case AsciiCodePoint.BACKSLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_ANGLE: {
            const delimiter: IDelimiter | null = tryToEatDelimiter(nodePoints, i, endIndex)
            if (delimiter != null) return delimiter
            break
          }
        }
      }
      return null
    }

    function processSingleDelimiter(
      delimiter: IDelimiter,
    ): IResultOfProcessSingleDelimiter<T, IToken> {
      const token: IToken = {
        ...delimiter,
        nodeType: HtmlType,
      }
      return [token]
    }
  }

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode> = api => ({
    parse: token => {
      const { startIndex, endIndex } = token
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
      const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)
      const result: INode = { type: HtmlType, value }
      return result
    },
  })
}

/**
 * Try to eat a delimiter
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
function tryToEatDelimiter(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): IDelimiter | null {
  let delimiter: IDelimiter | null = null

  // Try open tag.
  delimiter = eatHtmlInlineTokenOpenDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try closing tag.
  delimiter = eatHtmlInlineClosingDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try html comment.
  delimiter = eatHtmlInlineCommentDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try processing instruction.
  delimiter = eatHtmlInlineInstructionDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try declaration.
  delimiter = eatHtmlInlineDeclarationDelimiter(nodePoints, startIndex, endIndex)
  if (delimiter != null) return delimiter

  // Try CDATA section.
  delimiter = eatHtmlInlineCDataDelimiter(nodePoints, startIndex, endIndex)
  return delimiter
}
