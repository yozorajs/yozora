import { CodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  ResultOfParse,
  Tokenizer,
  TokenizerMatchBlockHook,
  TokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  TokenizerPriority,
  eatOptionalWhitespaces,
  mergeContentLinesFaithfully,
} from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import type { Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Lexical Analyzer for FencedCode.
 *
 * A code fence is a sequence of at least three consecutive backtick characters
 * (`) or tildes (~). (Tildes and backticks cannot be mixed.) A fenced code
 * block begins with a code fence, indented no more than three spaces.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export class FencedCodeTokenizer
  extends FencedBlockTokenizer<T>
  implements
    Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node> {
  public override readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.FENCED_BLOCK,
      nodeType: CodeType,
      markers: [AsciiCodePoint.BACKTICK, AsciiCodePoint.TILDE],
      markersRequired: 3,
      checkInfoString: (infoString, marker): boolean => {
        /**
         * Info strings for backtick code blocks cannot contain backticks:
         * Info strings for tilde code blocks can contain backticks and tildes
         * @see https://github.github.com/gfm/#example-115
         * @see https://github.github.com/gfm/#example-116
         */
        if (marker === AsciiCodePoint.BACKTICK) {
          for (const p of infoString) {
            if (p.codePoint === AsciiCodePoint.BACKTICK) return false
          }
        }
        return true
      },
    })
  }

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(token: Token): ResultOfParse<T, Node> {
    const infoString = token.infoString

    // match lang
    let i = 0
    const lang: NodePoint[] = []
    for (; i < infoString.length; ++i) {
      const p = infoString[i]
      if (isUnicodeWhitespaceCharacter(p.codePoint)) break
      lang.push(p)
    }

    // match meta
    i = eatOptionalWhitespaces(infoString, i, infoString.length)
    const meta: NodePoint[] = infoString.slice(i)
    const contents: NodePoint[] = mergeContentLinesFaithfully(token.lines)

    /**
     * Backslash escape works in info strings in fenced code blocks.
     * @see https://github.github.com/gfm/#example-320
     */
    const node: Node = {
      type: CodeType,
      lang: calcEscapedStringFromNodePoints(lang, 0, lang.length, true),
      meta: calcEscapedStringFromNodePoints(meta, 0, meta.length, true),
      value: calcStringFromNodePoints(contents),
    }
    return node
  }
}
