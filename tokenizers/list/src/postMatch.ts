import type { IYastNodePosition } from '@yozora/ast'
import { ListItemType, ListType } from '@yozora/ast'
import type { IPostMatchBlockHookCreator, IYastBlockToken } from '@yozora/core-tokenizer'
import type { IHookContext, IListItemToken, IToken } from './types'

/**
 * A list is a sequence of one or more list items of the same type.
 * The list items may be separated by any number of blank lines.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export const postMatch: IPostMatchBlockHookCreator<IHookContext> = function (api) {
  const { name: _tokenizer } = this
  return { transformMatch }

  function transformMatch(tokens: ReadonlyArray<IYastBlockToken>): IYastBlockToken[] {
    const results: IYastBlockToken[] = []

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
     * to IPhrasingContent
     */
    let listItems: IListItemToken[] = []
    const resolveList = (): void => {
      if (listItems.length <= 0) return

      let spread = listItems.some((item): boolean => {
        if (item.children == null || item.children.length <= 1) return false

        let previousPosition: IYastNodePosition = item.children[0].position
        for (let j = 1; j < item.children.length; ++j) {
          const currentPosition: IYastNodePosition = item.children[j].position
          if (previousPosition.end.line + 1 < currentPosition.start.line) {
            return true
          }
          previousPosition = currentPosition
        }
        return false
      })

      if (!spread && listItems.length > 1) {
        let previousItem = listItems[0]
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

      const list: IToken & IYastBlockToken = {
        _tokenizer,
        nodeType: ListType,
        ordered: listItems[0].ordered,
        orderType: listItems[0].orderType,
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
          const lines = api.extractPhrasingLines(child)
          if (lines == null) return child

          const token = api.buildPhrasingContentToken(lines)
          return token ?? child
        })
      }
    }

    for (let i = 0; i < tokens.length; ++i) {
      const originalToken = tokens[i] as IListItemToken
      if (originalToken.nodeType !== ListItemType) {
        // It's not a list - item
        resolveList()
        listItems = []
        results.push(originalToken)
        continue
      }

      if (
        listItems.length <= 0 ||
        listItems[0].ordered !== originalToken.ordered ||
        listItems[0].orderType !== originalToken.orderType ||
        listItems[0].marker !== originalToken.marker
      ) {
        resolveList()
        listItems = [originalToken]
        continue
      }

      /**
       * Otherwise the current item should be a child of the originalToken,
       * and the originalToken should be removed from the
       * BlockTokenizerPostMatchPhaseStateTree
       */
      listItems.push(originalToken)
    }

    resolveList()
    return results
  }
}
