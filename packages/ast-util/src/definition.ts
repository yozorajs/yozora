import type { Definition, DefinitionMap, Root, YastNodeType } from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { traverseAST } from './traverse'

/**
 * Calc definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @returns
 */
export function calcDefinitions(
  root: Root,
  aimTypes: ReadonlyArray<YastNodeType> = [DefinitionType],
): DefinitionMap {
  const definitions: DefinitionMap = {}

  traverseAST(
    root,
    node => {
      const definition = node as Definition
      const { identifier } = definition

      /**
       * If there are several matching definitions, the first one takes precedence
       * @see https://github.github.com/gfm/#example-173
       */
      if (definitions[identifier] != null) return

      const { label, url, title } = definition
      definitions[identifier] = { identifier, label, url, title }
    },
    aimTypes,
  )

  return definitions
}
