import type { RootMeta, YastNode } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'
import type {
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastToken,
} from '@yozora/core-tokenizer'
import type { DefinitionMetaData } from '@yozora/tokenizer-definition'
import {
  DefinitionType,
  resolveLinkLabelAndIdentifier,
} from '@yozora/tokenizer-definition'
import { calcImageAlt } from '@yozora/tokenizer-image'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import type {
  ImageReferenceTokenDelimiter as Delimiter,
  ImageReference as Node,
  ImageReferenceType as T,
  ImageReferenceMatchPhaseState as Token,
} from './types'
import { ImageReferenceType } from './types'

type Meta = RootMeta & {
  [DefinitionType]: DefinitionMetaData
}

/**
 * Params for constructing a ImageReferenceTokenizer.
 */
export interface ImageReferenceTokenizerProps {
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
 * Lexical Analyzer for ImageReference.
 *
 * Syntax for image-references is like the syntax for link-references, with one
 * difference. Instead of link text, we have an image description. The rules for
 * this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is
 * rendered to HTML, this is standardly used as the image’s alt attribute.
 *
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.github.com/gfm/#images
 */
export class ImageReferenceTokenizer
  implements
    Tokenizer<T>,
    TokenizerMatchInlineHook<T, Delimiter, Token, Meta>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  public readonly name: string = ImageReferenceTokenizer.name
  public readonly recognizedTypes: T[] = [ImageReferenceType]
  public readonly getContext: Tokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = ImageReferenceTokenizer.name
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  /* istanbul ignore next */
  constructor(props: ImageReferenceTokenizerProps = {}) {
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
    meta: Readonly<Meta>,
  ): ResultOfFindDelimiters<Delimiter> {
    const definitions = meta[DefinitionType]
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
            const delimiter: Delimiter = {
              type: 'opener',
              startIndex: i,
              endIndex: i + 2,
            }
            return delimiter
          }
          break
        }
        case AsciiCodePoint.CLOSE_BRACKET: {
          const closerDelimiter: Delimiter = {
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
               * @see https://github.github.com/gfm/#collapsed-link-reference
               *
               * A link label must contain at least one non-whitespace character
               * @see https://github.github.com/gfm/#example-559
               */
              const labelAndIdentifier = resolveLinkLabelAndIdentifier(
                nodePoints,
                i + 2,
                j,
              )
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
   * @see TokenizerMatchInlineHook
   */
  public isDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    higherPriorityInnerStates: ReadonlyArray<YastToken>,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfIsDelimiterPair {
    if (closerDelimiter.identifier != null) {
      const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
        openerDelimiter.startIndex + 2,
        closerDelimiter.startIndex,
        higherPriorityInnerStates,
        nodePoints,
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
     * closerDelimiter can form a shortcut / collapsed ImageReference:
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
    const definitions = meta[DefinitionType]
    const labelAndIdentifier = resolveLinkLabelAndIdentifier(
      nodePoints,
      startIndex + 2,
      closerDelimiter.startIndex,
    )!

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
   * @see TokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    innerStates: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    const context = this.getContext()

    if (closerDelimiter.identifier != null) {
      let children: YastToken[] = []
      if (context != null) {
        // eslint-disable-next-line no-param-reassign
        children = context.resolveFallbackTokens(
          innerStates,
          openerDelimiter.startIndex + 2,
          closerDelimiter.startIndex,
          nodePoints,
          meta,
        )
      }
      const token: Token = {
        type: ImageReferenceType,
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        referenceType: 'full',
        label: closerDelimiter.label!,
        identifier: closerDelimiter.identifier!,
        children,
      }
      return { token }
    } else {
      const labelAndIdentifier = resolveLinkLabelAndIdentifier(
        nodePoints,
        openerDelimiter.startIndex + 2,
        closerDelimiter.startIndex,
      )!

      let children: YastToken[] = []
      if (context != null) {
        // eslint-disable-next-line no-param-reassign
        children = context.resolveFallbackTokens(
          innerStates,
          openerDelimiter.startIndex + 2,
          closerDelimiter.startIndex,
          nodePoints,
          meta,
        )
      }
      const token: Token = {
        type: ImageReferenceType,
        startIndex: openerDelimiter.startIndex,
        endIndex: closerDelimiter.endIndex,
        referenceType:
          closerDelimiter.endIndex - closerDelimiter.startIndex > 1
            ? 'collapsed'
            : 'shortcut',
        label: labelAndIdentifier.label,
        identifier: labelAndIdentifier.identifier,
        children,
      }
      return { token }
    }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(token: Token, children?: YastNode[]): Node {
    const { identifier, label, referenceType } = token

    // calc alt
    const alt = calcImageAlt(children || [])

    const result: Node = {
      type: ImageReferenceType,
      identifier,
      label,
      referenceType,
      alt,
    }
    return result
  }
}
