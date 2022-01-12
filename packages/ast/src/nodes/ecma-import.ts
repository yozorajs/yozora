import type { IYastNode } from '../ast'

export const EcmaImportType = 'ecmaImport'
export type EcmaImportType = typeof EcmaImportType

/**
 * ECMAScript import statement (single-line).
 *
 * For example, the following ECMAScript import statements are supported:
 *
 *    ```typescript
 *    import '@yozora/parser'
 *    import Parser from '@yozora/parser'
 *    import Parser, { YozoraParserProps } from '@yozora/parser'
 *    import { YozoraParserProps } from '@yozora/parser'
 *    import { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 *    ```
 * But these are not supported case:
 *
 *    ```typescript
 *    import * as Parser '@yozora/parser'
 *    import {
 *      Parser
 *    } from '@yozora/parser'
 *    ```
 */
export interface EcmaImport extends IYastNode<EcmaImportType> {
  /**
   * import Parser from '@yozora/parser'
   * ==> { moduleName: '@yozora/parser' }
   */
  moduleName: string
  /**
   * import Parser, { YozoraParserProps } from '@yozora/parser'
   * ==> { defaultImport: 'Parser' }
   */
  defaultImport: string | null
  /**
   * import { YozoraParserProps, YozoraParser as Parser } from '@yozora/parser'
   * ==>  {
   *        namedImports: [
   *          { src: 'YozoraParserProps', alias: null },
   *          { src: 'YozoraParser', alias: 'Parser' },
   *        ]
   *      }
   */
  namedImports: IEcmaImportNamedImport[]
}

/**
 *
 * import { YozoraParserProps, YozoraParser as Parser } from '@yozora/parser'
 * ==>  [
 *        { src: 'YozoraParserProps', alias: null },
 *        { src: 'YozoraParser', alias: 'Parser' },
 *      ]
 */
export interface IEcmaImportNamedImport {
  /**
   *
   */
  src: string
  /**
   *
   */
  alias: string | null
}
