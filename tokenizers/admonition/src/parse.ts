import type { IYastNode } from '@yozora/ast'
import { AdmonitionType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints, isUnicodeWhitespaceCharacter } from '@yozora/character'
import type { IParseBlockHookCreator, IPhrasingContentLine } from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: (token, children) => {
      const infoString = token.infoString

      // Match an admonition keyword.
      let i = 0
      const keyword: INodePoint[] = []
      for (; i < infoString.length; ++i) {
        const p = infoString[i]
        if (isUnicodeWhitespaceCharacter(p.codePoint)) break
        keyword.push(p)
      }

      i = eatOptionalWhitespaces(infoString, i, infoString.length)
      const title: IYastNode[] = ((): IYastNode[] => {
        if (i >= infoString.length) return []
        const titleLines: IPhrasingContentLine[] = [
          {
            nodePoints: infoString,
            startIndex: i,
            endIndex: infoString.length,
            firstNonWhitespaceIndex: i,
            countOfPrecedeSpaces: 0,
          },
        ]
        const phrasingContent = api.buildPhrasingContent(titleLines)
        if (phrasingContent == null) return []
        return api.parsePhrasingContent(phrasingContent)
      })()

      const node: INode = {
        type: AdmonitionType,
        keyword: calcEscapedStringFromNodePoints(keyword, 0, keyword.length, true),
        title,
        children,
      }
      return node
    },
  }
}
