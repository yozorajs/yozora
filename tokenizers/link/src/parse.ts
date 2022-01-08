import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcEscapedStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import { encodeLinkDestination } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: (token, children) => {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

      // calc url
      let url = ''
      if (token.destinationContent != null) {
        let { startIndex, endIndex } = token.destinationContent
        if (nodePoints[startIndex].codePoint === AsciiCodePoint.OPEN_ANGLE) {
          startIndex += 1
          endIndex -= 1
        }
        const destination = calcEscapedStringFromNodePoints(nodePoints, startIndex, endIndex, true)
        url = encodeLinkDestination(destination)
      }

      // calc title
      let title: string | undefined
      if (token.titleContent != null) {
        const { startIndex, endIndex } = token.titleContent
        title = calcEscapedStringFromNodePoints(nodePoints, startIndex + 1, endIndex - 1)
      }

      const result: INode = {
        type: LinkType,
        url,
        title,
        children,
      }
      return result
    },
  }
}
