import type { Link, Text } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import type { INodeMarkup } from '@yozora/markup'
import { LinkWeaver as GfmLinkWeaver } from '@yozora/markup'

/** Links whose protocol text is recognized by GFM autolink extensions. */
export class LinkWeaver extends GfmLinkWeaver {
  public override weave(node: Link): INodeMarkup {
    const child = node.children.length === 1 ? node.children[0] : null
    if (
      node.title == null &&
      child?.type === TextType &&
      (child as Text).value === node.url &&
      /^(?:mailto|xmpp):/.test(node.url)
    ) {
      return { content: node.url }
    }
    return super.weave(node)
  }
}
