import { BreakType } from '@yozora/ast'
import type { IParseInlineHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseInlineHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        if (!api.shouldReservePosition) return { type: BreakType }

        const markerPosition = api.calcPosition({
          startIndex: token.startIndex,
          endIndex: token.endIndex - 1,
        })
        const nextPoint = api.getNodePoints()[token.endIndex]
        const node: INode = {
          type: BreakType,
          position: {
            start: markerPosition.start,
            // Hard breaks cannot end a block, so parser-produced tokens have a
            // following point that retains the exact LF / CRLF source offset.
            end:
              nextPoint == null
                ? markerPosition.end
                : {
                    line: nextPoint.line,
                    column: 1,
                    offset: nextPoint.offset - nextPoint.column + 1,
                  },
          },
        }
        return node
      }),
  }
}
