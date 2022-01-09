import type { IYastNode } from '@yozora/ast'
import { AdmonitionType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcEscapedStringFromNodePoints, isUnicodeWhitespaceCharacter } from '@yozora/character'
import type { IParseBlockHookCreator, IPhrasingContentLine } from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces, mergeAndStripContentLines } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const infoString = token.infoString

        // Match an admonition keyword.
        let i = 0
        const keywordNodePoints: INodePoint[] = []
        for (; i < infoString.length; ++i) {
          const p = infoString[i]
          if (isUnicodeWhitespaceCharacter(p.codePoint)) break
          keywordNodePoints.push(p)
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
          const contents: INodePoint[] = mergeAndStripContentLines(titleLines)
          return api.processInlines(contents)
        })()

        const keyword: string = calcEscapedStringFromNodePoints(
          keywordNodePoints,
          0,
          keywordNodePoints.length,
          true,
        )
        const children: IYastNode[] = api.parseBlockTokens(token.children)

        const node: INode = api.shouldReservePosition
          ? { type: AdmonitionType, position: token.position, keyword, title, children }
          : { type: AdmonitionType, keyword, title, children }
        return node
      }),
  }
}
