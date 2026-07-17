import type { Node } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { calcTrimBoundaryOfCodePoints } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import { mergeAndStripContentLines } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens => {
      const results: INode[] = []
      for (const token of tokens) {
        // Resolve phrasing content.
        let children: Node[]
        if (token.lines.length === 1) {
          const { nodePoints, firstNonWhitespaceIndex, endIndex } = token.lines[0]
          const [, contentEndIndex] = calcTrimBoundaryOfCodePoints(
            nodePoints,
            firstNonWhitespaceIndex,
            endIndex,
          )
          children = api.processInlines(nodePoints, firstNonWhitespaceIndex, contentEndIndex)
        } else {
          const contents: INodePoint[] = mergeAndStripContentLines(token.lines)
          children = api.processInlines(contents)
        }

        if (children.length <= 0) continue

        const node: INode = api.shouldReservePosition
          ? { type: ParagraphType, position: token.position, children }
          : { type: ParagraphType, children }
        results.push(node)
      }
      return results
    },
  }
}
