import { AsciiCodePoint } from '@yozora/character'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
  resolveLabelToIdentifier,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  NextParamsOfEatDelimiters,
  RawContent,
  calcImageAlt,
} from '@yozora/tokenizercore-inline'
import {
  MetaKeyLinkDefinition,
  MetaLinkDefinitions,
  ReferenceImageDataNode,
  ReferenceImageDataNodeType,
  ReferenceImageMatchPhaseState,
  ReferenceImagePotentialToken,
  ReferenceImageTokenDelimiter,
} from './types'


type T = ReferenceImageDataNodeType


/**
 * Lexical Analyzer for ReferenceImageDataNode
 *
 * Syntax for reference-images is like the syntax for reference-links, with one difference.
 * Instead of link text, we have an image description.
 * The rules for this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is rendered to HTML,
 * this is standardly used as the image’s alt attribute.
 *
 * @see https://github.github.com/gfm/#images
 * @see https://github.github.com/gfm/#example-590
 * @see https://github.github.com/gfm/#example-592
 */
export class ReferenceImageTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerMatchPhaseHook<
      T,
      ReferenceImageMatchPhaseState,
      ReferenceImageTokenDelimiter,
      ReferenceImagePotentialToken>,
    InlineTokenizerParsePhaseHook<
      T,
      ReferenceImageMatchPhaseState,
      ReferenceImageDataNode>
{
  public readonly name = 'ReferenceImageTokenizer'
  public readonly uniqueTypes: T[] = [ReferenceImageDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, ReferenceImageTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { codePositions, meta } = rawContent
    const definitions: MetaLinkDefinitions = meta[MetaKeyLinkDefinition]
    if (definitions == null) return []

    interface PotentialOpenerDelimiter {
      pieceNo: number
      index: number
      precedingCodePosition: DataNodeTokenPointDetail | null
    }

    let pieceNo = 0
    let precedingCodePosition: DataNodeTokenPointDetail | null = null
    const poDelimiters: PotentialOpenerDelimiter[] = []
    const delimiters: ReferenceImageTokenDelimiter[] = []
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
            poDelimiters.push({ pieceNo, index: i, precedingCodePosition })
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
             *
             * An image description starts with '![' rather than '['
             * @see https://github.github.com/gfm/#image-description
             */
            if (
              poDelimiter.pieceNo < pieceNo ||
              (i - poDelimiter.index - 1) > 999
            ) {
              if (
                poDelimiter.precedingCodePosition != null &&
                poDelimiter.precedingCodePosition.codePoint === AsciiCodePoint.EXCLAMATION_MARK &&
                i + 1 < endIndex &&
                codePositions[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
              ) {
                const delimiter: ReferenceImageTokenDelimiter = {
                  type: 'potential-image-description',
                  startIndex: poDelimiter.index,
                  endIndex: i + 1,
                  thickness: i + 1 - poDelimiter.index,
                  couldBeImageDescription: true,
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
                const delimiter: ReferenceImageTokenDelimiter = {
                  type: 'potential-collapsed',
                  startIndex: poDelimiter.index,
                  endIndex: i + 1,
                  thickness: i + 1 - poDelimiter.index,
                  couldBeImageDescription: false,
                }
                delimiters.push(delimiter)
              }
              break
            }

            /**
             * Otherwise, this could be a link label
             */
            const delimiter: ReferenceImageTokenDelimiter = {
              type: 'potential-link-label',
              startIndex: poDelimiter.index,
              endIndex: i + 1,
              thickness: i + 1 - poDelimiter.index,
              couldBeImageDescription: (
                poDelimiter.precedingCodePosition != null &&
                poDelimiter.precedingCodePosition.codePoint === AsciiCodePoint.EXCLAMATION_MARK)
            }
            delimiters.push(delimiter)
            break
          }
        }

        // update precedingCodePosition (ignore escaped character)
        precedingCodePosition = p
      }
    }
    return delimiters
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: ReferenceImageTokenDelimiter[],
  ): ReferenceImagePotentialToken[] {
    const { codePositions, meta } = rawContent
    const definitions: MetaLinkDefinitions = meta[MetaKeyLinkDefinition]
    if (definitions == null) return []

    const potentialTokens: ReferenceImagePotentialToken[] = []
    const resolveLabel = (delimiter: ReferenceImageTokenDelimiter): {
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

    for (let i = 0; i < delimiters.length; ++i) {
      const delimiter = delimiters[i]
      switch (delimiter.type) {
        /**
         * A full reference link consists of a link text immediately followed
         * by a link label that matches a link reference definition elsewhere
         * in the document.
         * @see https://github.github.com/gfm/#full-reference-link
         */
        case 'potential-image-description': {
          /**
           * There must be a potential-link-label delimiter immediately to
           * the right of the current delimiter
           */
          const nextDelimiter = delimiters[i + 1]
          if (
            nextDelimiter == null ||
            nextDelimiter.startIndex !== delimiter.endIndex ||
            nextDelimiter.type !== 'potential-link-label'
          ) break

          /**
           * If nextDelimiter is not valid link-label, It may also constitute
           * link-text of full reference link, so we only remove it from the
           * iteration when it is consumed
           */
          const labelAndIdentifier = resolveLabel(nextDelimiter)
          if (labelAndIdentifier == null) break

          i += 1
          const potentialFullReferenceImageToken: ReferenceImagePotentialToken = {
            type: ReferenceImageDataNodeType,
            startIndex: delimiter.startIndex - 1,
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
          potentialTokens.push(potentialFullReferenceImageToken)
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
          if (!delimiter.couldBeImageDescription || labelAndIdentifier == null) {
            delimiter.type = 'potential-image-description'
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
              const potentialCollapsedReferenceImageToken: ReferenceImagePotentialToken = {
                type: ReferenceImageDataNodeType,
                startIndex: delimiter.startIndex - 1,
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
              potentialTokens.push(potentialCollapsedReferenceImageToken)
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
                const potentialFullReferenceImageToken: ReferenceImagePotentialToken = {
                  type: ReferenceImageDataNodeType,
                  startIndex: delimiter.startIndex - 1,
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
                potentialTokens.push(potentialFullReferenceImageToken)
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

          const potentialShortcutReferenceImageToken: ReferenceImagePotentialToken = {
            type: ReferenceImageDataNodeType,
            startIndex: delimiter.startIndex - 1,
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
          potentialTokens.push(potentialShortcutReferenceImageToken)
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
    }

    return potentialTokens
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: ReferenceImagePotentialToken,
    innerStates: InlineTokenizerMatchPhaseState[],
  ): ReferenceImageMatchPhaseState | null {
    const result: ReferenceImageMatchPhaseState = {
      type: ReferenceImageDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      identifier: potentialToken.identifier,
      label: potentialToken.label,
      referenceType: potentialToken.referenceType,
      children: innerStates,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: ReferenceImageMatchPhaseState,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): ReferenceImageDataNode {
    const { meta } = rawContent
    const definitions: MetaLinkDefinitions = meta[MetaKeyLinkDefinition]

    const { identifier, label, referenceType } = matchPhaseState

    // calc alt
    const alt = calcImageAlt(parsedChildren || [])

    const result: ReferenceImageDataNode = {
      type: ReferenceImageDataNodeType,
      identifier,
      label,
      referenceType,
      url: definitions[identifier].destination,
      alt,
      title: definitions[identifier].title,
    }
    return result
  }
}
