import type {
  Definition,
  Root,
  YastAssociation,
  YastNodeType,
} from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { traverseAST } from './ast/traverse'

/**
 * Calc definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @returns
 */
export function collectIdentifiers(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType>,
  presetDefinitions: ReadonlyArray<Readonly<YastAssociation>> = [],
): Record<string, true> {
  const identifiers: Record<string, true> = {}

  // Traverse Yozora AST and collect identifier of definitions.
  traverseAST(root, aimTypes, (node): void => {
    const definition = (node as unknown) as YastAssociation
    identifiers[definition.identifier] = true
  })

  // Collect from preset definitions.
  for (const definition of presetDefinitions) {
    identifiers[definition.identifier] = true
  }

  return identifiers
}

/**
 * Calc definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @returns
 */
export function collectDefinitions(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType> = [DefinitionType],
  presetDefinitions: ReadonlyArray<Readonly<Omit<Definition, 'type'>>> = [],
): Record<string, Readonly<Definition>> {
  const definitions: Record<string, Readonly<Definition>> = {}
  const add = (definition: Readonly<Definition>): void => {
    const { identifier } = definition

    /**
     * If there are several matching definitions, the first one takes precedence
     * @see https://github.github.com/gfm/#example-173
     */
    if (definitions[identifier] != null) return
    definitions[identifier] = definition
  }

  // Traverse Yozora AST and collect definitions.
  traverseAST(root, aimTypes, (node): void => {
    const definition = node as Definition
    add(definition)
  })

  // Add preset definitions at the end to avoid incorrectly overwriting custom
  // definitions defined in the Yozora AST.
  for (const definition of presetDefinitions) {
    add({ type: DefinitionType, ...definition })
  }

  return definitions
}
