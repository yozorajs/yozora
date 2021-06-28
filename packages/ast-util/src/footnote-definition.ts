import type {
  Footnote,
  FootnoteDefinition,
  FootnoteReference,
  Paragraph,
  Root,
  YastNodeType,
} from '@yozora/ast'
import {
  FootnoteDefinitionType,
  FootnoteReferenceType,
  FootnoteType,
  ParagraphType,
} from '@yozora/ast'
import { collectNodes } from './ast/collect'
import { replaceAST } from './ast/replace'
import { traverseAST } from './ast/traverse'

/**
 * Collect footnote reference definitions in a pre-order traversal.
 * @param root
 * @param aimTypes
 * @returns
 */
export function collectFootnoteDefinitions(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType> = [FootnoteDefinitionType],
): FootnoteDefinition[] {
  const results: FootnoteDefinition[] = collectNodes(root, aimTypes)
  const identifierMap: Record<string, true> = {}

  // filter duplicated footnote reference definitions with existed identifer.
  const deDuplicatedResults: FootnoteDefinition[] = results.filter(item => {
    const { identifier } = item
    if (identifierMap[identifier]) return false
    identifierMap[identifier] = true
    return true
  })

  return deDuplicatedResults
}

/**
 * Traverse yozora ast and generate a footnote reference definition map.
 *
 * Note that if `presetFootnoteDefinitions` or `preferReference` specified,
 * the input AST root may be modified.
 *
 * The `identifierPrefix` only works with `preferReferences=true`.
 *
 * @param root
 * @param aimTypes
 * @param presetFootnoteDefinitions
 * @param preferReferences
 * @param identifierPrefix
 * @returns
 */
export function calcFootnoteDefinitionMap(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType> = [FootnoteDefinitionType],
  presetFootnoteDefinitions: ReadonlyArray<FootnoteDefinition> = [],
  preferReferences = false,
  identifierPrefix = 'footnote-',
): Record<string, Readonly<FootnoteDefinition>> {
  const footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>> = {}

  // Traverse Yozora AST and collect footnote definitions.
  traverseAST(root, aimTypes, (node): void => {
    const footnoteDefinition = node as FootnoteDefinition
    const { identifier } = footnoteDefinition

    /**
     * If there are several matching definitions, the first one takes precedence.
     * @see https://github.github.com/gfm/#example-173
     */
    if (footnoteDefinitionMap[identifier] != null) return
    footnoteDefinitionMap[identifier] = footnoteDefinition
  })

  /**
   * Add preset footnote reference definitions at the end to avoid incorrectly
   * overwriting custom defined footnote reference definitions.
   */
  const validPresetFootnoteDefinitions: FootnoteDefinition[] = []
  for (const footnoteDefinition of presetFootnoteDefinitions) {
    if (footnoteDefinition[footnoteDefinition.identifier] != null) continue
    footnoteDefinitionMap[footnoteDefinition.identifier] = footnoteDefinition
    validPresetFootnoteDefinitions.push(footnoteDefinition)
  }

  // Replace footnotes into footnote references and footnote reference definitions.
  if (preferReferences) {
    replaceFootnotesInReferences(root, footnoteDefinitionMap, identifierPrefix)
  }

  // Append the preset footnote reference definitions to the end of the
  // root.children after the ones generated from footnotes appended.
  root.children.push(...validPresetFootnoteDefinitions)

  return footnoteDefinitionMap
}

/**
 * You need to be careful because this operation is irreversible!
 *
 * Replace inline footnote with a footnote reference and a footnote reference
 * definition, the create a new footnote will be assigned a unique incremental
 * number (string), and appended it into the second param `footnoteDefinitions`
 * passed.
 *
 * @param root
 * @param footnoteDefinitionMap
 */
export function replaceFootnotesInReferences(
  root: Readonly<Root>,
  footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>>,
  identifierPrefix = 'footnote-',
): void {
  let footnoteId = 1
  const footnoteDefinitions: FootnoteDefinition[] = []

  replaceAST(root, [FootnoteType], node => {
    const footnote = node as Footnote
    for (; ; footnoteId += 1) {
      const label = String(footnoteId)
      const identifier = identifierPrefix + label
      if (
        footnoteDefinitionMap[label] != null ||
        footnoteDefinitionMap[identifier] != null
      ) {
        continue
      }

      const paragraph: Paragraph = {
        type: ParagraphType,
        children: footnote.children,
      }

      const footnoteDefinition: FootnoteDefinition = {
        type: FootnoteDefinitionType,
        identifier,
        label,
        children: [paragraph],
      }

      const footnoteReference: FootnoteReference = {
        type: FootnoteReferenceType,
        label,
        identifier,
      }

      if (footnote.position != null) {
        footnoteReference.position = footnote.position
      }

      // eslint-disable-next-line no-param-reassign
      footnoteDefinitionMap[identifier] = footnoteDefinition
      footnoteDefinitions.push(footnoteDefinition)

      // Replace the inline footnote with a footnote reference,
      // the relevant created footnote reference definition will be appended to
      // the end of the root.children.
      return [footnoteReference]
    }
  })

  // Append footnote definitions to the end of the root.children
  root.children.push(...footnoteDefinitions)
}
