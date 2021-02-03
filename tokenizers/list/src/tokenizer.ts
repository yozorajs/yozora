import type {
  EnhancedYastNodePoint,
  YastNodePosition,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizer,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
  ResultOfParse,
  YastBlockNode,
} from '@yozora/tokenizercore-block'
import type {
  List as PS,
  ListItemPostMatchPhaseState,
  ListMatchPhaseState as MS,
  ListPostMatchPhaseState as PMS,
  ListType as T,
} from './types'
import { ListType } from './types'


/**
 * Params for constructing ListTokenizer
 */
export interface ListTokenizerProps {

}


/**
 * Lexical Analyzer for List
 *
 * A list is a sequence of one or more list items of the same type.
 * The list items may be separated by any number of blank lines.
 * @see https://github.github.com/gfm/#list
 */
export class ListTokenizer implements
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerParsePhaseHook<T, PMS, PS>
{
  public readonly name = 'ListTokenizer'
  public readonly getContext: BlockTokenizer['getContext'] = () => null

  public readonly recognizedTypes: ReadonlyArray<T> = [ListType]

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public constructor(props: ListTokenizerProps = {}) {
  }

  /**
   * @override
   * @see BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    states: ReadonlyArray<BlockTokenizerPostMatchPhaseState>,
  ): BlockTokenizerPostMatchPhaseState[] {
    const context = this.getContext()
    if (context == null) return []
    const results: BlockTokenizerPostMatchPhaseState[] = []

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
    let listItems: ListItemPostMatchPhaseState[] = []
    const resolveList = (): void => {
      if (listItems.length <= 0) return

      let spread = listItems
        .some((item: ListItemPostMatchPhaseState): boolean => {
          if (item.children == null || item.children.length <= 1) return false

          let previousPosition: YastNodePosition = item.children[0].position
          for (let j = 1; j < item.children.length; ++j) {
            const currentPosition: YastNodePosition = item.children[j].position
            if (previousPosition.end.line + 1 < currentPosition.start.line) {
              return true
            }
            previousPosition = currentPosition
          }
          return false
        })

      if (!spread && listItems.length > 1) {
        let previousItem: ListItemPostMatchPhaseState = listItems[0]
        for (let i = 1; i < listItems.length; ++i) {
          const currentItem = listItems[i]

          // If there exists blank line between list items, then the list is loose.
          if (previousItem.position.end.line + 1 < currentItem.position.start.line) {
            spread = true
            break
          }

          previousItem = currentItem
        }
      }

      const list: PMS = {
        type: ListType,
        listType: listItems[0].listType,
        start: listItems[0].order,
        marker: listItems[0].marker,
        spread,
        position: {
          start: { ...listItems[0].position.start },
          end: { ...listItems[listItems.length - 1].position.end },
        },
        children: [...listItems],
      }
      results.push(list)

      if (list.spread) return

      // Make list tighter.
      for (const listItem of list.children) {
        if (listItem.children == null || listItem.children.length <= 0) continue
        listItem.children = listItem.children.map(child => {
          const lines = context.extractPhrasingContentLines(child)
          if (lines == null) return child

          const phrasingContentState = context
            .buildPhrasingContentPostMatchPhaseState(nodePoints, lines)
          return phrasingContentState == null ? child : phrasingContentState
        })
      }
    }

    for (let i = 0; i < states.length; ++i) {
      const originalState = states[i] as ListItemPostMatchPhaseState
      if (originalState.listType == null) {
        resolveList()
        listItems = []
        results.push(originalState)
        continue
      }

      /**
       * If originalState is null or not a ListItemPostMatchPhaseState
       * or its listType is inconsistent to the originalState.listType or
       * its marker is inconsistent to the originalState.marker,
       * then create a new list
       */
      if (
        listItems.length <= 0 ||
        listItems[0].listType !== originalState.listType ||
        listItems[0].marker !== originalState.marker
      ) {
        resolveList()
        listItems = [originalState]
        continue
      }

      /**
       * Otherwise the current item should be a child of the originalState,
       * and the originalState should be removed from the
       * BlockTokenizerPostMatchPhaseStateTree
       */
      listItems.push(originalState)
    }

    resolveList()
    return results
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    postMatchState: Readonly<PMS>,
    children?: YastBlockNode[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: postMatchState.type,
      listType: postMatchState.listType,
      start: postMatchState.start,
      marker: postMatchState.marker,
      spread: postMatchState.spread,
      children: (children || []) as PS[],
    }
    return { classification: 'flow', state }
  }
}
