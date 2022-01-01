import type {
  IFootnote,
  IFootnoteDefinition,
  IFootnoteReference,
  IParagraph,
  IRoot,
  YastNodeType,
} from '@yozora/ast'
import {
  FootnoteDefinitionType,
  FootnoteReferenceType,
  FootnoteType,
  ParagraphType,
} from '@yozora/ast'
import { collectNodes } from './ast/collect'
import { shallowMutateAstInPostorder } from './ast/replace-post-order'
import { traverseAst } from './ast/traverse'
import type { INodeMatcher } from './ast/util'

export const defaultFootnoteIdentifierPrefix = 'footnote-'

/**
 * Collect footnote reference definitions in a pre-order traversal.
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @returns
 */
export function collectFootnoteDefinitions(
  immutableRoot: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher = [FootnoteDefinitionType],
): IFootnoteDefinition[] {
  const results: IFootnoteDefinition[] = collectNodes(immutableRoot, aimTypesOrNodeMatcher)

  // filter duplicated footnote reference definitions with existed identifier.
  const existedSet: Set<string> = new Set<string>()
  return results.filter(item => {
    if (existedSet.has(item.identifier)) return false
    existedSet.add(item.identifier)
    return true
  })
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
  immutableRoot: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher = [FootnoteDefinitionType],
  presetFootnoteDefinitions: ReadonlyArray<IFootnoteDefinition> = [],
  preferReferences = false,
  identifierPrefix = defaultFootnoteIdentifierPrefix,
): {
  root: Readonly<IRoot>
  footnoteDefinitionMap: Record<string, Readonly<IFootnoteDefinition>>
} {
  const footnoteDefinitionMap: Record<string, Readonly<IFootnoteDefinition>> = {}

  // Traverse Yozora AST and collect footnote definitions.
  traverseAst(immutableRoot, aimTypesOrNodeMatcher, (node): void => {
    const footnoteDefinition = node as IFootnoteDefinition
    const { identifier } = footnoteDefinition

    /**
     * If there are several matching definitions, the first one takes precedence.
     * @see https://github.github.com/gfm/#example-173
     */
    if (footnoteDefinitionMap[identifier] === undefined) {
      footnoteDefinitionMap[identifier] = footnoteDefinition
    }
  })

  /**
   * Add preset footnote reference definitions at the end to avoid incorrectly
   * overwriting custom defined footnote reference definitions.
   */
  const additionalDefinitions: IFootnoteDefinition[] = []
  for (const footnoteDefinition of presetFootnoteDefinitions) {
    if (footnoteDefinitionMap[footnoteDefinition.identifier] === undefined) {
      footnoteDefinitionMap[footnoteDefinition.identifier] = footnoteDefinition
      additionalDefinitions.push(footnoteDefinition)
    }
  }

  // Append the preset footnote reference definitions to the end of the
  // root.children after the ones generated from footnotes appended.
  let root: IRoot =
    additionalDefinitions.length > 0
      ? {
          ...immutableRoot,
          children: immutableRoot.children.concat(additionalDefinitions),
        }
      : immutableRoot

  // Replace footnotes into footnote references and footnote reference definitions.
  if (preferReferences) {
    root = replaceFootnotesInReferences(root, footnoteDefinitionMap, identifierPrefix)
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
  immutableRoot: Readonly<IRoot>,
  footnoteDefinitionMap: Record<string, Readonly<IFootnoteDefinition>>,
  identifierPrefix = defaultFootnoteIdentifierPrefix,
): IRoot {
  let footnoteId = 1
  const footnoteDefinitions: IFootnoteDefinition[] = []

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

  const root: IRoot = shallowMutateAstInPostorder(immutableRoot, [FootnoteType], node => {
    const footnote = node as IFootnote
    const { label, identifier } = nextIdentifier()

    const paragraph: IParagraph = {
      type: ParagraphType,
      children: footnote.children,
    }

    const footnoteDefinition: IFootnoteDefinition = {
      type: FootnoteDefinitionType,
      identifier,
      label,
      children: [paragraph],
    }

    const footnoteReference: IFootnoteReference = {
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
    return footnoteReference
  })

  // Append footnote definitions to the end of the root.children
  return footnoteDefinitions.length > 0
    ? { ...root, children: root.children.concat(footnoteDefinitions) }
    : root
}
