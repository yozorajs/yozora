import { EcmaImportType } from '@yozora/ast'
import type { IParseBlockHookCreator } from '@yozora/core-tokenizer'
import type { INode, IThis, IToken, T } from './types'

export const parse: IParseBlockHookCreator<T, IToken, INode, IThis> = function (api) {
  return {
    parse: tokens =>
      tokens.map(token => {
        const node: INode = api.shouldReservePosition
          ? {
              type: EcmaImportType,
              position: token.position,
              moduleName: token.moduleName,
              defaultImport: token.defaultImport,
              namedImports: token.namedImports,
            }
          : {
              type: EcmaImportType,
              moduleName: token.moduleName,
              defaultImport: token.defaultImport,
              namedImports: token.namedImports,
            }
        return node
      }),
  }
}
