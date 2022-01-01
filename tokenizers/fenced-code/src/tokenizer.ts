import { CodeType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type {
  IResultOfParse,
  ITokenizer,
  ITokenizerMatchBlockHook,
  ITokenizerParseBlockHook,
} from '@yozora/core-tokenizer'
import {
  TokenizerPriority,
  eatOptionalWhitespaces,
  mergeContentLinesFaithfully,
} from '@yozora/core-tokenizer'
import FencedBlockTokenizer from '@yozora/tokenizer-fenced-block'
import type { INode, IToken, ITokenizerProps, T } from './types'
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
    ITokenizer,
    ITokenizerMatchBlockHook<T, IToken>,
    ITokenizerParseBlockHook<T, IToken, INode>
{
  public override readonly isContainingBlock = false

  /* istanbul ignore next */
  constructor(props: ITokenizerProps = {}) {
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
   * @see ITokenizerParseBlockHook
   */
  public parseBlock(token: IToken): IResultOfParse<T, INode> {
    const infoString = token.infoString

    // match lang
    let i = 0
    const lang: INodePoint[] = []
    for (; i < infoString.length; ++i) {
      const p = infoString[i]
      if (isUnicodeWhitespaceCharacter(p.codePoint)) break
      lang.push(p)
    }

    // match meta
    i = eatOptionalWhitespaces(infoString, i, infoString.length)
    const contents: INodePoint[] = mergeContentLinesFaithfully(token.lines)

    /**
     * Backslash escape works in info strings in fenced code blocks.
     * @see https://github.github.com/gfm/#example-320
     */
    const node: INode = {
      type: CodeType,
      lang: calcEscapedStringFromNodePoints(lang, 0, lang.length, true),
      meta: calcEscapedStringFromNodePoints(infoString, i, infoString.length, true),
      value: calcStringFromNodePoints(contents),
    }
    return node
  }
}
