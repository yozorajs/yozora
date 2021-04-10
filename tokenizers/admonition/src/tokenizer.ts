import type { YastLiteral, YastNode } from '@yozora/ast'
import { AdmonitionType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
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
    TokenizerParseBlockHook<T, Token, Node> {
  public readonly isContainerBlock = false

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      uniqueName,
      priority: props.priority,
      nodeType: AdmonitionType,
      markers: [AsciiCodePoint.COLON],
      markersRequired: 3,
    })
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(
    token: Token,
    children?: YastNode[],
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
    const title: NodePoint[] = infoString.slice(i)

    const node: Node = {
      type: AdmonitionType,
      keyword: calcEscapedStringFromNodePoints(
        keyword,
        0,
        keyword.length,
        true,
      ),
      title: [
        ({
          type: 'text',
          value: calcEscapedStringFromNodePoints(title, 0, title.length, true),
        } as unknown) as YastLiteral,
      ],

      children: children ?? [],
    }
    return node
  }
}
