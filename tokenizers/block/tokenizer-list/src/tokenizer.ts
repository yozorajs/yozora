import {
  BaseBlockTokenizer,
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPostMatchPhaseHook,
} from '@yozora/block-tokenizer-core'
import { ListDataNode, ListDataNodeType } from './types'


type T = ListDataNodeType


/**
 * State of pre-match phase of ListTokenizer
 */
export interface ListItemMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * 列表类型
   * list type
   */
  listType: 'bullet' | 'ordered' | string
  /**
   * 列表标记或分隔符
   * marker of bullet list-item, and delimiter of ordered list-item
   */
  marker: number
  /**
   * whether exists blank line in the list-item
   */
  spread: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}

/**
 * State of match phase of ListTokenizer
 */
export interface ListTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * 列表类型
   * list type
   */
  listType: 'bullet' | 'ordered' | string
  /**
   * 列表标记或分隔符
   * marker of bullet list-item, and delimiter of ordered list-item
   */
  marker: number
  /**
   * whether exists blank line in the list-item
   */
  spread: boolean
}


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
    BlockTokenizerPostMatchPhaseHook<T, ListItemMatchPhaseState, ListTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<T, ListTokenizerMatchPhaseState, ListDataNode>
{
  public readonly name = 'ListTokenizer'
  public readonly uniqueTypes: T[] = [ListDataNodeType]

  /**
   * hook of @BlockTokenizerPostMatchPhaseHook
   */
  public transformMatch(
    originalMatchPhaseState: Readonly<ListItemMatchPhaseState>,
    originalPreviousSiblingState?: Readonly<BlockTokenizerMatchPhaseState>,
  ):
    | { nextState: ListTokenizerMatchPhaseState, final: boolean }
    | { nextState: null, final: true }
    | null {
    if (originalMatchPhaseState.listType == null) return null
    const listMatchPhaseState = originalPreviousSiblingState as ListTokenizerMatchPhaseState

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
      const state: ListTokenizerMatchPhaseState = {
        type: ListDataNodeType,
        classify: 'flow',
        listType: originalMatchPhaseState.listType,
        marker: originalMatchPhaseState.marker,
        spread: originalMatchPhaseState.spread,
        children: [originalMatchPhaseState]
      }
      return { nextState: state, final: false }
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
    return { nextState: null, final: true }
  }

  /**
   * hook of @BlockTokenizerParseFlowPhaseHook
   */
  public parseFlow(
    matchPhaseState: ListTokenizerMatchPhaseState,
  ): ListDataNode {
    return {
      type: matchPhaseState.type,
      data: {
        listType: matchPhaseState.listType,
        marker: matchPhaseState.marker,
        spread: matchPhaseState.spread,
      }
    }
  }
}
