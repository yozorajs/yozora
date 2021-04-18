import type {
  Definition,
  DefinitionMetaData,
  FootnoteDefinition,
  FootnoteDefinitionMetaData,
  Root,
  YastNodeType,
} from '@yozora/ast'
import { DefinitionType, FootnoteDefinitionType } from '@yozora/ast'
import { traverseAST } from './ast/traverse'

/**
 * Calc definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @returns
 */
export function calcDefinitions(
  root: Root,
  presetDefinitions: ReadonlyArray<DefinitionMetaData> = [],
  aimTypes: ReadonlyArray<YastNodeType> = [DefinitionType],
): Record<string, DefinitionMetaData> {
  const definitions: Record<string, DefinitionMetaData> = {}

  const add = (definition: DefinitionMetaData): void => {
    const { identifier } = definition

    /**
     * If there are several matching definitions, the first one takes precedence
     * @see https://github.github.com/gfm/#example-173
     */
    if (definitions[identifier] != null) return

    const { label, url, title } = definition
    definitions[identifier] = { identifier, label, url, title }
  }

  // Traverse Yozora AST and collect definitions.
  traverseAST(root, aimTypes, (node): void => {
    const definition = node as Definition
    add(definition)
  })

  // Add preset definitions at the end to avoid incorrectly overwriting custom
  // definitions defined in the Yozora AST.
  for (const definition of presetDefinitions) add(definition)

  return definitions
}

/**
 * Calc footnote definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @returns
 */
export function calcFootnoteDefinitions(
  root: Root,
  presetFootnoteDefinitions: ReadonlyArray<FootnoteDefinitionMetaData> = [],
  aimTypes: ReadonlyArray<YastNodeType> = [FootnoteDefinitionType],
): Record<string, FootnoteDefinitionMetaData> {
  const footnoteDefinitions: Record<string, FootnoteDefinitionMetaData> = {}

  const add = (footnoteDefinition: FootnoteDefinitionMetaData): void => {
    const { identifier } = footnoteDefinition

    /**
     * If there are several matching definitions, the first one takes precedence
     * @see https://github.github.com/gfm/#example-173
     */
    if (footnoteDefinitions[identifier] != null) return

    const { label } = footnoteDefinition
    footnoteDefinitions[identifier] = { identifier, label }
  }

  // Traverse Yozora AST and collect definitions.
  traverseAST(root, aimTypes, (node): void => {
    const definition = node as FootnoteDefinition
    add(definition)
  })

  // Add preset definitions at the end to avoid incorrectly overwriting custom
  // definitions defined in the Yozora AST.
  for (const definition of presetFootnoteDefinitions) add(definition)

  return footnoteDefinitions
}
