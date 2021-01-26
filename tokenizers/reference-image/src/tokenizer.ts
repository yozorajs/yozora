import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  MetaLinkDefinitions,
  ReferenceImage as PS,
  ReferenceImageMatchPhaseState as MS,
  ReferenceImageTokenDelimiter as TD,
  ReferenceImageType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  calcStringFromNodePoints,
  resolveLabelToIdentifier,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  calcImageAlt,
} from '@yozora/tokenizercore-inline'
import {
  MetaKeyLinkDefinition,
  ReferenceImageDelimiterType,
  ReferenceImageType,
} from './types'


type PT = InlinePotentialToken<T>


/**
 * Lexical Analyzer for PS
 *
 * Syntax for reference-images is like the syntax for reference-links, with one
 * difference. Instead of link text, we have an image description. The rules for
 * this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is
 * rendered to HTML, this is standardly used as the image’s alt attribute.
 *
 * @see https://github.github.com/gfm/#images
 * @see https://github.github.com/gfm/#example-590
 * @see https://github.github.com/gfm/#example-592
 */
export class ReferenceImageTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'ReferenceImageTokenizer'
  public readonly uniqueTypes: T[] = [ReferenceImageType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public * eatDelimiters(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: M,
  ): ResultOfEatDelimiters<TD> {
    const definitions = meta[MetaKeyLinkDefinition] as MetaLinkDefinitions
    if (definitions == null) return []

    interface PotentialOpenerDelimiter {
      pieceNo: number
      index: number
      precedingCodePosition: EnhancedYastNodePoint | null
    }

    let pieceNo = 0
    let precedingCodePosition: EnhancedYastNodePoint | null = null
    const poDelimiters: PotentialOpenerDelimiter[] = []
    const delimiters: TD[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      pieceNo += 1
      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_BRACKET:
            poDelimiters.push({ pieceNo, index: i, precedingCodePosition })
            break
          case AsciiCodePoint.CLOSE_BRACKET: {
            if (poDelimiters.length <= 0) break
            const poDelimiter = poDelimiters.pop()!

            /**
             * This is an empty square bracket pair, it's only could be part
             * of collapsed reference link
             *
             * A collapsed reference link consists of a link label that matches
             * a link reference definition elsewhere in the document, followed
             * by the string `[]`
             * @see https://github.github.com/gfm/#collapsed-reference-link
             *
             * A link label must contain at least one non-whitespace character
             * @see https://github.github.com/gfm/#example-559
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
                previousPoDelimiter.type === ReferenceImageDelimiterType.POTENTIAL_LINK_LABEL
              ) {
                const delimiter: TD = {
                  type: ReferenceImageDelimiterType.POTENTIAL_COLLAPSED,
                  startIndex: poDelimiter.index,
                  endIndex: i + 1,
                  couldBeImageDescription: false,
                }
                delimiters.push(delimiter)
              }
              break
            }

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
                nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
              ) {
                const delimiter: TD = {
                  type: ReferenceImageDelimiterType.POTENTIAL_IMAGE_DESCRIPTION,
                  startIndex: poDelimiter.index,
                  endIndex: i + 1,
                  couldBeImageDescription: true,
                }
                delimiters.push(delimiter)
              }
              break
            }

            /**
             * Otherwise, this could be a link label
             */
            const delimiter: TD = {
              type: ReferenceImageDelimiterType.POTENTIAL_LINK_LABEL,
              startIndex: poDelimiter.index,
              endIndex: i + 1,
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
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public eatPotentialTokens(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    delimiters: TD[],
  ): ResultOfEatPotentialTokens<T> {
    const definitions = meta[MetaKeyLinkDefinition] as MetaLinkDefinitions
    if (definitions == null) return []

    const results: PT[] = []
    const resolveLabel = (delimiter: TD): {
      label: string,
      identifier: string,
    } | null => {
      const label = calcStringFromNodePoints(
        nodePoints, delimiter.startIndex + 1, delimiter.endIndex - 1)
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
        case ReferenceImageDelimiterType.POTENTIAL_IMAGE_DESCRIPTION: {
          /**
           * There must be a potential-link-label delimiter immediately to
           * the right of the current delimiter
           */
          const nextDelimiter = delimiters[i + 1]
          if (
            nextDelimiter == null ||
            nextDelimiter.startIndex !== delimiter.endIndex ||
            nextDelimiter.type !== ReferenceImageDelimiterType.POTENTIAL_LINK_LABEL
          ) break

          /**
           * If nextDelimiter is not valid link-label, It may also constitute
           * link-text of full reference link, so we only remove it from the
           * iteration when it is consumed
           */
          const labelAndIdentifier = resolveLabel(nextDelimiter)
          if (labelAndIdentifier == null) break

          i += 1

          const state: MS = {
            type: ReferenceImageType,
            identifier: labelAndIdentifier.identifier,
            label: labelAndIdentifier.label,
            referenceType: 'full',
          }
          results.push({
            state,
            startIndex: delimiter.startIndex - 1,
            endIndex: nextDelimiter.endIndex,
            innerRawContents: [{
              startIndex: delimiter.startIndex + 1,
              endIndex: delimiter.endIndex - 1,
            }]
          })
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
        case ReferenceImageDelimiterType.POTENTIAL_LINK_LABEL: {
          /**
           * Link label will be consumed by preceding POTENTIAL_IMAGE_DESCRIPTION,
           * Therefore, only when it can be used as a POTENTIAL_IMAGE_DESCRIPTION
           * can it form part of the PS
           */
          if (!delimiter.couldBeImageDescription) break

          /**
           * Not a valid link-label, but it could be constitute link-text
           */
          const labelAndIdentifier = resolveLabel(delimiter)
          if (labelAndIdentifier == null) {
            delimiter.type = ReferenceImageDelimiterType.POTENTIAL_IMAGE_DESCRIPTION
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
            if (nextDelimiter.type === ReferenceImageDelimiterType.POTENTIAL_COLLAPSED) {
              i += 1

              const state: MS = {
                type: ReferenceImageType,
                identifier: labelAndIdentifier.identifier,
                label: labelAndIdentifier.label,
                referenceType: 'collapsed',
              }
              results.push({
                state,
                startIndex: delimiter.startIndex - 1,
                endIndex: nextDelimiter.endIndex,
                innerRawContents: [{
                  startIndex: delimiter.startIndex + 1,
                  endIndex: delimiter.endIndex - 1,
                }]
              })
              break
            }

            /**
             * @see https://github.github.com/gfm/#example-573
             * @see https://github.github.com/gfm/#example-577
             * @see https://github.github.com/gfm/#example-578
             */
            if (nextDelimiter.type === ReferenceImageDelimiterType.POTENTIAL_LINK_LABEL) {
              const nextLabelAndIdentifier = resolveLabel(nextDelimiter)
              if (nextLabelAndIdentifier != null) {
                i += 1

                const state: MS = {
                  type: ReferenceImageType,
                  identifier: nextLabelAndIdentifier.identifier,
                  label: nextLabelAndIdentifier.label,
                  referenceType: 'full',
                }
                results.push({
                  state,
                  startIndex: delimiter.startIndex - 1,
                  endIndex: nextDelimiter.endIndex,
                  innerRawContents: [{
                    startIndex: delimiter.startIndex + 1,
                    endIndex: delimiter.endIndex - 1,
                  }]
                })
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

          const state: MS = {
            type: ReferenceImageType,
            identifier: labelAndIdentifier.identifier,
            label: labelAndIdentifier.label,
            referenceType: 'shortcut',
          }
          results.push({
            state,
            startIndex: delimiter.startIndex - 1,
            endIndex: delimiter.endIndex,
            innerRawContents: [{
              startIndex: delimiter.startIndex + 1,
              endIndex: delimiter.endIndex - 1,
            }]
          })
          break
        }
        /**
         * potential-collapsed delimiter make sense only if the immediate left
         * side is a potential-link-label, and as we have considered this
         * situation when processing the potential-link-label, so when matching
         * directly link-collapsed, no processing we be done
         */
        case ReferenceImageDelimiterType.POTENTIAL_COLLAPSED:
          break
      }
    }

    return results
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseState: MS,
    parsedChildren?: YastInlineNode[],
  ): PS {
    const { identifier, label, referenceType } = matchPhaseState

    // calc alt
    const alt = calcImageAlt(parsedChildren || [])

    const result: PS = {
      type: ReferenceImageType,
      identifier,
      label,
      referenceType,
      alt,
    }
    return result
  }
}
