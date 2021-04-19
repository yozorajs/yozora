import type {
  Footnote,
  FootnoteDefinition,
  FootnoteReference,
  Root,
  YastNodeType,
} from '@yozora/ast'
import {
  FootnoteDefinitionType,
  FootnoteReferenceType,
  FootnoteType,
} from '@yozora/ast'
import { replaceAST } from './ast/replace'
import { traverseAST } from './ast/traverse'

/**
 * Calc footnote definition map from Yozora AST.
 * @param root
 * @param aimTypes
 * @param presetFootnoteDefinitions
 * @param preferReferences
 * @returns
 */
export function collectFootnoteDefinitions(
  root: Readonly<Root>,
  aimTypes: ReadonlyArray<YastNodeType> = [FootnoteDefinitionType],
  presetFootnoteDefinitions: ReadonlyArray<
    Omit<FootnoteDefinition, 'type'>
  > = [],
  preferReferences = false,
): Record<string, Readonly<FootnoteDefinition>> {
  const footnoteDefinitions: Record<string, Readonly<FootnoteDefinition>> = {}
  const add = (footnoteDefinition: FootnoteDefinition): void => {
    const { identifier } = footnoteDefinition

    /**
     * If there are several matching definitions, the first one takes precedence
     * @see https://github.github.com/gfm/#example-173
     */
    if (footnoteDefinitions[identifier] != null) return
    footnoteDefinitions[identifier] = footnoteDefinition
  }

  // Traverse Yozora AST and collect footnote definitions.
  traverseAST(root, aimTypes, (node): void => {
    const footnoteDefinition = node as FootnoteDefinition
    add(footnoteDefinition)
  })

  // Add preset footnote definitions at the end to avoid incorrectly
  // overwriting custom footnote definitions defined in the Yozora AST.
  for (const footnoteDefinition of presetFootnoteDefinitions) {
    add({ type: FootnoteDefinitionType, ...footnoteDefinition })
  }

  if (preferReferences) {
    replaceFootnotesInReferences(root, footnoteDefinitions)
  }

  return footnoteDefinitions
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
 * @param footnoteDefinitions
 */
export function replaceFootnotesInReferences(
  root: Readonly<Root>,
  footnoteDefinitions: Record<string, Readonly<FootnoteDefinition>>,
): void {
  let footnoteId = 1
  replaceAST(root, [FootnoteType], node => {
    const footnote = node as Footnote
    for (; ; footnoteId += 1) {
      const identifier = '' + footnoteId
      if (footnoteDefinitions[identifier] != null) continue

      const label = identifier
      const footnoteDefinition: FootnoteDefinition = {
        type: FootnoteDefinitionType,
        identifier,
        label,
        children: footnote.children,
      }

      const footnoteReference: FootnoteReference = {
        type: FootnoteReferenceType,
        label,
        identifier,
      }

      if (footnote.position != null) {
        footnoteDefinition.position = footnote.position
        footnoteReference.position = footnote.position
      }

      // eslint-disable-next-line no-param-reassign
      footnoteDefinitions[identifier] = footnoteDefinition
      footnoteId += 1

      // Replace the inline footnote with a footnote reference
      // and a footnote reference definition
      return [footnoteReference, footnoteDefinition]
    }
  })
}
