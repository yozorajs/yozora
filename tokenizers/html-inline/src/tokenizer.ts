import type { NodePoint } from '@yozora/character'
import type { YastMeta as M, YastNode } from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
} from '@yozora/tokenizercore-inline'
import type {
  HtmlInline as PS,
  HtmlInlineMatchPhaseState as MS,
  HtmlInlineTokenDelimiter as TD,
  HtmlInlineType as T,
} from './types'
import type { HtmlInlineCDataData } from './util/cdata'
import type {
  HtmlInlineClosingMatchPhaseStateData,
  HtmlInlineClosingTagData,
} from './util/closing'
import type { HtmlInlineCommentData } from './util/comment'
import type { HtmlInlineDeclarationData } from './util/declaration'
import type { HtmlInlineInstructionData } from './util/instruction'
import type {
  HtmlInlineOpenMatchPhaseStateData,
  HtmlInlineOpenTagData,
} from './util/open'
import { AsciiCodePoint, calcStringFromNodePoints } from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/tokenizercore'
import { HtmlInlineType } from './types'
import { eatHtmlInlineCDataDelimiter } from './util/cdata'
import { eatHtmlInlineClosingDelimiter } from './util/closing'
import { eatHtmlInlineCommentDelimiter } from './util/comment'
import { eatHtmlInlineDeclarationDelimiter } from './util/declaration'
import { eatHtmlInlineInstructionDelimiter } from './util/instruction'
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
 * Lexical Analyzer for HtmlInline
 */
export class HtmlInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'HtmlInlineTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'HtmlInlineTokenizer'
  public readonly recognizedTypes: T[] = [HtmlInlineType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: HtmlInlineTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex; i < endIndex; ++i) {
      i = eatOptionalWhitespaces(nodePoints, i, endIndex)
      const c = nodePoints[i].codePoint
      switch (c) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE: {
          const delimiter: TD | null = this.tryToEatDelimiter(nodePoints, i, endIndex)
          if (delimiter != null) return delimiter
          break
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHoo
   */
  public processFullDelimiter(
    fullDelimiter: TD,
  ): ResultOfProcessFullDelimiter<T, MS> {
    const state: MS = {
      ...fullDelimiter,
      type: HtmlInlineType,
    }
    return state
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: MS,
    parsedChildren: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
  ): PS {
    const { htmlType, startIndex, endIndex } = matchPhaseState
    const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)

    switch (htmlType) {
      case 'open': {
        const { tagName, attributes, selfClosed } =
          matchPhaseState as HtmlInlineOpenMatchPhaseStateData
        /**
         * Backslash escapes do not work in HTML attributes.
         * @see https://github.github.com/gfm/#example-651
         * @see https://github.github.com/gfm/#example-652
         */
        const result: PS & HtmlInlineOpenTagData = {
          type: HtmlInlineType,
          value,
          htmlType: 'open',
          tagName: calcStringFromNodePoints(
            nodePoints, tagName.startIndex, tagName.endIndex),
          attributes: attributes.map(attr => {
            const name = calcStringFromNodePoints(
              nodePoints, attr.name.startIndex, attr.name.endIndex)
            if (attr.value == null) return { name }
            const value = calcStringFromNodePoints(
              nodePoints, attr.value.startIndex, attr.value.endIndex)
            return { name, value }
          }),
          selfClosed,
        }
        return result
      }
      case 'closing': {
        const { tagName } = matchPhaseState as HtmlInlineClosingMatchPhaseStateData
        const result: PS & HtmlInlineClosingTagData = {
          type: HtmlInlineType,
          value,
          htmlType,
          tagName: calcStringFromNodePoints(
            nodePoints, tagName.startIndex, tagName.endIndex),
        }
        return result
      }
      case 'comment':
      case 'declaration':
      case 'instruction':
      case 'cdata': {
        const result: PS & (
          | HtmlInlineCommentData
          | HtmlInlineDeclarationData
          | HtmlInlineInstructionData
          | HtmlInlineCDataData
        )
          = {
          type: HtmlInlineType,
          value,
          htmlType,
        }
        return result
      }
      default:
        throw new TypeError(
          `[tokenizer-html-inline] Unexpected tag type (${ (matchPhaseState as MS).htmlType }).`
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
  ): TD | null {
    let delimiter: TD | null = null

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
}
