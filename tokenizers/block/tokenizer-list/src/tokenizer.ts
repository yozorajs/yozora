import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import {
  ListDataNode,
  ListDataNodeChild,
  ListDataNodeData,
  ListDataNodeType,
} from './types'


type T = ListDataNodeType


export interface ListDataNodeMatchState extends BlockDataNodeMatchState<T> {
  children: BlockDataNodeMatchState[]
  listType: 'bullet' | 'ordered' | string
  marker: number
  delimiter: number
  spread: boolean
  isCurrentLineBlank: boolean
  isLastLineBlank: boolean
}


export interface ListDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  children: BlockDataNodeMatchResult[]
  listType: 'bullet' | 'ordered' | string
  marker: number
  delimiter: number
  spread: boolean
}


/**
 * Lexical Analyzer for ListDataNode
 */
export class ListTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ListDataNodeData,
  ListDataNodeMatchState,
  ListDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  ListDataNodeData,
  ListDataNodeMatchState,
  ListDataNodeMatchResult> {
  public readonly name = 'ListTokenizer'
  public readonly recognizedTypes: T[] = [ListDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, ListDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null

    const self = this
    for (const subTokenizer of self.subTokenizers) {
      const itemEatingResult = subTokenizer.eatNewMarker(
        codePoints, eatingLineInfo, parentState)
      if (itemEatingResult == null) continue

      /**
       * 如果父节点类型是 ListDataNode，且其满足作为当前 List 的条目的条件，则返回 ListItemDataNode
       * If the parent node type is ListDataNode, and it satisfies the condition
       * of being an item of the current List, then returns ListItemDataNode
       */
      if (parentState.type === ListDataNodeType) {
        const state = parentState as ListDataNodeMatchState
        const currentChild = itemEatingResult.state as BlockDataNodeMatchState & ListDataNodeChild
        if (self.isValidListItemChild(state, currentChild)) {
          return itemEatingResult as BlockDataNodeEatingResult<any, any>
        }
      }

      /**
       * In order to solve of unwanted lists in paragraphs with hard-wrapped
       * numerals, we allow only lists starting with 1 to interrupt paragraphs.
       * @see https://github.github.com/gfm/#example-284
       */
      if (parentState.children!.length > 0) {
        const firstChild = parentState.children![parentState.children!.length - 1]
        if (firstChild.type === 'PARAGRAPH') {
          const currentChild = itemEatingResult.state as BlockDataNodeMatchState & ListDataNodeChild
          if (currentChild.listType === 'ordered' && currentChild.marker !== 1) return null
        }
      }

      /**
       * 否则，返回一个 List
       * Otherwise, return a ListDataNode
       */
      const { nextIndex, state: itemState } = itemEatingResult
      const { listType, marker, delimiter } = itemState as unknown as ListDataNodeChild
      const state: ListDataNodeMatchState = {
        type: ListDataNodeType,
        opening: true,
        parent: parentState,
        children: [itemState],
        listType,
        marker,
        delimiter,
        spread: false,
        isCurrentLineBlank: false,
        isLastLineBlank: false,
      }
      itemState.parent = state
      return { nextIndex, state, nextState: itemState }
    }
    return null
  }

  /**
   * override
   */
  public eatContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: ListDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, ListDataNodeMatchState> | null {
    // eslint-disable-next-line no-param-reassign
    state.isLastLineBlank = state.isCurrentLineBlank
    // eslint-disable-next-line no-param-reassign
    state.isCurrentLineBlank = eatingLineInfo.isBlankLine
    return { nextIndex: eatingLineInfo.startIndex, state }
  }

  /**
   * override
   */
  public match(
    state: ListDataNodeMatchState,
    children: BlockDataNodeMatchResult[],
  ): ListDataNodeMatchResult {
    return {
      type: state.type,
      listType: state.listType,
      marker: state.marker,
      delimiter: state.delimiter,
      spread: state.spread,
      children,
    }
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: ListDataNodeMatchResult,
    children?: BlockDataNode[],
  ): ListDataNode {
    return {
      type: matchResult.type,
      data: {
        listType: matchResult.listType,
        marker: matchResult.marker,
        delimiter: matchResult.delimiter,
        spread: matchResult.spread,
        children: children || [],
      }
    }
  }

  /**
   * override
   */
  public shouldAcceptChild(
    state: ListDataNodeMatchState,
    childState: BlockDataNodeMatchState,
  ): boolean {
    if (!this.recognizedSubTypes.includes(childState.type as T)) return false
    return true
  }

  /**
   * override
   */
  public beforeAcceptChild(state: ListDataNodeMatchState): void {
    /**
     * A list is loose if any of its constituent list items are separated by
     * blank lines, or if any of its constituent list items directly contain
     * two block-level elements with a blank line between them. Otherwise a list
     * is tight. (The difference in HTML output is that paragraphs in a loose
     * list are wrapped in <p> tags, while paragraphs in a tight list are not.)
     */
    if (state.isLastLineBlank) {
      if (state.children.length > 0) {
        // eslint-disable-next-line no-param-reassign
        state.spread = true
      }
    }
  }

  /**
   * override
   */
  beforeCloseMatchState?(state: ListDataNodeMatchState): void {
    if (!state.spread) {
      /**
       * These are loose lists, even though there is no space between the items,
       * because one of the items directly contains two block-level elements with
       * a blank line between them
       * @see https://github.github.com/gfm/#example-296
       */
      for (const c of state.children) {
        const currentChild = c as BlockDataNodeMatchState & ListDataNodeChild
        if (currentChild.spread) {
          // eslint-disable-next-line no-param-reassign
          state.spread = true
          break
        }
      }
    }
  }

  /**
   * 判断 currentChild 是否可以作为 state 的子节点
   * Determine whether currentChild can be a child of parentState
   */
  protected isValidListItemChild(
    parentState: ListDataNodeMatchState,
    currentChild: BlockDataNodeMatchState & ListDataNodeChild,
  ): boolean {
    const firstChild = parentState.children![0] as BlockDataNodeMatchState & ListDataNodeChild

    /**
     * A list is an ordered list if its constituent list items begin with ordered
     * list markers, and a bullet list if its constituent list items begin with
     * bullet list markers.
     */
    if (firstChild.listType !== currentChild.listType) return false

    /**
     * Two list items are of the same type if they begin with a list marker of
     * the same type. Two list markers are of the same type if
     *  (a) they are bullet list markers using the same character (-, +, or *) or
     *  (b) they are ordered list numbers with the same delimiter (either . or )).
     */
    switch (firstChild.listType) {
      case 'bullet':
        if (firstChild.marker !== currentChild.marker) return false
        break
      case 'ordered':
        if (firstChild.delimiter !== currentChild.delimiter) return false
        break
    }
    return true
  }
}
