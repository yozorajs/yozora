import { LinkType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import { encodeLinkDestination } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: (token, children) => {
      const nodePoints: ReadonlyArray<INodePoint> = api.getNodePoints()

      // Backslash-escapes do not work inside autolink.
      let url = calcStringFromNodePoints(nodePoints, token.startIndex + 1, token.endIndex - 1)

      // Add 'mailto:' prefix to email address type autolink.
      if (token.contentType === 'email') {
        url = 'mailto:' + url
      }

      const encodedUrl = encodeLinkDestination(url)
      const result: INode = {
        type: LinkType,
        url: encodedUrl,
        children,
      }
      return result
    },
  }
}
