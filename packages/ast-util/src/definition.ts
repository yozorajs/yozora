import type {
  IDefinition,
  IRoot,
  IYastAssociation,
  YastNodeType,
} from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { collectNodes } from './ast/collect'
import { traverseAst } from './ast/traverse'
import type { NodeMatcher } from './ast/util'

/**
 * Calc definition map from Yozora AST.
 * @param root
 * @param aimTypesOrNodeMatcher
 * @param presetIdentifiers
 * @returns
 */
export function calcIdentifierMap(
  root: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher,
  presetIdentifiers: ReadonlyArray<Readonly<IYastAssociation>> = [],
): Record<string, true> {
  const identifierMap: Record<string, true> = {}

  // Traverse Yozora AST and collect identifier of definitions.
  traverseAst(root, aimTypesOrNodeMatcher, node => {
    const definition = node as unknown as IYastAssociation
    identifierMap[definition.identifier] = true
  })

  mergePresetIdentifiers(identifierMap, presetIdentifiers)
  return identifierMap
}

/**
 * Merge preset identifiers.
 * @param identifierMap
 * @param presetIdentifiers
 */
export function mergePresetIdentifiers(
  identifierMap: Record<string, true>,
  presetIdentifiers: ReadonlyArray<Readonly<IYastAssociation>>,
): void {
  for (const { identifier } of presetIdentifiers) {
    // eslint-disable-next-line no-param-reassign
    identifierMap[identifier] = true
  }
}

/**
 * Collect link reference definitions in a pre-order traversal.
 * @param root
 * @param aimTypesOrNodeMatcher
 * @returns
 */
export function collectDefinitions(
  root: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher = [
    DefinitionType,
  ],
): IDefinition[] {
  const results: IDefinition[] = collectNodes(root, aimTypesOrNodeMatcher)
  const identifierMap: Record<string, true> = {}

  // filter duplicated footnote reference definitions with existed identifer.
  const deDuplicatedResults: IDefinition[] = results.filter(item => {
    const { identifier } = item
    if (identifierMap[identifier]) return false
    identifierMap[identifier] = true
    return true
  })

  return deDuplicatedResults
}

/**
 * Traverse yozora ast and generate a link reference definition map.
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param presetDefinitions
 * @returns
 */
export function calcDefinitionMap(
  immutableRoot: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher = [
    DefinitionType,
  ],
  presetDefinitions: ReadonlyArray<IDefinition> = [],
): {
  root: Readonly<IRoot>
  definitionMap: Record<string, Readonly<IDefinition>>
} {
  const definitionMap: Record<string, Readonly<IDefinition>> = {}

  // Traverse Yozora AST and collect definitions.
  traverseAst(immutableRoot, aimTypesOrNodeMatcher, (node): void => {
    const definition = node as IDefinition
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
  const additionalDefinitions: IDefinition[] = []
  for (const definition of presetDefinitions) {
    if (definitionMap[definition.identifier] != null) continue
    definitionMap[definition.identifier] = definition
    additionalDefinitions.push(definition)
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
