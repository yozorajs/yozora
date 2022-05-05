import { CodeType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import {
  calcEscapedStringFromNodePoints,
  calcStringFromNodePoints,
  isUnicodeWhitespaceCharacter,
} from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import { eatOptionalWhitespaces, mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const infoString = token.infoString

        // match lang
        let i = 0
        const langInfo: INodePoint[] = []
        for (; i < infoString.length; ++i) {
          const p = infoString[i]
          if (isUnicodeWhitespaceCharacter(p.codePoint)) break
          langInfo.push(p)
        }

        // match meta
        i = eatOptionalWhitespaces(infoString, i, infoString.length)
        const contents: INodePoint[] = mergeContentLinesFaithfully(token.lines)

        const lang: string = calcEscapedStringFromNodePoints(langInfo, 0, langInfo.length, true)
        const meta: string = calcEscapedStringFromNodePoints(infoString, i, infoString.length, true)

        /**
         * Backslash escape works in info strings in fenced code blocks.
         * @see https://github.github.com/gfm/#example-320
         */
        const node: INode = api.shouldReservePosition
          ? {
              type: CodeType,
              position: token.position,
              lang: lang.length > 0 ? lang : null,
              meta: meta.length > 0 ? meta : null,
              value: calcStringFromNodePoints(contents),
            }
          : {
              type: CodeType,
              lang: lang.length > 0 ? lang : null,
              meta: meta.length > 0 ? meta : null,
              value: calcStringFromNodePoints(contents),
            }
        return node
      }),
  }
}
