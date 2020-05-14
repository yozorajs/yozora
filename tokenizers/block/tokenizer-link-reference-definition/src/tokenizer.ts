import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  ParagraphDataNodeType,
  ParagraphTokenizerMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePointsIgnoreEscapes,
  eatLinkDestination,
  eatLinkLabel,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreParsePhaseHook,
} from '@yozora/tokenizercore-block'
import {
  LinkReferenceDefinitionDataNode,
  LinkReferenceDefinitionDataNodeType,
} from './types'


type T = LinkReferenceDefinitionDataNodeType


/**
 * State of match phase of LinkReferenceDefinitionTokenizer
 */
export interface LinkReferenceDefinitionTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: DataNodeTokenPointDetail[]
  /**
   * Link destination
   */
  destination: DataNodeTokenPointDetail[]
  /**
   * Link title
   */
  title?: DataNodeTokenPointDetail[]
}


/**
 * Meta data of LinkReferenceDefinition
 */
export interface LinkReferenceDefinitionTokenizerMetaData {
  /**
   * <label, LinkReferenceDefinitionDataNodeData>
   * Label is a trimmed and case-insensitive string
   */
  [label: string]: LinkReferenceDefinitionDataNode
}


/**
 * Lexical Analyzer for LinkReferenceDefinitionDataNode
 *
 * A link reference definition consists of a link label, indented up to three
 * spaces, followed by a colon (:), optional whitespace (including up to one
 * line ending), a link destination, optional whitespace (including up to one
 * line ending), and an optional link title, which if it is present must be
 * separated from the link destination by whitespace. No further non-whitespace
 * characters may occur on the line.
 *
 * A link reference definition does not correspond to a structural element of
 * a document. Instead, it defines a label which can be used in reference
 * links and reference-style images elsewhere in the document. Link reference
 * definitions can come either before or after the links that use them.
 * @see https://github.github.com/gfm/#link-reference-definition
 */
export class LinkReferenceDefinitionTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerPreParsePhaseHook<
      T,
      LinkReferenceDefinitionTokenizerMatchPhaseState,
      LinkReferenceDefinitionTokenizerMetaData>
{
  public readonly name = 'LinkReferenceDefinitionTokenizer'
  public readonly uniqueTypes: T[] = [LinkReferenceDefinitionDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ): BlockTokenizerMatchPhaseState[] {
    const results: BlockTokenizerMatchPhaseState[] = []
    for (const matchPhaseState of matchPhaseStates) {
      if (matchPhaseState.type !== ParagraphDataNodeType) {
        results.push(matchPhaseState)
        continue
      }

      const paragraph = matchPhaseState as ParagraphTokenizerMatchPhaseState
      const phrasingContent = paragraph.children[0]
      const codePositions = phrasingContent.contents
      const endIndex = phrasingContent.contents.length
      let i = eatOptionalWhiteSpaces(codePositions, 0, endIndex)
      for (; i < endIndex;) {
        i = eatOptionalWhiteSpaces(codePositions, i, endIndex)

        /**
         * Eat label
         */
        const labelEndIndex = eatLinkLabel(codePositions, i, endIndex)
        if (
          labelEndIndex < 0
          || labelEndIndex + 1 >= endIndex
          || codePositions[labelEndIndex].codePoint !== AsciiCodePoint.COLON) {
          break
        }
        const label = codePositions.slice(i, labelEndIndex)

        /**
         * Eat destination (required)
         * A link destination has optional whitespace (including up to one
         * line ending) before link label
         * @see https://github.github.com/gfm/#example-168
         */
        let numberOfLineEndBeforeDestination = 0
        let destinationStartIndex  = labelEndIndex + 1
        for (; destinationStartIndex < endIndex; ++destinationStartIndex) {
          const c = codePositions[destinationStartIndex]
          if (c.codePoint === AsciiCodePoint.LINE_FEED) {
            ++numberOfLineEndBeforeDestination
            if (numberOfLineEndBeforeDestination > 1) break
            continue
          }
          if (!isWhiteSpaceCharacter(c.codePoint)) break
        }
        if (numberOfLineEndBeforeDestination > 1 || destinationStartIndex >= endIndex) break
        const destinationEndIndex = eatLinkDestination(
          codePositions, destinationStartIndex, endIndex)
        if (destinationEndIndex <= destinationStartIndex) break
        const destination = codePositions.slice(destinationStartIndex, destinationEndIndex)

        /**
         * Eat title (optional)
         * A link title must be separated from the link destination (including
         * up to one line ending)
         * @see https://github.github.com/gfm/#example-167
         * @see https://github.github.com/gfm/#example-170
         */
        let numberOfLineEndBeforeTitle = 0
        let titleStartIndex = destinationEndIndex, titleEndIndex = endIndex
        for (; titleStartIndex < endIndex; ++titleStartIndex) {
          const c = codePositions[titleStartIndex]
          if (c.codePoint === AsciiCodePoint.LINE_FEED) {
            ++numberOfLineEndBeforeTitle
            if (numberOfLineEndBeforeTitle > 1) break
            continue
          }
          if (!isWhiteSpaceCharacter(c.codePoint)) break
        }
        let title: DataNodeTokenPointDetail[] | null = null
        if (
          numberOfLineEndBeforeTitle <= 1
          && titleStartIndex > destinationEndIndex
          && titleStartIndex < endIndex) {
          titleEndIndex = eatLinkTitle(codePositions, titleStartIndex, endIndex)
          if (titleStartIndex < titleEndIndex) {
            title = codePositions.slice(titleStartIndex, titleEndIndex)
          }
        }

        /**
         * Non-whitespace characters are not allowed after the destination/title
         * @see https://github.github.com/gfm/#example-178
         * @see https://github.github.com/gfm/#example-179
         */
        let nextIndex = (title == null) ? destinationEndIndex : titleEndIndex
        let hasAdditionalNonWhiteCharacters = false
        for (let k = nextIndex; k < endIndex; ++k) {
          const c = codePositions[k]
          if (c.codePoint === AsciiCodePoint.LINE_FEED) break
          if (!isWhiteSpaceCharacter(c.codePoint)) {
            hasAdditionalNonWhiteCharacters = true
            break
          }
        }
        if (hasAdditionalNonWhiteCharacters) {
          if (title == null || numberOfLineEndBeforeTitle <= 0) break
          title = null
          nextIndex = destinationEndIndex
        }

        i = nextIndex
        const state: LinkReferenceDefinitionTokenizerMatchPhaseState = {
          type: LinkReferenceDefinitionDataNodeType,
          classify: 'meta',
          label: label,
          destination,
        }
        if (title != null) state.title = title
        results.push(state)
      }

      if (i < endIndex) {
        phrasingContent.contents = codePositions.slice(i)
        const remainParagraphState = paragraph
        results.push(remainParagraphState)
      }
    }
    return results
  }

  /**
   * hook of @BlockTokenizerPreParsePhaseHook
   */
  public parseMeta(
    matchPhaseStates: LinkReferenceDefinitionTokenizerMatchPhaseState[]
  ): LinkReferenceDefinitionTokenizerMetaData {
    const metaData: LinkReferenceDefinitionTokenizerMetaData = {}
    for (const matchPhaseState of matchPhaseStates) {
      /**
       * Labels are trimmed and case-insensitive
       * @see https://github.github.com/gfm/#example-174
       * @see https://github.github.com/gfm/#example-175
       */
      const label = calcStringFromCodePointsIgnoreEscapes(
        matchPhaseState.label, 1, matchPhaseState.label.length - 1)
        .trim()
        .toLowerCase()

      /**
       * If there are several matching definitions, the first one takes precedence
       * @see https://github.github.com/gfm/#example-173
       */
      if (metaData[label] != null) continue

      let destination: string
      if (matchPhaseState.destination[0].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        destination = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.destination, 1, matchPhaseState.destination.length - 1)
      } else {
        destination = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.destination, 0, matchPhaseState.destination.length)
      }

      metaData[label] = {
        type: LinkReferenceDefinitionDataNodeType,
        label,
        destination,
      }

      // title are optional
      if (matchPhaseState.title != null) {
        const title = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.title, 1, matchPhaseState.title.length - 1)
        metaData[label].title = title
      }
    }
    return metaData
  }
}
