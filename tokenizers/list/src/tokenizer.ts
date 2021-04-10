import type { ListItem, YastNode, YastNodePosition } from '@yozora/ast'
import { ListType } from '@yozora/ast'
import type {
  ResultOfParse,
  Tokenizer,
  TokenizerParseBlockHook,
  TokenizerPostMatchBlockHook,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import { BaseTokenizer } from '@yozora/core-tokenizer'
import type { ListItemToken, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'

/**
 * Params for constructing ListTokenizer
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ListTokenizerProps {}

/**
 * Lexical Analyzer for List.
 *
 * A list is a sequence of one or more list items of the same type.
 * The list items may be separated by any number of blank lines.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export class ListTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerPostMatchBlockHook,
    TokenizerParseBlockHook<T, Token, Node> {
  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: uniqueName,
      priority: props.priority,
    })
  }

  /**
   * @override
   * @see TokenizerPostMatchBlockHook
   */
  public transformMatch(
    tokens: ReadonlyArray<YastBlockToken>,
  ): YastBlockToken[] {
    const context = this.getContext()
    if (context == null) return []
    const results: YastBlockToken[] = []

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
    let listItems: ListItemToken[] = []
    const resolveList = (): void => {
      if (listItems.length <= 0) return

      let spread = listItems.some((item): boolean => {
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
        let previousItem = listItems[0]
        for (let i = 1; i < listItems.length; ++i) {
          const currentItem = listItems[i]

          // If there exists blank line between list items, then the list is loose.
          if (
            previousItem.position.end.line + 1 <
            currentItem.position.start.line
          ) {
            spread = true
            break
          }

          previousItem = currentItem
        }
      }

      const list: Token & YastBlockToken = {
        _tokenizer: this.name,
        nodeType: ListType,
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

          const phrasingContentState = context.buildPhrasingContentToken(lines)
          return phrasingContentState == null ? child : phrasingContentState
        })
      }
    }

    for (let i = 0; i < tokens.length; ++i) {
      const originalToken = tokens[i] as ListItemToken
      if (originalToken.listType == null) {
        resolveList()
        listItems = []
        results.push(originalToken)
        continue
      }

      /**
       * If originalToken is null or not a ListItemPostMatchPhaseState
       * or its listType is inconsistent to the originalToken.listType or
       * its marker is inconsistent to the originalToken.marker,
       * then create a new list
       */
      if (
        listItems.length <= 0 ||
        listItems[0].listType !== originalToken.listType ||
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

  /**
   * @override
   * @see TokenizerParseBlockHook
   */
  public parseBlock(
    token: Readonly<Token>,
    children?: YastNode[],
  ): ResultOfParse<T, Node> {
    const node: Node = {
      type: ListType,
      ordered: token.listType === 'ordered',
      start: token.start,
      marker: token.marker,
      spread: token.spread,
      children: (children || []) as ListItem[],
    }
    return node
  }
}
