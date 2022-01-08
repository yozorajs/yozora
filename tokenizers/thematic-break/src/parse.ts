import { ThematicBreakType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function () {
  return {
    parse: tokens =>
      tokens.map(token => ({
        type: ThematicBreakType,
        position: token.position,
      })),
  }
}
