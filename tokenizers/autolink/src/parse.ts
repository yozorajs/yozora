import type { Node } from '@yozora/ast'
import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

        // Backslash-escapes do not work inside autolink.
        let url = calcStringFromNodePoints(nodePoints, token.startIndex + 1, token.endIndex - 1)

        // Add 'mailto:' prefix to email address type autolink.
        if (token.contentType === 'email') {
          url = 'mailto:' + url
        }

        const encodedUrl: string = api.formatUrl(url)
        const children: Node[] = api.parseInlineTokens(token.children)
        const node: INode = api.shouldReservePosition
          ? { type: LinkType, position: api.calcPosition(token), url: encodedUrl, children }
          : { type: LinkType, url: encodedUrl, children }
        return node
      }),
  }
}
