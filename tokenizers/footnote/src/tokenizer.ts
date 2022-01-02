import type { IYastNode } from '@yozora/ast'
import { FootnoteType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  IMatchInlineHook,
  IMatchInlinePhaseApi,
  IParseInlineHook,
  IResultOfIsDelimiterPair,
  IResultOfProcessDelimiterPair,
  ITokenizer,
  IYastInlineToken,
} from '@yozora/core-tokenizer'
import { BaseInlineTokenizer, TokenizerPriority } from '@yozora/core-tokenizer'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type { IDelimiter, INode, IToken, ITokenizerProps, T } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for inline footnote.
 *
 * An inline footnote consists of a footnote text followed immediately by a right
 * square bracket ']'.
 *
 * Like the inline links, footnote could not be contained by other footnote.
 *
 * @see https://github.com/syntax-tree/mdast-util-footnote
 * @see https://github.com/remarkjs/remark-footnotes
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#links
 * @see https://www.markdownguide.org/extended-syntax/#footnotes
 */
export class FootnoteTokenizer
  extends BaseInlineTokenizer<IDelimiter>
  implements
    ITokenizer,
    IMatchInlineHook<T, IDelimiter, IToken>,
    IParseInlineHook<T, IToken, INode>
{
  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  /**
   * @override
   * @see BaseInlineTokenizer
   */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IDelimiter | null {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

    for (let i = startIndex; i < endIndex; ++i) {
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.CARET: {
          if (i + 1 < endIndex && nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET) {
            return {
              type: 'opener',
              startIndex: i,
              endIndex: i + 2,
            }
          }
          break
        }
        case AsciiCodePoint.CLOSE_BRACKET:
          return {
            type: 'closer',
            startIndex: i,
            endIndex: i + 1,
          }
      }
    }
    return null
  }

  /**
   * @override
   * @see IMatchInlineHook
   */
  public isDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfIsDelimiterPair {
    const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()
    const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      internalTokens,
      nodePoints,
    )
    switch (balancedBracketsStatus) {
      case -1:
        return { paired: false, opener: false, closer: true }
      case 0:
        return { paired: true }
      case 1:
        return { paired: false, opener: true, closer: false }
    }
  }

  /**
   * @override
   * @see IMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter> {
    const token: IToken = {
      nodeType: FootnoteType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      children: api.resolveInternalTokens(
        internalTokens,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
      ),
    }
    return { tokens: [token] }
  }

  /**
   * @override
   * @see IParseInlineHook
   */
  public parseInline(token: IToken, children: IYastNode[]): INode {
    const result: INode = {
      type: FootnoteType,
      children,
    }
    return result
  }
}
