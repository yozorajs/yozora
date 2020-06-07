import { AsciiCodePoint } from '@yozora/character'
import {
  calcStringFromCodePoints,
  resolveLabelToIdentifier,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseState,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  MetaKeyLinkDefinition,
  MetaLinkDefinitions,
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
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, ReferenceLinkTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { codePositions, meta } = rawContent
    const definitions: MetaLinkDefinitions = meta[MetaKeyLinkDefinition]
    if (definitions == null) return []

    interface PotentialOpenerDelimiter {
      pieceNo: number
      index: number
    }

    let pieceNo = 0
    const poDelimiters: PotentialOpenerDelimiter[] = []
    const delimiters: ReferenceLinkTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      pieceNo += 1
      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = codePositions[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_BRACKET:
            poDelimiters.push({ pieceNo, index: i })
            break
          case AsciiCodePoint.CLOSE_BRACKET: {
            if (poDelimiters.length <= 0) break
            const poDelimiter = poDelimiters.pop()!

            /**
             * When the content spans other tokens, the content wrapped in
             * square brackets only could be used as link text
             * @see https://github.github.com/gfm/#link-text
             * @see https://github.github.com/gfm/#link-label
             *
             * A link label can have at most 999 characters inside the square brackets
             * @see https://github.github.com/gfm/#link-label
             */
            if (
              poDelimiter.pieceNo < pieceNo ||
              (i - poDelimiter.index - 1) > 999
            ) {
              if (
                i + 1 < endIndex &&
                codePositions[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
              ) {
                const delimiter: ReferenceLinkTokenDelimiter = {
                  type: 'potential-link-text',
                  startIndex: poDelimiter.index,
                  endIndex: i + 1,
                  thickness: i + 1 - poDelimiter.index,
                }
                delimiters.push(delimiter)
              }
              break
            }

            /**
             * This is an empty square bracket pair, it's only could be part
             * of collapsed reference link
             *
             * A collapsed reference link consists of a link label that matches
             * a link reference definition elsewhere in the document, followed
             * by the string `[]`
             * @see https://github.github.com/gfm/#collapsed-reference-link
             */
            if (poDelimiter.index + 1 === i) {
              /**
               * Optimization: empty square brackets make sense only if the
               *               immediate left side is a potential link-label
               */
              const previousPoDelimiter = delimiters[delimiters.length - 1]
              if (
                previousPoDelimiter != null &&
                previousPoDelimiter.endIndex === poDelimiter.index &&
                previousPoDelimiter.type === 'potential-link-label'
              ) {
                const delimiter: ReferenceLinkTokenDelimiter = {
                  type: 'potential-collapsed',
                  startIndex: poDelimiter.index,
                  endIndex: i + 1,
                  thickness: i + 1 - poDelimiter.index,
                }
                delimiters.push(delimiter)
              }
              break
            }

            /**
             * Otherwise, this could be a link label
             */
            const delimiter: ReferenceLinkTokenDelimiter = {
              type: 'potential-link-label',
              startIndex: poDelimiter.index,
              endIndex: i + 1,
              thickness: i + 1 - poDelimiter.index,
            }
            delimiters.push(delimiter)
            break
          }
        }
      }
    }
    return delimiters
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: ReferenceLinkTokenDelimiter[],
  ): ReferenceLinkPotentialToken[] {
    const { codePositions, meta } = rawContent
    const definitions: MetaLinkDefinitions = meta[MetaKeyLinkDefinition]
    if (definitions == null) return []

    const potentialTokens: ReferenceLinkPotentialToken[] = []
    const resolveLabel = (delimiter: ReferenceLinkTokenDelimiter): {
      label: string,
      identifier: string,
    } | null => {
      const label = calcStringFromCodePoints(
        codePositions, delimiter.startIndex + 1, delimiter.endIndex - 1)
        .trim()

      /**
       * A link label must contain at least one non-whitespace character
       * @see https://github.github.com/gfm/#example-559
       * @see https://github.github.com/gfm/#example-560
       */
      if (label.length <= 0) return null

      const identifier = resolveLabelToIdentifier(label)
      if (definitions[identifier] == null) return null
      return { label, identifier }
    }

    let validIndex = -1
    for (let i = 0; i < delimiters.length; ++i) {
      const delimiter = delimiters[i]

      /**
       * Links may not contain other links, at any level of nesting
       * @see https://github.github.com/gfm/#example-541
       */
      if (delimiter.startIndex < validIndex) continue

      switch (delimiter.type) {
        /**
         * A full reference link consists of a link text immediately followed
         * by a link label that matches a link reference definition elsewhere
         * in the document.
         * @see https://github.github.com/gfm/#full-reference-link
         */
        case 'potential-link-text': {
          /**
           * There must be a potential-link-label delimiter immediately to
           * the right of the current delimiter
           */
          const nextDelimiter = delimiters[i + 1]
          if (
            nextDelimiter == null ||
            nextDelimiter.type !== 'potential-link-label' ||
            nextDelimiter.startIndex !== delimiter.endIndex
          ) break

          /**
           * If nextDelimiter is not valid link-label, It may also constitute
           * link-text of full reference link, so we only remove it from the
           * iteration when it is consumed
           */
          const labelAndIdentifier = resolveLabel(nextDelimiter)
          if (labelAndIdentifier == null) break

          i += 1
          const potentialFullReferenceLinkToken: ReferenceLinkPotentialToken = {
            type: ReferenceLinkDataNodeType,
            startIndex: delimiter.startIndex,
            endIndex: nextDelimiter.endIndex,
            identifier: labelAndIdentifier.identifier,
            label: labelAndIdentifier.label,
            referenceType: 'full',
            innerRawContents: [
              {
                startIndex: delimiter.startIndex + 1,
                endIndex: delimiter.endIndex - 1,
              }
            ]
          }
          potentialTokens.push(potentialFullReferenceLinkToken)
          break
        }
        /**
         * A collapsed reference link consists of a link label that matches a
         * link reference definition elsewhere in the document, followed by the
         * string "[]"
         * @see https://github.github.com/gfm/#collapsed-reference-link
         *
         * A shortcut reference link consists of a link label that matches a
         * link reference definition elsewhere in the document and is not
         * followed by "[]" or a link label
         * @see https://github.github.com/gfm/#shortcut-reference-link
         */
        case 'potential-link-label': {
          const labelAndIdentifier = resolveLabel(delimiter)

          /**
           * Not a valid link-label, but it could be constitute link-text
           */
          if (labelAndIdentifier == null) {
            delimiter.type = 'potential-link-text'
            i -= 1
            break
          }

          /**
           * Full and compact references take precedence over shortcut references
           * @see https://github.github.com/gfm/#example-573
           * @see https://github.github.com/gfm/#example-574
           */
          const nextDelimiter = delimiters[i + 1]
          if (
            nextDelimiter != null &&
            nextDelimiter.startIndex === delimiter.endIndex
          ) {
            /**
             * @see https://github.github.com/gfm/#example-574
             */
            if (nextDelimiter.type === 'potential-collapsed') {
              i += 1
              const potentialCollapsedReferenceLinkToken: ReferenceLinkPotentialToken = {
                type: ReferenceLinkDataNodeType,
                startIndex: delimiter.startIndex,
                endIndex: nextDelimiter.endIndex,
                identifier: labelAndIdentifier.identifier,
                label: labelAndIdentifier.label,
                referenceType: 'collapsed',
                innerRawContents: [
                  {
                    startIndex: delimiter.startIndex + 1,
                    endIndex: delimiter.endIndex - 1,
                  }
                ]
              }
              potentialTokens.push(potentialCollapsedReferenceLinkToken)
              break
            }
            /**
             * @see https://github.github.com/gfm/#example-573
             * @see https://github.github.com/gfm/#example-577
             * @see https://github.github.com/gfm/#example-578
             */
            if (nextDelimiter.type === 'potential-link-label') {
              const nextLabelAndIdentifier = resolveLabel(nextDelimiter)
              if (nextLabelAndIdentifier != null) {
                i += 1
                const potentialFullReferenceLinkToken: ReferenceLinkPotentialToken = {
                  type: ReferenceLinkDataNodeType,
                  startIndex: delimiter.startIndex,
                  endIndex: nextDelimiter.endIndex,
                  identifier: nextLabelAndIdentifier.identifier,
                  label: nextLabelAndIdentifier.label,
                  referenceType: 'full',
                  innerRawContents: [
                    {
                      startIndex: delimiter.startIndex + 1,
                      endIndex: delimiter.endIndex - 1,
                    }
                  ]
                }
                potentialTokens.push(potentialFullReferenceLinkToken)
              }
              /**
               * Here current-delimiter is not parsed as a shortcut reference,
               * because it is followed by a link-label
               * @see https://github.github.com/gfm/#example-579
               */
              break
            }
            break
          }

          const potentialShortcutReferenceLinkToken: ReferenceLinkPotentialToken = {
            type: ReferenceLinkDataNodeType,
            startIndex: delimiter.startIndex,
            endIndex: delimiter.endIndex,
            identifier: labelAndIdentifier.identifier,
            label: labelAndIdentifier.label,
            referenceType: 'shortcut',
            innerRawContents: [
              {
                startIndex: delimiter.startIndex + 1,
                endIndex: delimiter.endIndex - 1,
              }
            ]
          }
          potentialTokens.push(potentialShortcutReferenceLinkToken)
          break
        }
        /**
         * potential-collapsed delimiter make sense only if the immediate left
         * side is a potential-link-label, and as we have considered this
         * situation when processing the potential-link-label, so when matching
         * directly link-collapsed, no processing we be done
         */
        case 'potential-collapsed':
          break
      }

      if (potentialTokens.length > 0) {
        validIndex = Math.max(validIndex, potentialTokens[potentialTokens.length - 1].endIndex)
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
      identifier: potentialToken.identifier,
      label: potentialToken.label,
      referenceType: potentialToken.referenceType,
      children: innerState || [],
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
      identifier: preMatchPhaseState.identifier,
      label: preMatchPhaseState.label,
      referenceType: preMatchPhaseState.referenceType,
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
    const { meta } = rawContent
    const definitions: MetaLinkDefinitions = meta[MetaKeyLinkDefinition]

    const { identifier, label, referenceType } = matchPhaseState
    const result: ReferenceLinkDataNode = {
      type: ReferenceLinkDataNodeType,
      identifier,
      label,
      referenceType,
      url: definitions[identifier].destination,
      title: definitions[identifier].title,
      children: parsedChildren || [],
    }
    return result
  }
}
