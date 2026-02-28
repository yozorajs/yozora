import type { Node } from '@yozora/ast'
import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcEscapedStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const nodePoints: readonly INodePoint[] = api.getNodePoints()

        // calc url
        let url = ''
        if (token.destinationContent != null) {
          let { startIndex, endIndex } = token.destinationContent
          if (nodePoints[startIndex].codePoint === AsciiCodePoint.OPEN_ANGLE) {
            startIndex += 1
            endIndex -= 1
          }
          const destination = calcEscapedStringFromNodePoints(
            nodePoints,
            startIndex,
            endIndex,
            true,
          )
          url = api.formatUrl(destination)
        }

        // calc title
        let title: string | undefined
        if (token.titleContent != null) {
          const { startIndex, endIndex } = token.titleContent
          title = calcEscapedStringFromNodePoints(nodePoints, startIndex + 1, endIndex - 1)
        }

        const children: Node[] = api.parseInlineTokens(token.children)
        const node: INode = api.shouldReservePosition
          ? { type: LinkType, position: api.calcPosition(token), url, title, children }
          : { type: LinkType, url, title, children }
        return node
      }),
  }
}
