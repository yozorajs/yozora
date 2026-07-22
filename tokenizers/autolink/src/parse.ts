import type { Text } from '@yozora/ast'
import { LinkType, TextType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: readonly INodePoint[] = api.getNodePoints()
        const startIndex: number = token.startIndex + 1
        const endIndex: number = token.endIndex - 1

        // Backslash-escapes do not work inside autolinks.
        const value = calcStringFromNodePoints(nodePoints, startIndex, endIndex)
        let url = value

        // Add 'mailto:' prefix to email address type autolink.
        if (token.contentType === 'email') {
          url = 'mailto:' + url
        }

        const encodedUrl: string = api.formatUrl(url)
        const text: Text = api.shouldReservePosition
          ? { type: TextType, position: api.calcPosition({ startIndex, endIndex }), value }
          : { type: TextType, value }
        const node: INode = api.shouldReservePosition
          ? { type: LinkType, position: api.calcPosition(token), url: encodedUrl, children: [text] }
          : { type: LinkType, url: encodedUrl, children: [text] }
        return node
      }),
  }
}
