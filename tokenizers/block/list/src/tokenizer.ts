import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreParsePhaseState,
} from '@yozora/tokenizercore-block'
import type {
  ListDataNode,
  ListItemDataNode,
  ListItemMatchPhaseState,
  ListMatchPhaseState,
} from './types'
import { ParagraphDataNodeType } from '@yozora/tokenizer-paragraph'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { ListDataNodeType } from './types'


type T = ListDataNodeType


/**
 * Lexical Analyzer for ListDataNode
 *
 * A list is a sequence of one or more list items of the same type.
 * The list items may be separated by any number of blank lines.
 * @see https://github.github.com/gfm/#list
 */
export class ListTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerPostMatchPhaseHook,
    BlockTokenizerParsePhaseHook<
      T,
      ListMatchPhaseState,
      ListDataNode>
{
  public readonly name = 'ListTokenizer'
  public readonly uniqueTypes: T[] = [ListDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ): BlockTokenizerMatchPhaseState[] {
    const results: BlockTokenizerMatchPhaseState[] = []
    let listMatchPhaseState: ListMatchPhaseState | null = null
    for (let i = 0; i < matchPhaseStates.length; ++i) {
      const originalMatchPhaseState = matchPhaseStates[i] as ListItemMatchPhaseState
      if (originalMatchPhaseState.listType == null) {
        listMatchPhaseState = null
        results.push(originalMatchPhaseState)
        continue
      }

      if (results.length > 0) {
        listMatchPhaseState = results[results.length - 1] as ListMatchPhaseState
      }

      /**
       * If originalPreviousSiblingState is null or not a ListTokenizerMatchPhaseState
       * or its listType is inconsistent to the originalMatchPhaseState.listType or
       * its marker is inconsistent to the originalMatchPhaseState.marker,
       * then create a new list
       */
      if (
        listMatchPhaseState == null
        || listMatchPhaseState.type !== ListDataNodeType
        || listMatchPhaseState.listType !== originalMatchPhaseState.listType
        || listMatchPhaseState.marker !== originalMatchPhaseState.marker
      ) {
        const state: ListMatchPhaseState = {
          type: ListDataNodeType,
          classify: 'flow',
          listType: originalMatchPhaseState.listType,
          marker: originalMatchPhaseState.marker,
          spread: originalMatchPhaseState.spread,
          children: [originalMatchPhaseState]
        }
        listMatchPhaseState = state
        results.push(listMatchPhaseState)
        continue
      }

      /**
       * Otherwise the current item should be a child of the originalPreviousSiblingState,
       * and the originalMatchPhaseState should be removed from the BlockTokenizerMatchPhaseStateTree
       */
      if (listMatchPhaseState.spread === false) {
        if (originalMatchPhaseState.spread) listMatchPhaseState.spread = true
        else {
          const previousSiblingListItem = listMatchPhaseState.children![
            listMatchPhaseState.children!.length - 1] as ListItemMatchPhaseState
          if (previousSiblingListItem.isLastLineBlank) {
            // eslint-disable-next-line no-param-reassign
            listMatchPhaseState.spread = true
          }
        }
      }
      listMatchPhaseState.children!.push(originalMatchPhaseState)
    }
    return results
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: ListMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
    children?: BlockTokenizerParsePhaseState[],
  ): ListDataNode {
    const result: ListDataNode = {
      type: matchPhaseState.type,
      listType: matchPhaseState.listType,
      marker: matchPhaseState.marker,
      spread: matchPhaseState.spread,
      children: (children || []) as ListItemDataNode[],
    }

    /**
     * A list is loose if any of its constituent list items are separated by
     * blank lines, or if any of its constituent list items directly contain
     * two block-level elements with a blank line between them. Otherwise a
     * list is tight. (The difference in HTML output is that paragraphs in a
     * loose list are wrapped in <p> tags, while paragraphs in a tight list
     * are not.)
     *
     * If list is not loose, traverse the list-items, for the list-item whose
     * first child node is Paragraph, convert the first node in this list-item
     * to PhrasingContent
     */
    if (!result.spread) {
      for (const listItem of (children as ListItemDataNode[])) {
        if (listItem.children == null || listItem.children.length <= 0) continue
        const firstChild = listItem.children[0]
        if (firstChild.type === ParagraphDataNodeType) {
          listItem.children[0] = firstChild.children![0]
        }
      }
    }
    return result
  }
}
