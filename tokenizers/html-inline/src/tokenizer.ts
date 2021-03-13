import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import type {
  YastMeta as Meta,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastNode,
} from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import type {
  HtmlInlineTokenDelimiter as Delimiter,
  HtmlInline as Node,
  HtmlInlineType as T,
  HtmlInlineToken as Token,
} from './types'
import { HtmlInlineType } from './types'
import type { HtmlInlineCDataData } from './util/cdata'
import { eatHtmlInlineCDataDelimiter } from './util/cdata'
import type {
  HtmlInlineClosingTagData,
  HtmlInlineClosingTokenData,
} from './util/closing'
import { eatHtmlInlineClosingDelimiter } from './util/closing'
import type { HtmlInlineCommentData } from './util/comment'
import { eatHtmlInlineCommentDelimiter } from './util/comment'
import type { HtmlInlineDeclarationData } from './util/declaration'
import { eatHtmlInlineDeclarationDelimiter } from './util/declaration'
import type { HtmlInlineInstructionData } from './util/instruction'
import { eatHtmlInlineInstructionDelimiter } from './util/instruction'
import type {
  HtmlInlineOpenTagData,
  HtmlInlineOpenTokenData,
} from './util/open'
import { eatHtmlInlineTokenOpenDelimiter } from './util/open'

/**
 * Params for constructing HtmlInlineTokenizer
 */
export interface HtmlInlineTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}

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
  implements
    Tokenizer<T>,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly name: string = HtmlInlineTokenizer.name
  public readonly recognizedTypes: T[] = [HtmlInlineType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = HtmlInlineTokenizer.name
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  constructor(props: HtmlInlineTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex; i < endIndex; ++i) {
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE: {
          const delimiter: Delimiter | null = this.tryToEatDelimiter(
            nodePoints,
            i,
            endIndex,
          )
          if (delimiter != null) return delimiter
          break
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public processFullDelimiter(
    fullDelimiter: Delimiter,
  ): ResultOfProcessFullDelimiter<T, Token> {
    const token: Token = {
      ...fullDelimiter,
      type: HtmlInlineType,
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
    const { htmlType, startIndex, endIndex } = token
    const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)

    switch (htmlType) {
      case 'open': {
        const {
          tagName,
          attributes,
          selfClosed,
        } = token as HtmlInlineOpenTokenData
        /**
         * Backslash escapes do not work in HTML attributes.
         * @see https://github.github.com/gfm/#example-651
         * @see https://github.github.com/gfm/#example-652
         */
        const result: Node & HtmlInlineOpenTagData = {
          type: HtmlInlineType,
          value,
          htmlType: 'open',
          tagName: calcStringFromNodePoints(
            nodePoints,
            tagName.startIndex,
            tagName.endIndex,
          ),
          attributes: attributes.map(attr => {
            const name = calcStringFromNodePoints(
              nodePoints,
              attr.name.startIndex,
              attr.name.endIndex,
            )
            if (attr.value == null) return { name }
            const value = calcStringFromNodePoints(
              nodePoints,
              attr.value.startIndex,
              attr.value.endIndex,
            )
            return { name, value }
          }),
          selfClosed,
        }
        return result
      }
      case 'closing': {
        const { tagName } = token as HtmlInlineClosingTokenData
        const result: Node & HtmlInlineClosingTagData = {
          type: HtmlInlineType,
          value,
          htmlType,
          tagName: calcStringFromNodePoints(
            nodePoints,
            tagName.startIndex,
            tagName.endIndex,
          ),
        }
        return result
      }
      case 'comment':
      case 'declaration':
      case 'instruction':
      case 'cdata': {
        const result: Node &
          (
            | HtmlInlineCommentData
            | HtmlInlineDeclarationData
            | HtmlInlineInstructionData
            | HtmlInlineCDataData
          ) = {
          type: HtmlInlineType,
          value,
          htmlType,
        }
        return result
      }
      default:
        throw new TypeError(
          `[tokenizer-html-inline] Unexpected tag type (${
            (token as Token).htmlType
          }).`,
        )
    }
  }

  /**
   * Try to eat a delimiter
   *
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  protected tryToEatDelimiter(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
  ): Delimiter | null {
    let delimiter: Delimiter | null = null

    // Try open tag.
    delimiter = eatHtmlInlineTokenOpenDelimiter(
      nodePoints,
      startIndex,
      endIndex,
    )
    if (delimiter != null) return delimiter

    // Try closing tag.
    delimiter = eatHtmlInlineClosingDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try html comment.
    delimiter = eatHtmlInlineCommentDelimiter(nodePoints, startIndex, endIndex)
    if (delimiter != null) return delimiter

    // Try processing instruction.
    delimiter = eatHtmlInlineInstructionDelimiter(
      nodePoints,
      startIndex,
      endIndex,
    )
    if (delimiter != null) return delimiter

    // Try declaration.
    delimiter = eatHtmlInlineDeclarationDelimiter(
      nodePoints,
      startIndex,
      endIndex,
    )
    if (delimiter != null) return delimiter

    // Try CDATA section.
    delimiter = eatHtmlInlineCDataDelimiter(nodePoints, startIndex, endIndex)
    return delimiter
  }
}
