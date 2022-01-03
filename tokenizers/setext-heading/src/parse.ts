import type { IHeading } from '@yozora/ast'
import { HeadingType } from '@yozora/ast'
import { AsciiCodePoint } from '@yozora/character'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function (api) {
  return {
    parse: token => {
      let depth: IHeading['depth'] = 1
      switch (token.marker) {
        /**
         * The heading is a level 1 heading if '=' characters are used
         */
        case AsciiCodePoint.EQUALS_SIGN:
          depth = 1
          break
        /**
         * The heading is a level 2 heading if '-' characters are used
         */
        case AsciiCodePoint.MINUS_SIGN:
          depth = 2
          break
      }

      // Resolve phrasing content.
      const phrasingContent = api.buildPhrasingContent(token.lines)

      const node: INode = {
        type: HeadingType,
        depth,
        children: phrasingContent == null ? [] : [phrasingContent],
      }
      return node
    },
  }
}
