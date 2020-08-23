import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  ParagraphDataNodeType,
  ParagraphMatchPhaseState,
} from '@yozora/tokenizer-paragraph'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePoints,
  calcStringFromCodePointsIgnoreEscapes,
  eatLinkDestination,
  eatLinkLabel,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
  resolveLabelToIdentifier,
} from '@yozora/tokenizercore'
import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreParsePhaseHook,
} from '@yozora/tokenizercore-block'
import {
  LinkDefinitionDataNodeType,
  LinkDefinitionMatchPhaseState,
  LinkDefinitionMetaData,
} from './types'


type T = LinkDefinitionDataNodeType


/**
 * Lexical Analyzer for LinkDefinitionDataNode
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
export class LinkDefinitionTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerPreParsePhaseHook<
      T,
      LinkDefinitionMatchPhaseState,
      LinkDefinitionMetaData>
{
  public readonly name = 'LinkDefinitionTokenizer'
  public readonly uniqueTypes: T[] = [LinkDefinitionDataNodeType]

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

      const originalParagraph = matchPhaseState as ParagraphMatchPhaseState
      const originalPhrasingContent = originalParagraph.children[0]
      const codePositions: DataNodeTokenPointDetail[] = [].concat(
        ...originalPhrasingContent.lines.map(x => x.codePositions) as any[])
      const endIndex = codePositions.length
      let lastMatchedIndex = 0
      for (let i = lastMatchedIndex; lastMatchedIndex < endIndex;) {
        i = eatOptionalWhiteSpaces(codePositions, i, endIndex)

        /**
         * Eat label
         */
        const labelEndIndex = eatLinkLabel(codePositions, i, endIndex)
        if (
          labelEndIndex < 0 ||
          labelEndIndex + 1 >= endIndex ||
          codePositions[labelEndIndex].codePoint !== AsciiCodePoint.COLON
        ) {
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
            numberOfLineEndBeforeDestination += 1
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
            numberOfLineEndBeforeTitle += 1
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

        lastMatchedIndex = i = nextIndex
        const state: LinkDefinitionMatchPhaseState = {
          type: LinkDefinitionDataNodeType,
          classify: 'meta',
          label: label,
          destination,
        }
        if (title != null) state.title = title
        results.push(state)
      }

      /**
       * Other characters are left to form a paragraph
       * As the `transformMatch` running under the immer.produce,
       * so we can modify the phrasingContent directly
       */
      if (lastMatchedIndex < endIndex) {
        let lineIndex = 0
        for (let k = lastMatchedIndex; k > 0 && lineIndex < originalPhrasingContent.lines.length; ++lineIndex) {
          const line = originalPhrasingContent.lines[lineIndex]
          if (k < line.codePositions.length) {
            line.codePositions = line.codePositions.slice(k)
            let nextFirstNonWhiteSpaceIndex = 0
            const nextCodePositions = line.codePositions.slice(k)
            for (; nextFirstNonWhiteSpaceIndex < nextCodePositions.length;) {
              const c = nextCodePositions[nextFirstNonWhiteSpaceIndex]
              if (!isWhiteSpaceCharacter(c.codePoint)) break
              nextFirstNonWhiteSpaceIndex += 1
            }
            line.codePositions = nextCodePositions
            line.firstNonWhiteSpaceIndex = nextFirstNonWhiteSpaceIndex
            break
          }
          k -= line.codePositions.length
        }

        // remove leading blank lines
        for(; lineIndex < originalPhrasingContent.lines.length; ++ lineIndex)  {
          const line = originalPhrasingContent.lines[lineIndex]
          if (line.firstNonWhiteSpaceIndex < line.codePositions.length)  break
        }

        if (lineIndex < originalPhrasingContent.lines.length) {
          originalPhrasingContent.lines = originalPhrasingContent.lines.slice(lineIndex)
          results.push(originalParagraph)
        }
      }
    }
    return results
  }

  /**
   * hook of @BlockTokenizerPreParsePhaseHook
   */
  public parseMeta(
    matchPhaseStates: LinkDefinitionMatchPhaseState[]
  ): LinkDefinitionMetaData {
    const metaData: LinkDefinitionMetaData = {}
    for (const matchPhaseState of matchPhaseStates) {
      /**
       * Labels are trimmed and case-insensitive
       * @see https://github.github.com/gfm/#example-174
       * @see https://github.github.com/gfm/#example-175
       */
      const label = calcStringFromCodePoints(
        matchPhaseState.label, 1, matchPhaseState.label.length - 1)
      const identifier = resolveLabelToIdentifier(label)

      /**
       * If there are several matching definitions, the first one takes precedence
       * @see https://github.github.com/gfm/#example-173
       */
      if (metaData[identifier] != null) continue

      let destination: string
      if (matchPhaseState.destination[0].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        destination = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.destination, 1, matchPhaseState.destination.length - 1)
      } else {
        destination = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.destination, 0, matchPhaseState.destination.length)
      }

      metaData[identifier] = {
        type: LinkDefinitionDataNodeType,
        identifier,
        label,
        destination,
      }

      // title are optional
      if (matchPhaseState.title != null) {
        const title = calcStringFromCodePointsIgnoreEscapes(
          matchPhaseState.title, 1, matchPhaseState.title.length - 1)
        metaData[identifier].title = title
      }
    }
    return metaData
  }
}
