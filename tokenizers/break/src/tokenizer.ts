import { BreakType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, VirtualCodePoint } from '@yozora/character'
import type {
  IInlineTokenizer,
  IMatchInlineHookCreator,
  IParseInlineHookCreator,
  IResultOfProcessSingleDelimiter,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority, genFindDelimiter } from '@yozora/core-tokenizer'
import { BreakTokenMarkerType, uniqueName } from './types'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'

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
  extends BaseInlineTokenizer<T, IDelimiter, IToken, INode>
  implements IInlineTokenizer<T, IDelimiter, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.SOFT_INLINE,
    })
  }

  public override readonly match: IMatchInlineHookCreator<T, IDelimiter, IToken> = api => {
    return {
      findDelimiter: () => genFindDelimiter<IDelimiter>(_findDelimiter),
      processSingleDelimiter,
    }

    function _findDelimiter(startIndex: number, endIndex: number): IDelimiter | null {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
      for (let i = startIndex + 1; i < endIndex; ++i) {
        if (nodePoints[i].codePoint !== VirtualCodePoint.LINE_END) continue

        const c = nodePoints[i - 1].codePoint
        let _start: number | null = null
        let markerType: BreakTokenMarkerType | null = null
        switch (c) {
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

        return {
          type: 'full',
          markerType,
          startIndex: _start,
          endIndex: i,
        }
      }
      return null
    }

    function processSingleDelimiter(
      delimiter: IDelimiter,
    ): IResultOfProcessSingleDelimiter<T, IToken> {
      const token: IToken = {
        nodeType: BreakType,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
      }
      return [token]
    }
  }

  public override readonly parse: IParseInlineHookCreator<T, IToken, INode> = () => ({
    parse: () => ({ type: BreakType }),
  })
}
