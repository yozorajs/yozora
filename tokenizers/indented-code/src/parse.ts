import { CodeType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcStringFromNodePoints } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import { mergeContentLinesFaithfully } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        /**
         * Blank lines preceding or following an indented code block
         * are not included in it
         * @see https://github.github.com/gfm/#example-87
         */
        const { lines } = token
        let startLineIndex = 0,
          endLineIndex = lines.length
        for (; startLineIndex < endLineIndex; ++startLineIndex) {
          const line = lines[startLineIndex]
          if (line.firstNonWhitespaceIndex < line.endIndex) break
        }
        for (; startLineIndex < endLineIndex; --endLineIndex) {
          const line = lines[endLineIndex - 1]
          if (line.firstNonWhitespaceIndex < line.endIndex) break
        }

        const contents: INodePoint[] = mergeContentLinesFaithfully(
          lines,
          startLineIndex,
          endLineIndex,
        )

        let value: string = calcStringFromNodePoints(contents)
        if (!/\n$/.test(value)) value += '\n'
        const node: INode = api.shouldReservePosition
          ? {
              type: CodeType,
              position: token.position,
              lang: null,
              meta: null,
              value,
            }
          : {
              type: CodeType,
              lang: null,
              meta: null,
              value,
            }
        return node
      }),
  }
}
