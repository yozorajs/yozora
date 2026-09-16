import type { Node } from '../ast'

export const EcmaImportType = 'ecmaImport'
export type EcmaImportType = typeof EcmaImportType

/**
 * ECMAScript import statement (single-line).
 *
 * For example, the following ECMAScript import statements are supported:
 *
 *    ```typescript
 *    import '@yozora/parser-yozora'
 *    import Parser from '@yozora/parser-yozora'
 *    import Parser, { YozoraParserProps } from '@yozora/parser-yozora'
 *    import { YozoraParserProps } from '@yozora/parser-yozora'
 *    import { YozoraParser, YozoraParser as Parser } from '@yozora/parser-yozora'
 *    ```
 * But these are not supported case:
 *
 *    ```typescript
 *    import * as Parser '@yozora/parser-yozora'
 *    import {
 *      Parser
 *    } from '@yozora/parser-yozora'
 *    ```
 */
export interface EcmaImport extends Node<EcmaImportType> {
  /**
   * import Parser from '@yozora/parser-yozora'
   * ==> { moduleName: '@yozora/parser-yozora' }
   */
  moduleName: string
  /**
   * import Parser, { YozoraParserProps } from '@yozora/parser-yozora'
   * ==> { defaultImport: 'Parser' }
   */
  defaultImport: string | null
  /**
   * import { YozoraParserProps, YozoraParser as Parser } from '@yozora/parser-yozora'
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
 * import { YozoraParserProps, YozoraParser as Parser } from '@yozora/parser-yozora'
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
