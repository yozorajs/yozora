import { EcmaImportType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { IHookContext, INode, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IHookContext> = function () {
  return {
    parse: tokens =>
      tokens.map(token => {
        const node: INode = {
          type: EcmaImportType,
          position: token.position,
          moduleName: token.moduleName,
          defaultImport: token.defaultImport,
          namedImports: token.namedImports,
        }
        return node
      }),
  }
}
