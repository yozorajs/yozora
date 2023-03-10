import type {
  Footnote,
  FootnoteDefinition,
  FootnoteReference,
  NodeType,
  Paragraph,
  Root,
} from '@yozora/ast'
import {
  FootnoteDefinitionType,
  FootnoteReferenceType,
  FootnoteType,
  ParagraphType,
} from '@yozora/ast'
import { shallowMutateAstInPostorder } from '../mutate/post-order'
import { traverseAst } from '../traverse'
import type { INodeMatcher } from './misc'
import { collectNodes } from './node'

export const defaultFootnoteIdentifierPrefix = 'footnote-'

/**
 * Collect footnote reference definitions in a pre-order traversal.
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @returns
 */
export function collectFootnoteDefinitions(
  immutableRoot: Readonly<Root>,
  aimTypesOrNodeMatcher: ReadonlyArray<NodeType> | INodeMatcher = [FootnoteDefinitionType],
): FootnoteDefinition[] {
  const footnoteDefinitions: FootnoteDefinition[] = collectNodes(
    immutableRoot,
    aimTypesOrNodeMatcher,
  )

  // filter duplicated footnote reference definitions with existed identifier.
  const existedSet: Set<string> = new Set<string>()
  const validFootnoteDefinitions: FootnoteDefinition[] = []
  for (const item of footnoteDefinitions) {
    if (existedSet.has(item.identifier)) continue
    existedSet.add(item.identifier)
    validFootnoteDefinitions.push(item)
  }
  existedSet.clear()
  return validFootnoteDefinitions
}

/**
 * Traverse yozora ast and generate a footnote reference definition map.
 *
 * Note that if `presetFootnoteDefinitions` or `preferReference` specified,
 * the input AST root may be modified.
 *
 * The `identifierPrefix` only works with `preferReferences=true`.
 *
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param presetFootnoteDefinitions
 * @param preferReferences
 * @param identifierPrefix
 * @returns
 */
export function calcFootnoteDefinitionMap(
  immutableRoot: Readonly<Root>,
  aimTypesOrNodeMatcher: ReadonlyArray<NodeType> | INodeMatcher = [FootnoteDefinitionType],
  presetFootnoteDefinitions: ReadonlyArray<FootnoteDefinition> = [],
  preferReferences = false,
  identifierPrefix = defaultFootnoteIdentifierPrefix,
): {
  root: Readonly<Root>
  footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>>
} {
  const footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>> = {}

  /**
   * Traverse Yozora AST and collect footnote definitions.
   *
   * If there are several matching definitions, the first one takes precedence.
   * @see https://github.github.com/gfm/#example-173
   */
  traverseAst(immutableRoot, aimTypesOrNodeMatcher, (node): void => {
    const footnoteDefinition = node as FootnoteDefinition
    const { identifier } = footnoteDefinition
    if (footnoteDefinitionMap[identifier] === undefined) {
      footnoteDefinitionMap[identifier] = footnoteDefinition
    }
  })

  /**
   * Add preset footnote reference definitions at the end to avoid incorrectly
   * overwriting custom defined footnote reference definitions.
   */
  const additionalDefinitions: FootnoteDefinition[] = []
  for (const footnoteDefinition of presetFootnoteDefinitions) {
    if (footnoteDefinitionMap[footnoteDefinition.identifier] === undefined) {
      footnoteDefinitionMap[footnoteDefinition.identifier] = footnoteDefinition
      additionalDefinitions.push(footnoteDefinition)
    }
  }

  // Append the preset footnote reference definitions to the end of the
  // root.children after the ones generated from footnotes appended.
  const root: Root =
    additionalDefinitions.length > 0
      ? {
          ...immutableRoot,
          children: immutableRoot.children.concat(additionalDefinitions),
        }
      : immutableRoot

  // Replace footnotes into footnote references and footnote reference definitions.
  if (preferReferences) {
    const root2 = replaceFootnotesInReferences(root, footnoteDefinitionMap, identifierPrefix)
    // Re-collect footnoteDefinitions because previous find footnoteDefinition could be replaced by
    // new built node while `replaceFootnotesInReferences`.
    return calcFootnoteDefinitionMap(root2, aimTypesOrNodeMatcher, [], false, '')
  }
  return { root, footnoteDefinitionMap }
}

/**
 * You need to be careful because this operation is irreversible!
 *
 * Replace inline footnote with a footnote reference and a footnote reference
 * definition, the create a new footnote will be assigned a unique incremental
 * number (string), and appended it into the second param `footnoteDefinitions`
 * passed.
 *
 * @param immutableRoot
 * @param footnoteDefinitionMap
 * @param identifierPrefix
 * @returns
 */
export function replaceFootnotesInReferences(
  immutableRoot: Readonly<Root>,
  footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>>,
  identifierPrefix = defaultFootnoteIdentifierPrefix,
): Root {
  let footnoteId = 1
  const newFootnoteDefinitions: FootnoteDefinition[] = []

  const nextIdentifier = (): { label: string; identifier: string } => {
    for (; ; footnoteId += 1) {
      const label = String(footnoteId)
      const identifier = identifierPrefix + label
      if (
        footnoteDefinitionMap[label] === undefined &&
        footnoteDefinitionMap[identifier] === undefined
      ) {
        return { label, identifier }
      }
    }
  }

  const root: Root = shallowMutateAstInPostorder(immutableRoot, [FootnoteType], node => {
    const footnote = node as Footnote
    const { label, identifier } = nextIdentifier()

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
    newFootnoteDefinitions.push(footnoteDefinition)

    // Replace the inline footnote with a footnote reference,
    // the relevant created footnote reference definition will be appended to
    // the end of the root.children.
    return footnoteReference
  })

  // Append footnote definitions to the end of the root.children
  return newFootnoteDefinitions.length > 0
    ? { ...root, children: root.children.concat(newFootnoteDefinitions) }
    : root
}
