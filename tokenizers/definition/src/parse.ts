import { DefinitionType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, calcEscapedStringFromNodePoints } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const label: string = token._label!
        const identifier: string = token._identifier!

        /**
         * Resolve link destination
         * @see https://github.github.com/gfm/#link-destination
         */
        const destinationPoints: INodePoint[] = token.destination!.nodePoints
        const destination: string =
          destinationPoints[0].codePoint === AsciiCodePoint.OPEN_ANGLE
            ? calcEscapedStringFromNodePoints(
                destinationPoints,
                1,
                destinationPoints.length - 1,
                true,
              )
            : calcEscapedStringFromNodePoints(destinationPoints, 0, destinationPoints.length, true)
        const url = api.formatUrl(destination)

        /**
         * Resolve link title
         * @see https://github.github.com/gfm/#link-title
         */
        const title: string | undefined =
          token.title == null
            ? undefined
            : calcEscapedStringFromNodePoints(
                token.title.nodePoints,
                1,
                token.title.nodePoints.length - 1,
              )

        const node: INode = api.shouldReservePosition
          ? { type: DefinitionType, position: token.position, identifier, label, url, title }
          : { type: DefinitionType, identifier, label, url, title }
        return node
      }),
  }
}
