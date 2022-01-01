import type { IDefinition, IRoot, IYastAssociation, YastNodeType } from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { collectNodes } from './ast/collect'
import { traverseAst } from './ast/traverse'
import type { INodeMatcher } from './ast/util'

/**
 * Collect link reference definitions in a pre-order traversal.
 * @param root
 * @param aimTypesOrNodeMatcher
 * @returns
 */
export const collectDefinitions = (
  root: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher = [DefinitionType],
): IDefinition[] => {
  const results: IDefinition[] = collectNodes(root, aimTypesOrNodeMatcher)

  // filter duplicated footnote reference definitions with existed identifier.
  const existedSet: Set<string> = new Set<string>()
  return results.filter(item => {
    if (existedSet.has(item.identifier)) return false
    existedSet.add(item.identifier)
    return true
  })
}

/**
 * Calc definition identifier set from Yozora AST.
 * @param root
 * @param aimTypesOrNodeMatcher
 * @param presetIdentifiers
 * @returns
 */
export const calcIdentifierSet = (
  root: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher,
  presetIdentifiers: ReadonlyArray<Readonly<IYastAssociation>> = [],
): Set<string> => {
  const identifierSet: Set<string> = new Set<string>()

  // Traverse Yozora AST and collect identifier of definitions.
  traverseAst(root, aimTypesOrNodeMatcher, node => {
    const definition = node as IDefinition
    identifierSet.add(definition.identifier)
  })

  for (const definition of presetIdentifiers) {
    identifierSet.add(definition.identifier)
  }
  return identifierSet
}

/**
 * Traverse yozora ast and generate a link reference definition map.
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param presetDefinitions
 * @returns
 */
export const calcDefinitionMap = (
  immutableRoot: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher = [DefinitionType],
  presetDefinitions: ReadonlyArray<IDefinition> = [],
): {
  root: Readonly<IRoot>
  definitionMap: Record<string, Readonly<IDefinition>>
} => {
  const definitionMap: Record<string, Readonly<IDefinition>> = {}

  // Traverse Yozora AST and collect definitions.
  traverseAst(immutableRoot, aimTypesOrNodeMatcher, (node): void => {
    const definition = node as IDefinition
    const { identifier } = definition

    /**
     * If there are several matching definitions, the first one takes precedence
     * @see https://github.github.com/gfm/#example-173
     */
    if (definitionMap[identifier] === undefined) {
      definitionMap[identifier] = definition
    }
  })

  /**
   * Add preset link reference definitions at the end to avoid incorrectly
   * overwriting custom defined link reference definitions, and append the
   * preset link reference  definitions to the end of the root.children
   */
  const additionalDefinitions: IDefinition[] = []
  for (const definition of presetDefinitions) {
    if (definitionMap[definition.identifier] === undefined) {
      definitionMap[definition.identifier] = definition
      additionalDefinitions.push(definition)
    }
  }

  const root: IRoot =
    additionalDefinitions.length > 0
      ? {
          ...immutableRoot,
          children: immutableRoot.children.concat(additionalDefinitions),
        }
      : immutableRoot
  return { root, definitionMap }
}
