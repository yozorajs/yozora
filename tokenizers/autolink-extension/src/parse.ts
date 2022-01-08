import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: (token, children) => {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

      // Backslash-escapes do not work inside autolink.
      let url = calcStringFromNodePoints(nodePoints, token.startIndex, token.endIndex)

      switch (token.contentType) {
        // Add 'mailto:' prefix to email address type autolink.
        case 'email':
          url = 'mailto:' + url
          break
        // Add 'http://' prefix to email address type autolink.
        case 'uri-www':
          url = 'http://' + url
          break
      }

      const result: INode = {
        type: LinkType,
        url,
        children,
      }
      return result
    },
  }
}
