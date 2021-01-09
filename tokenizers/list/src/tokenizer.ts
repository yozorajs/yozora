import type {
  BlockTokenizer,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerProps,
  ClosedBlockTokenizerMatchPhaseState,
  ResultOfParse,
} from '@yozora/tokenizercore-block'
import type {
  ClosedListItemMatchPhaseState,
  ClosedListMatchPhaseState as CMS,
  List as PS,
  ListMatchPhaseStateData as MSD,
  ListType as T,
} from './types'
import { BaseBlockTokenizer } from '@yozora/tokenizercore-block'
import { ListType } from './types'


/**
 * Lexical Analyzer for List
 *
 * A list is a sequence of one or more list items of the same type.
 * The list items may be separated by any number of blank lines.
 * @see https://github.github.com/gfm/#list
 */
export class ListTokenizer extends BaseBlockTokenizer<T> implements
  BlockTokenizer<T>,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerParsePhaseHook<T, MSD, PS>
{
  public readonly name = 'ListTokenizer'
  public readonly uniqueTypes: T[] = [ListType]

  public constructor(props: BlockTokenizerProps) {
    super({
      ...props,
      interruptableTypes: props.interruptableTypes || [],
    })
  }

  /**
   * @override
   * @see BlockTokenizerPostMatchPhaseHook#transformMatch
   */
  public transformMatch(
    closedMatchPhaseStates: Readonly<ClosedBlockTokenizerMatchPhaseState[]>,
  ): ClosedBlockTokenizerMatchPhaseState[] {
    const results: ClosedBlockTokenizerMatchPhaseState[] = []
    const context = this.getContext()

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
    let list: CMS | null = null
    const closeList = (): void => {
      if (
        context == null ||
        list == null ||
        list.spread ||
        list.children == null
      ) return

      for (const listItem of list.children) {
        if (listItem.children == null || listItem.children.length <= 0) continue
        listItem.children = listItem.children.map(child => {
          const phrasingContentState = context.extractPhrasingContentCMS(child)
          return phrasingContentState == null ? child : phrasingContentState
        })
      }
    }

    for (let i = 0; i < closedMatchPhaseStates.length; ++i) {
      const originalState = closedMatchPhaseStates[i] as ClosedListItemMatchPhaseState
      if (originalState.listType == null) {
        closeList()
        list = null
        results.push(originalState)
        continue
      }

      /**
       * If originalState is null or not a ClosedListItemMatchPhaseState
       * or its listType is inconsistent to the originalState.listType or
       * its marker is inconsistent to the originalState.marker,
       * then create a new list
       */
      if (
        list == null ||
        list.listType !== originalState.listType ||
        list.marker !== originalState.marker
      ) {
        closeList()
        list = {
          type: ListType,
          listType: originalState.listType,
          marker: originalState.marker,
          spread: originalState.spread,
          children: [originalState]
        }
        results.push(list)
        continue
      }

      /**
       * Otherwise the current item should be a child of the originalState,
       * and the originalState should be removed from the ClosedBlockTokenizerMatchPhaseStateTree
       */
      if (list.spread === false) {
        if (
          originalState.spread ||
          list.children[list.children.length - 1]?.isLastLineBlank
        ) {
          list.spread = true
        }
      }
      list.children!.push(originalState)
    }

    closeList()
    return results
  }

  /**
   * @override
   * @see BlockTokenizerParsePhaseHook#parse
   */
  public parse(
    matchPhaseStateData: MSD,
    children?: BlockTokenizerParsePhaseState[],
  ): ResultOfParse<T, PS> {
    const state: PS = {
      type: matchPhaseStateData.type,
      listType: matchPhaseStateData.listType,
      marker: matchPhaseStateData.marker,
      spread: matchPhaseStateData.spread,
      children: (children || []) as PS[],
    }
    return { classification: 'flow', state }
  }
}
