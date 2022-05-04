import type { List, ListItem, Node } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

const LOWERCASE_A: number = 'a'.codePointAt(0)!
const UPPERCASE_A: number = 'A'.codePointAt(0)!

/**
 * ListItem represents an item in a List.
 *
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 * @see https://github.github.com/gfm/#task-list-items-extension-
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#listItem
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/list
 */
export class ListItemMarkupWeaver implements INodeMarkupWeaver<ListItem> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = true

  public weave(node: ListItem, parent: Node, childIndex: number): INodeMarkup | string {
    const { ordered, marker } = parent as List
    let opener: string = marker + ' '
    let indent = '  '

    if (ordered) {
      const { orderType = '1', start = 1, marker } = parent as List
      const order: number = Math.max(0, start + childIndex - 1)
      switch (orderType) {
        case '1':
          opener = String(childIndex + 1)
          break
        case 'a':
          opener = String.fromCodePoint(LOWERCASE_A + Math.min(order, 25))
          break
        case 'A':
          opener = String.fromCodePoint(UPPERCASE_A + Math.min(order, 25))
          break
        case 'i':
        case 'I':
        default:
          opener = orderType
      }
      opener += marker + ' '
      indent = ' '.repeat(opener.length)
    }

    if (node.status) {
      switch (node.status) {
        case 'todo':
          opener += '[ ] '
          break
        case 'doing':
          opener += '[-] '
          break
        case 'done':
          opener += '[x] '
      }
    }

    return { opener, indent }
  }
}
