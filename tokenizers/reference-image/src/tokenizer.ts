import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
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
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import {
  resolveLinkLabelAndIdentifier,
} from '@yozora/tokenizer-link-definition'
import {
  BaseInlineTokenizer,
  calcImageAlt,
} from '@yozora/tokenizercore-inline'
import { MetaKeyLinkDefinition, ReferenceImageType } from './types'


/**
 * Params for constructing ReferenceImageTokenizer
 */
export interface ReferenceImageTokenizerProps {
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
export class ReferenceImageTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'ReferenceImageTokenizer'
  public readonly delimiterGroup: string = 'ReferenceImageTokenizer'
  public readonly recognizedTypes: T[] = [ReferenceImageType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: ReferenceImageTokenizerProps = {}) {
    super()
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
    meta: Readonly<M>,
  ): ResultOfFindDelimiters<TD> {
    const definitions = meta[MetaKeyLinkDefinition] as MetaLinkDefinitions
    if (definitions == null) return null

    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.EXCLAMATION_MARK: {
          if (
            i + 1 < endIndex &&
            nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
          ) {
            const delimiter: TD = {
              type: 'opener',
              startIndex: i,
              endIndex: i + 2,
            }
            return delimiter
          }
          break
        }
        case AsciiCodePoint.CLOSE_BRACKET: {
          const closerDelimiter: TD = {
            type: 'closer',
            startIndex: i,
            endIndex: i + 1,
          }

          if (
            i + 1 < endIndex &&
            nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
          ) {
            // Try to match a link label.
            let j = i + 2
            for (; j < endIndex; ++j) {
              const c = nodePoints[j].codePoint
              if (c === AsciiCodePoint.BACKSLASH) {
                j += 1
                continue
              }

              /**
               * A link label begins with a left bracket ([) and ends with the
               * first right bracket (]) that is not backslash-escaped
               * @see https://github.github.com/gfm/#link-label
               */
              if (c === AsciiCodePoint.OPEN_BRACKET) return closerDelimiter
              if (c === AsciiCodePoint.CLOSE_BRACKET) break
            }

            closerDelimiter.endIndex = j + 1

            /**
             * A link label can have at most 999 characters inside the square
             * brackets.
             *
             * If there are more than 999 characters inside the square and all
             * of them are whitespaces, it will be handled incorrectly. But this
             * situation is too extreme, so I won’t consider it here.
             */
            if (j < endIndex && j - i - 2 <= 999) {
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
              const labelAndIdentifier = resolveLinkLabelAndIdentifier(nodePoints, i + 2, j)
              if (labelAndIdentifier == null) return closerDelimiter

              const { label, identifier } = labelAndIdentifier
              if (definitions[identifier] == null) return null

              closerDelimiter.label = label
              closerDelimiter.identifier = identifier
              return closerDelimiter
            }
          }
          return closerDelimiter
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public isDelimiterPair(
    openerDelimiter: TD,
    closerDelimiter: TD,
    higherPriorityInnerStates: ReadonlyArray<InlineTokenizerMatchPhaseState>,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfIsDelimiterPair {
    if (closerDelimiter.identifier != null) {
      const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
        openerDelimiter.startIndex + 2,
        closerDelimiter.startIndex,
        higherPriorityInnerStates,
        nodePoints
      )
      switch (balancedBracketsStatus) {
        case -1:
          return { paired: false, opener: false, closer: true }
        case 0:
          return { paired: true }
        case 1:
          return { paired: false, opener: true, closer: false }
      }
    }

    /**
      * There is only one possibility that the openerDelimiter and
      * closerDelimiter can form a shortcut / collapsed referenceImage:
      *
      *    The content between openerDelimiter and closerDelimiter form a
      *    valid definition identifier.
      *
      * Link label could including innerStates.
      * @see https://github.github.com/gfm/#example-581
      * @see https://github.github.com/gfm/#example-593
      */
    const startIndex = openerDelimiter.startIndex
    for (let i = startIndex + 2; i < closerDelimiter.startIndex; ++i) {
      switch (nodePoints[i].codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * A link label begins with a left bracket ([) and ends with the
         * first right bracket (]) that is not backslash-escaped
         * @see https://github.github.com/gfm/#link-label
         */
        case AsciiCodePoint.OPEN_BRACKET:
        case AsciiCodePoint.CLOSE_BRACKET:
          return { paired: false, opener: true, closer: false }
      }
    }

    // Check identifier between openerDelimiter and closerDelimiter.
    const definitions = meta[MetaKeyLinkDefinition] as MetaLinkDefinitions
    const labelAndIdentifier = resolveLinkLabelAndIdentifier(
      nodePoints, startIndex + 2, closerDelimiter.startIndex)!

    if (
      definitions == null ||
      labelAndIdentifier == null ||
      definitions[labelAndIdentifier.identifier] == null
    ) {
      return { paired: false, opener: false, closer: false }
    }
    return { paired: true }
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processDelimiterPair(
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessDelimiterPair<T, MS, TD> {
    const context = this.getContext()

    if (closerDelimiter.identifier != null) {
      let children: InlineTokenizerMatchPhaseState[] = []
      if (context != null) {
        // eslint-disable-next-line no-param-reassign
        children = context.resolveFallbackStates(
          innerStates,
          openerDelimiter.startIndex + 2,
          closerDelimiter.startIndex,
          nodePoints,
          meta
        )
      }
      const state: MS = {
        type: ReferenceImageType,
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        referenceType: 'full',
        label: closerDelimiter.label!,
        identifier: closerDelimiter.identifier!,
        children,
      }
      return { state }
    } else {
      const labelAndIdentifier = resolveLinkLabelAndIdentifier(
        nodePoints, openerDelimiter.startIndex + 2, closerDelimiter.startIndex)!

      let children: InlineTokenizerMatchPhaseState[] = []
      if (context != null) {
        // eslint-disable-next-line no-param-reassign
        children = context.resolveFallbackStates(
          innerStates,
          openerDelimiter.startIndex + 2,
          closerDelimiter.startIndex,
          nodePoints,
          meta
        )
      }
      const state: MS = {
        type: ReferenceImageType,
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        referenceType: closerDelimiter.endIndex - closerDelimiter.startIndex > 1
          ? 'collapsed'
          : 'shortcut',
        label: labelAndIdentifier.label,
        identifier: labelAndIdentifier.identifier,
        children,
      }
      return { state }
    }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
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
