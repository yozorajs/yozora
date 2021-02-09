import type { NodePoint } from '@yozora/character'
import type { LinkDefinitionMetaData } from '@yozora/tokenizer-link-definition'
import type { YastMeta, YastNode } from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
} from '@yozora/tokenizercore-inline'
import type {
  ReferenceLink as PS,
  ReferenceLinkMatchPhaseState as MS,
  ReferenceLinkTokenDelimiter as TD,
  ReferenceLinkType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import {
  LinkDefinitionType,
  resolveLinkLabelAndIdentifier,
} from '@yozora/tokenizer-link-definition'
import { ReferenceLinkType } from './types'


type M = YastMeta & {
  [LinkDefinitionType]: LinkDefinitionMetaData
}


/**
 * Params for constructing ReferenceLinkTokenizer
 */
export interface ReferenceLinkTokenizerProps {
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
 * There are three kinds of reference links:
 *  - full: A full reference link consists of a link text immediately followed
 *    by a link label that matches a link reference definition elsewhere in the
 *    document.
 *
 *    A link label begins with a left bracket '[' and ends with the first right
 *    bracket ']' that is not backslash-escaped. Between these brackets there
 *    must be at least one non-whitespace character. Unescaped square bracket
 *    characters are not allowed inside the opening and closing square brackets
 *    of link labels. A link label can have at most 999 characters inside the
 *    square brackets.
 *
 *    One label matches another just in case their normalized forms are equal.
 *    To normalize a label, strip off the opening and closing brackets, perform
 *    the Unicode case fold, strip leading and trailing whitespace and collapse
 *    consecutive internal whitespace to a single space. If there are multiple
 *    matching reference link definitions, the one that comes first in the
 *    document is used. (It is desirable in such cases to emit a warning.)
 *
 *  - collapsed: A collapsed reference link consists of a link label that
 *    matches a link reference definition elsewhere in the document, followed
 *    by the string '[]'. The contents of the first link label are parsed as
 *    inlines, which are used as the link’s text. The link’s URI and title are
 *    provided by the matching reference link definition.
 *    Thus, '[foo][]' is equivalent to '[foo][foo]'.
 *
 *  - shortcut (not support): A shortcut reference link consists of a link label
 *    that matches a link reference definition elsewhere in the document and is
 *    not followed by '[]' or a link label. The contents of the first link label
 *    are parsed as inlines, which are used as the link’s text. The link’s URI
 *    and title are provided by the matching link reference definition.
 *    Thus, '[foo]' is equivalent to '[foo][]'.
 *
 * @see https://github.github.com/gfm/#reference-link
 */
export class ReferenceLinkTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'ReferenceLinkTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'ReferenceLinkTokenizer'
  public readonly recognizedTypes: T[] = [ReferenceLinkType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: ReferenceLinkTokenizerProps = {}) {
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
    meta: Readonly<M>,
  ): ResultOfFindDelimiters<TD> {
    const definitions = meta[LinkDefinitionType]
    if (definitions == null) return null

    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * A link text consists of a sequence of zero or more inline elements
         * enclosed by square brackets ([ and ])
         * @see https://github.github.com/gfm/#link-text
         */
        case AsciiCodePoint.OPEN_BRACKET: {
          const delimiter: TD = {
            type: 'opener',
            startIndex: i,
            endIndex: i + 1,
          }
          return delimiter
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
              if (definitions[identifier] == null) {
                const openerDelimiter: TD = {
                  type: 'opener',
                  startIndex: i + 1,
                  endIndex: i + 2,
                }
                return openerDelimiter
              }

              /**
               * Notice that the `endIndex` is j instead of j+1, because the
               * last character ']' my be part of the next `both` type delimiter.
               */
              const delimiter: TD = {
                type: 'both',
                startIndex: i,
                endIndex: j,
                label,
                identifier,
              }
              return delimiter
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
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ): ResultOfIsDelimiterPair {
    switch (closerDelimiter.type) {
      case 'both': {
        let startIndex = openerDelimiter.startIndex
        switch (openerDelimiter.type) {
          case 'both':
            startIndex += 1
          case 'opener':
            const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
              startIndex + 1,
              closerDelimiter.startIndex,
              higherPriorityInnerStates,
              nodePoints
            )
            if (balancedBracketsStatus !== 0) {
              return { paired: false, opener: true, closer: true }
            }
            return { paired: true }
          default:
            throw new TypeError(
              `[reference-link] bad type of openerDelimiter: (${ openerDelimiter.type }).`)
        }
      }
      case 'closer': {
        switch (openerDelimiter.type) {
          /**
           * There is only one possibility that the openerDelimiter and
           * closerDelimiter can form a shortcut / collapsed referenceLink:
           *
           *    The content between openerDelimiter and closerDelimiter form a
           *    valid definition identifier.
           *
           * Link label could including innerStates.
           * @see https://github.github.com/gfm/#example-581
           * @see https://github.github.com/gfm/#example-593
           */
          case 'opener': {
            const startIndex = openerDelimiter.startIndex
            for (let i = startIndex + 1; i < closerDelimiter.startIndex; ++i) {
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

            const definitions = meta[LinkDefinitionType]
            const labelAndIdentifier = resolveLinkLabelAndIdentifier(
              nodePoints, startIndex + 1, closerDelimiter.startIndex)!
            if (
              definitions == null ||
              labelAndIdentifier == null ||
              definitions[labelAndIdentifier.identifier] == null
            ) {
              return { paired: false, opener: false, closer: false }
            }
            return { paired: true }
          }
          case 'both':
            if (openerDelimiter.endIndex === closerDelimiter.startIndex) {
              return { paired: true }
            }
            return { paired: false, opener: false, closer: true }
          default:
            throw new TypeError(
              `[reference-link] bad type of openerDelimiter: (${ openerDelimiter.type }).`)
        }
      }
      default:
        throw new TypeError(
          `[reference-link] bad type of closerDelimiter: (${ closerDelimiter.type }).`)
    }
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processDelimiterPair(
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessDelimiterPair<T, MS, TD> {
    const context = this.getContext()
    switch (closerDelimiter.type) {
      /**
       * A full reference link consists of a link text immediately followed by
       * a link label that matches a link reference definition elsewhere in the
       * document
       */
      case 'both': {
        let startIndex = openerDelimiter.startIndex
        switch (openerDelimiter.type) {
          case 'both':
            startIndex += 1
          case 'opener': {
            let children: InlineTokenizerMatchPhaseState[] = innerStates
            if (context != null) {
              // eslint-disable-next-line no-param-reassign
              children = context.resolveFallbackStates(
                innerStates,
                startIndex + 1,
                closerDelimiter.startIndex,
                nodePoints,
                meta
              )
            }
            const state: MS = {
              type: ReferenceLinkType,
              startIndex: startIndex,
              endIndex: closerDelimiter.endIndex + 1,
              referenceType: 'full',
              label: closerDelimiter.label!,
              identifier: closerDelimiter.identifier!,
              children,
            }
            return {
              state,
              shouldInactivateOlderDelimiters: true,
            }
          }
          default:
            throw new TypeError(
              `[reference-link] bad type of openerDelimiter: (${ openerDelimiter.type }).`)
        }
      }
      case 'closer': {
        let label: string = openerDelimiter.label!
        let identifier: string = openerDelimiter.identifier!
        let startIndex: number = openerDelimiter.startIndex + 1

        if (openerDelimiter.type === 'opener') {
          startIndex = openerDelimiter.startIndex
          const labelAndIdentifier = resolveLinkLabelAndIdentifier(
            nodePoints, startIndex + 1, closerDelimiter.startIndex)!
          label = labelAndIdentifier.label
          identifier = labelAndIdentifier.identifier
        }

        let children: InlineTokenizerMatchPhaseState[] = []
        if (context != null) {
          // eslint-disable-next-line no-param-reassign
          children = context.resolveFallbackStates(
            innerStates,
            startIndex + 1,
            closerDelimiter.startIndex,
            nodePoints,
            meta
          )
        }
        const state: MS = {
          type: ReferenceLinkType,
          startIndex,
          endIndex: closerDelimiter.endIndex,
          referenceType: closerDelimiter.endIndex - closerDelimiter.startIndex > 1
            ? 'collapsed'
            : 'shortcut',
          label,
          identifier,
          children,
        }

        return {
          state,
          shouldInactivateOlderDelimiters: true,
        }
      }
      default:
        throw new TypeError(
          `[reference-link] bad type of closerDelimiter: (${ closerDelimiter.type }).`)
    }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: MS,
    parsedChildren: YastNode[] | undefined,
  ): PS {
    const { identifier, label, referenceType } = matchPhaseState
    const result: PS = {
      type: ReferenceLinkType,
      identifier,
      label,
      referenceType,
      children: parsedChildren || [],
    }
    return result
  }
}
