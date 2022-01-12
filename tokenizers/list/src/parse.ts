import type { IYastNode, IYastNodePosition, ListItem, Paragraph } from '@yozora/ast'
import { ListItemType, ListType, ParagraphType } from '@yozora/ast'
import type { IParseBlockHookCreator, IParseBlockPhaseApi } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens => {
      const results: INode[] = []
      let listItemTokens: IToken[] = []
      for (let i = 0; i < tokens.length; ++i) {
        const originalToken = tokens[i]
        if (
          listItemTokens.length <= 0 ||
          listItemTokens[0].ordered !== originalToken.ordered ||
          listItemTokens[0].orderType !== originalToken.orderType ||
          listItemTokens[0].marker !== originalToken.marker
        ) {
          const node: INode | null = resolveList(listItemTokens, api)
          if (node) results.push(node)

          listItemTokens = [originalToken]
          continue
        }

        /**
         * Otherwise the current item should be a child of the originalToken,
         * and the originalToken should be removed from the
         * BlockTokenizerPostMatchPhaseStateTree
         */
        listItemTokens.push(originalToken)
      }

      const node: INode | null = resolveList(listItemTokens, api)
      if (node) results.push(node)
      return results
    },
  }
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
 * to Phrasing content
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
const resolveList = (tokens: IToken[], api: IParseBlockPhaseApi): INode | null => {
  if (tokens.length <= 0) return null

  let spread = tokens.some((item): boolean => {
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

  if (!spread && tokens.length > 1) {
    let previousItem = tokens[0]
    for (let i = 1; i < tokens.length; ++i) {
      const currentItem = tokens[i]

      // If there exists blank line between list items, then the list is loose.
      if (previousItem.position.end.line + 1 < currentItem.position.start.line) {
        spread = true
        break
      }

      previousItem = currentItem
    }
  }

  const children: ListItem[] = tokens.map((listItemToken): ListItem => {
    // Make list tighter if spread is false.
    const nodes: IYastNode[] = api.parseBlockTokens(listItemToken.children)
    const children: IYastNode[] = spread
      ? nodes
      : nodes
          .map(node => (node.type === ParagraphType ? (node as Paragraph).children : node))
          .flat()

    const listItem: ListItem = api.shouldReservePosition
      ? {
          type: ListItemType,
          position: listItemToken.position,
          status: listItemToken.status,
          children,
        }
      : { type: ListItemType, status: listItemToken.status, children }
    return listItem
  })

  const node: INode = api.shouldReservePosition
    ? {
        type: ListType,
        position: {
          start: { ...tokens[0].position.start },
          end: { ...tokens[tokens.length - 1].position.end },
        },
        ordered: tokens[0].ordered,
        orderType: tokens[0].orderType,
        start: tokens[0].order,
        marker: tokens[0].marker,
        spread,
        children,
      }
    : {
        type: ListType,
        ordered: tokens[0].ordered,
        orderType: tokens[0].orderType,
        start: tokens[0].order,
        marker: tokens[0].marker,
        spread,
        children,
      }
  return node
}
