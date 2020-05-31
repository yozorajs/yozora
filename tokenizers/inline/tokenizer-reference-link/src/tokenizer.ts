import { AsciiCodePoint } from '@yozora/character'
import {
  calcStringFromCodePointsIgnoreEscapes,
  normalizeLinkLabel,
  eatOptionalWhiteSpaces,
  eatLinkLabel,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseState,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  ReferenceLinkDataNode,
  ReferenceLinkDataNodeType,
  ReferenceLinkMatchPhaseState,
  ReferenceLinkPotentialToken,
  ReferenceLinkPreMatchPhaseState,
  ReferenceLinkTokenDelimiter,
} from './types'


type T = ReferenceLinkDataNodeType


/**
 * Lexical Analyzer for ReferenceLinkDataNode
 *
 * There are three kinds of reference links:
 *  - full: A full reference link consists of a link text immediately followed by a link label
 *    that matches a link reference definition elsewhere in the document.
 *
 *    A link label begins with a left bracket '[' and ends with the first right bracket ']' that
 *    is not backslash-escaped. Between these brackets there must be at least one non-whitespace
 *    character. Unescaped square bracket characters are not allowed inside the opening and
 *    closing square brackets of link labels. A link label can have at most 999 characters
 *    inside the square brackets.
 *
 *    One label matches another just in case their normalized forms are equal. To normalize
 *    a label, strip off the opening and closing brackets, perform the Unicode case fold, strip
 *    leading and trailing whitespace and collapse consecutive internal whitespace to a single
 *    space. If there are multiple matching reference link definitions, the one that comes first
 *    in the document is used. (It is desirable in such cases to emit a warning.)
 *
 *  - collapsed: A collapsed reference link consists of a link label that matches a link
 *    reference definition elsewhere in the document, followed by the string '[]'. The contents
 *    of the first link label are parsed as inlines, which are used as the link’s text.
 *    The link’s URI and title are provided by the matching reference link definition.
 *    Thus, '[foo][]' is equivalent to '[foo][foo]'.
 *
 *  - shortcut (not support): A shortcut reference link consists of a link label that matches
 *    a link reference definition elsewhere in the document and is not followed by '[]' or a
 *    link label. The contents of the first link label are parsed as inlines, which are used
 *    as the link’s text. The link’s URI and title are provided by the matching link
 *    reference definition. Thus, '[foo]' is equivalent to '[foo][]'.
 *
 * @see https://github.github.com/gfm/#reference-link
 */
export class ReferenceLinkTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerPreMatchPhaseHook<
      T,
      ReferenceLinkPreMatchPhaseState,
      ReferenceLinkTokenDelimiter,
      ReferenceLinkPotentialToken>,
    InlineTokenizerMatchPhaseHook<
      T,
      ReferenceLinkPreMatchPhaseState,
      ReferenceLinkMatchPhaseState>,
    InlineTokenizerParsePhaseHook<
      T,
      ReferenceLinkMatchPhaseState,
      ReferenceLinkDataNode>
{
  public readonly name = 'ReferenceLinkTokenizer'
  public readonly uniqueTypes: T[] = [ReferenceLinkDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatDelimiters(
    rawContent: RawContent,
    startIndex: number,
    endIndex: number,
    delimiters: ReferenceLinkTokenDelimiter[],
  ): void {
    const { codePositions, meta } = rawContent

    // meta.LINK_DEFINITION is needed
    const referenceMap = meta.LINK_DEFINITION
    if (referenceMap == null) return

    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePositions[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          i += 1
          break
        /**
         * A link text consists of a sequence of zero or more inline elements
         * enclosed by square brackets ([ and ])
         * @see https://github.github.com/gfm/#link-text
         */
        case AsciiCodePoint.OPEN_BRACKET: {
          const openerDelimiter: ReferenceLinkTokenDelimiter = {
            type: 'opener',
            startIndex: i,
            endIndex: i + 1,
            thickness: 1,
          }
          delimiters.push(openerDelimiter)
          break
        }
                /**
         * An inline link consists of a link text followed immediately by a
         * left parenthesis '(', ..., and a right parenthesis ')'
         * @see https://github.github.com/gfm/#inline-link
         */
        case AsciiCodePoint.CLOSE_BRACKET: {
          /**
           * Cause links may not contain other links, at any level of nesting,
           * so middleDelimiter must be adjacent to LeftDelimiter
           *
           * @see https://github.github.com/gfm/#example-526
           * @see https://github.github.com/gfm/#example-527
           */
          if (
            delimiters.length <= 0 ||
            delimiters[delimiters.length - 1].type !== 'opener'
          ) break

          /**
           * The link text may contain balanced brackets, but not unbalanced
           * ones, unless they are escaped.
           *
           * So no matter whether the current delimiter is a legal
           * closerDelimiter, it needs to consume a open bracket.
           * @see https://github.github.com/gfm/#example-520
           */
          const openerDelimiter = delimiters.pop()!

          /**
           * Cause link destination and link title cannot contain other tokens,
           * therefore, the closerDelimiter must appear in the current iteration
           */
          if (
            i + 1 >= endIndex ||
            codePositions[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET
          ) break

          // try to match link label
          const labelStartIndex = eatOptionalWhiteSpaces(
            codePositions, i + 1, endIndex)
          const labelEndIndex = eatLinkLabel(
            codePositions, labelStartIndex, endIndex)
          if (labelEndIndex < 0) break

          const labelContents = (labelStartIndex + 1 < labelEndIndex - 1)
            ? { startIndex: labelStartIndex + 1, endIndex: labelEndIndex - 1 }
            : undefined

          // calc label
          if (labelContents != null) {
            const { startIndex, endIndex } = labelContents
            const label = calcStringFromCodePointsIgnoreEscapes(
              codePositions, startIndex, endIndex)
            const identifier = normalizeLinkLabel(label)

            // No reference found
            if (referenceMap[identifier] == null) break
          }

          const _startIndex = i
          const _endIndex = labelEndIndex
          if (
            _endIndex > endIndex ||
            codePositions[_endIndex - 1].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
          ) break

          /**
           * Both the title and the destination may be omitted
           * @see https://github.github.com/gfm/#example-495
           */
          const closerDelimiter: ReferenceLinkTokenDelimiter = {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: _endIndex,
            thickness: _endIndex - _startIndex,
            labelContents,
          }

          /**
           * If the current delimiter is a legal closerDelimiter, we need to
           * push the openerDelimiter that was previously popped back onto the
           * delimiter stack
           */
          delimiters.push(openerDelimiter)
          delimiters.push(closerDelimiter)

          i = _endIndex - 1
        }
      }
    }
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: ReferenceLinkTokenDelimiter[],
  ): ReferenceLinkPotentialToken[] {
    const potentialTokens: ReferenceLinkPotentialToken[] = []

    /**
     * Links can not contains Links, so we can always only use the latest
     * opener Delimiter to pair with the current closer Delimiter
     */
    let openerDelimiter: ReferenceLinkTokenDelimiter | null = null
    for (let i = 0; i < delimiters.length; ++i) {
      const delimiter = delimiters[i]

      if (delimiter.type === 'opener') {
        openerDelimiter = delimiter
        continue
      }

      if (delimiter.type === 'closer') {
        if (openerDelimiter == null) continue
        const closerDelimiter = delimiter

        const opener: InlineTokenDelimiter<'opener'> = {
          type: 'opener',
          startIndex: openerDelimiter.startIndex,
          endIndex: openerDelimiter.endIndex,
          thickness: openerDelimiter.thickness,
        }

        const middle: InlineTokenDelimiter<'middle'> = {
          type: 'middle',
          startIndex: closerDelimiter.startIndex,
          endIndex: closerDelimiter.startIndex + 2,
          thickness: 2,
        }

        const closer: InlineTokenDelimiter<'closer'> = {
          type: 'closer',
          startIndex: closerDelimiter.endIndex - 1,
          endIndex: closerDelimiter.endIndex,
          thickness: 1,
        }

        const potentialToken: ReferenceLinkPotentialToken = {
          type: ReferenceLinkDataNodeType,
          startIndex: opener.startIndex,
          endIndex: closer.endIndex,
          labelContents: closerDelimiter.labelContents!,
          openerDelimiter: opener,
          middleDelimiter: middle,
          closerDelimiter: closer,
          innerRawContents: [{
            startIndex: opener.endIndex,
            endIndex: middle.startIndex,
          }]
        }

        potentialTokens.push(potentialToken)

        // reset openerDelimiter
        openerDelimiter = null
        continue
      }
    }
    return potentialTokens
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    rawContent: RawContent,
    potentialToken: ReferenceLinkPotentialToken,
    innerState: InlineTokenizerPreMatchPhaseState[],
  ): ReferenceLinkPreMatchPhaseState {
    const result: ReferenceLinkPreMatchPhaseState = {
      type: ReferenceLinkDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      labelContents: potentialToken.labelContents,
      openerDelimiter: potentialToken.openerDelimiter,
      middleDelimiter: potentialToken.middleDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      children: innerState,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    preMatchPhaseState: ReferenceLinkPreMatchPhaseState,
  ): ReferenceLinkMatchPhaseState | false {
    const result: ReferenceLinkMatchPhaseState = {
      type: ReferenceLinkDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
      labelContents: preMatchPhaseState.labelContents,
      openerDelimiter: preMatchPhaseState.openerDelimiter,
      middleDelimiter: preMatchPhaseState.middleDelimiter,
      closerDelimiter: preMatchPhaseState.closerDelimiter,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: ReferenceLinkMatchPhaseState,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): ReferenceLinkDataNode {
    const { codePositions } = rawContent

    // calc label
    let label = ''
    if (matchPhaseState.labelContents != null) {
      const { startIndex, endIndex } = matchPhaseState.labelContents
      label = calcStringFromCodePointsIgnoreEscapes(
        codePositions, startIndex, endIndex)
    }

    const identifier = normalizeLinkLabel(label)
    const result: ReferenceLinkDataNode = {
      type: ReferenceLinkDataNodeType,
      identifier,
      label,
      children: parsedChildren || [],
    }
    return result
  }
}
