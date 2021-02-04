import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfProcessFullDelimiter,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  HtmlInline as PS,
  HtmlInlineMatchPhaseState as MS,
  HtmlInlineTokenDelimiter as TD,
  HtmlInlineType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  EnhancedYastNodePoint,
  YastMeta as M,
  calcStringFromNodePointsIgnoreEscapes,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import { HtmlInlineType } from './types'
import { HtmlInlineCData, eatHtmlInlineCDataDelimiter } from './util/cdata'
import {
  HtmlInlineClosingTag,
  eatHtmlInlineClosingDelimiter,
} from './util/closing'
import {
  HtmlInlineComment,
  eatHtmlInlineCommentDelimiter,
} from './util/comment'
import {
  HtmlInlineDeclaration,
  eatHtmlInlineDeclarationDelimiter,
} from './util/declaration'
import {
  HtmlInlineInstruction,
  eatHtmlInlineInstructionDelimiter,
} from './util/instruction'
import {
  HtmlInlineOpenTag,
  eatHtmlInlineTokenOpenDelimiter,
} from './util/open'


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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex; i < endIndex; ++i) {
      i = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
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
    parsedChildren: YastInlineNode[] | undefined,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): PS {
    switch (matchPhaseState.tagType) {
      case 'open': {
        const { tagName, attributes, selfClosed } = matchPhaseState
        const result: HtmlInlineOpenTag = {
          type: HtmlInlineType,
          tagType: 'open',
          tagName: calcStringFromNodePointsIgnoreEscapes(
            nodePoints, tagName.startIndex, tagName.endIndex),
          attributes: attributes.map(attr => {
            const name = calcStringFromNodePointsIgnoreEscapes(
              nodePoints, attr.name.startIndex, attr.name.endIndex)
            if (attr.value == null) return { name }
            const value = calcStringFromNodePointsIgnoreEscapes(
              nodePoints, attr.value.startIndex, attr.value.endIndex)
            return { name, value }
          }),
          selfClosed,
        }
        return result
      }
      case 'closing': {
        const { tagName } = matchPhaseState
        const result: HtmlInlineClosingTag = {
          type: HtmlInlineType,
          tagType: 'closing',
          tagName: calcStringFromNodePointsIgnoreEscapes(
            nodePoints, tagName.startIndex, tagName.endIndex),
        }
        return result
      }
      case 'declaration': {
        const { tagType, tagName, content: contents } = matchPhaseState
        const value: string = calcStringFromNodePointsIgnoreEscapes(
          nodePoints, contents.startIndex, contents.endIndex)
        const result: HtmlInlineDeclaration = {
          type: HtmlInlineType,
          tagName: calcStringFromNodePointsIgnoreEscapes(
            nodePoints, tagName.startIndex, tagName.endIndex),
          tagType,
          value,
        }
        return result
      }
      case 'comment':
      case 'instruction':
      case 'cdata': {
        const { tagType, content: contents } = matchPhaseState
        const value: string = calcStringFromNodePointsIgnoreEscapes(
          nodePoints, contents.startIndex, contents.endIndex)
        const result:
          | HtmlInlineComment
          | HtmlInlineInstruction
          | HtmlInlineCData
          = { type: HtmlInlineType, tagType, value }
        return result
      }
      default:
        throw new TypeError(
          `[tokenizer-html-inline] Unexpected tag type (${ (matchPhaseState as MS).tagType }).`
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
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
