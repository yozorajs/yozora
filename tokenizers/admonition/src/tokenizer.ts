import type { YastNode } from '@yozora/ast'
import { AdmonitionType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  MatchBlockPhaseApi,
  ParseBlockPhaseApi,
  PhrasingContentLine,
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  TokenizerPriority,
  eatOptionalWhitespaces,
} from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for Admonition.
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code
 * block begins with a code fence, indented no more than three spaces.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export class AdmonitionTokenizer
  extends FencedBlockTokenizer<T>
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node>
{
  public override readonly isContainingBlock = true

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: AdmonitionType,
      markers: [AsciiCodePoint.COLON],
      markersRequired: 3,
    })
  }

  /**
   * Resolve children.
   * @override
   * @see TokenizerMatchBlockHook
   */
  public onClose(token: Token, api: MatchBlockPhaseApi): void {
    const children = api.rollbackPhrasingLines(token.lines)
    // eslint-disable-next-line no-param-reassign
    token.children = children
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(
    token: Token,
    children: YastNode[],
    api: Readonly<ParseBlockPhaseApi>,
  ): ResultOfParse<T, Node> {
    const infoString = token.infoString

    // Match an admonition keyword.
    let i = 0
    const keyword: NodePoint[] = []
    for (; i < infoString.length; ++i) {
      const p = infoString[i]
      if (isUnicodeWhitespaceCharacter(p.codePoint)) break
      keyword.push(p)
    }

    i = eatOptionalWhitespaces(infoString, i, infoString.length)
    const title: YastNode[] = ((): YastNode[] => {
      if (i >= infoString.length) return []
      const titleLines: PhrasingContentLine[] = [
        {
          nodePoints: infoString,
          startIndex: i,
          endIndex: infoString.length,
          firstNonWhitespaceIndex: i,
          countOfPrecedeSpaces: 0,
        },
      ]
      const phrasingContent = api.buildPhrasingContent(titleLines)
      if (phrasingContent == null) return []
      return api.parsePhrasingContent(phrasingContent)
    })()

    const node: Node = {
      type: AdmonitionType,
      keyword: calcEscapedStringFromNodePoints(
        keyword,
        0,
        keyword.length,
        true,
      ),
      title,
      children,
    }
    return node
  }
}
