import type {
  Definition,
  Root,
  YastAssociation,
  YastNodeType,
} from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { collectNodes } from './ast/collect'
import { traverseAST } from './ast/traverse'

/**
 * Calc definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @returns
 */
export function calcIdentifierMap(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType>,
  presetIdentifiers: ReadonlyArray<Readonly<YastAssociation>> = [],
): Record<string, true> {
  const identifierMap: Record<string, true> = {}

  // Traverse Yozora AST and collect identifier of definitions.
  traverseAST(root, aimTypes, node => {
    const definition = (node as unknown) as YastAssociation
    identifierMap[definition.identifier] = true
  })

  // Collect from preset definitions.
  for (const { identifier } of presetIdentifiers) {
    identifierMap[identifier] = true
  }

  return identifierMap
}

/**
 * Collect link reference definitions in a pre-order traversal.
 * @param root
 * @param aimTypes
 * @returns
 */
export function collectDefinitions(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType> = [DefinitionType],
): Definition[] {
  const results: Definition[] = collectNodes(root, aimTypes)
  const identifierMap: Record<string, true> = {}

  // filter duplicated footnote reference definitions with existed identifer.
  const deDuplicatedResults: Definition[] = results.filter(item => {
    const { identifier } = item
    if (identifierMap[identifier]) return false
    identifierMap[identifier] = true
    return true
  })

  return deDuplicatedResults
}

/**
 * Traverse yozora ast and generate a link reference definition map.
 * @param root
 * @param aimTypes
 * @param presetDefinitions
 * @returns
 */
export function calcDefinitionMap(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType> = [DefinitionType],
  presetDefinitions: ReadonlyArray<Definition> = [],
): Record<string, Readonly<Definition>> {
  const definitionMap: Record<string, Readonly<Definition>> = {}

  // Traverse Yozora AST and collect definitions.
  traverseAST(root, aimTypes, (node): void => {
    const definition = node as Definition
    const { identifier } = definition

    /**
     * If there are several matching definitions, the first one takes precedence
     * @see https://github.github.com/gfm/#example-173
     */
    if (definitionMap[identifier] != null) return
    definitionMap[identifier] = definition
  })

  /**
   * Add preset link reference definitions at the end to avoid incorrectly
   * overwriting custom defined link reference definitions, and append the
   * preset link reference  definitions to the end of the root.children
   */
  for (const definition of presetDefinitions) {
    if (definitionMap[definition.identifier] != null) continue
    definitionMap[definition.identifier] = definition
    root.children.push(definition)
  }

  return definitionMap
}
