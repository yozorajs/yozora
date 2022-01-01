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
import type { NodeMatcher } from './ast/util'

/**
 * Collect footnote reference definitions in a pre-order traversal.
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @returns
 */
export function collectFootnoteDefinitions(
  immutableRoot: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher = [
    FootnoteDefinitionType,
  ],
): IFootnoteDefinition[] {
  const results: IFootnoteDefinition[] = collectNodes(
    immutableRoot,
    aimTypesOrNodeMatcher,
  )
  const identifierMap: Record<string, true> = {}

  // filter duplicated footnote reference definitions with existed identifier.
  const deDuplicatedResults: IFootnoteDefinition[] = results.filter(item => {
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
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param presetFootnoteDefinitions
 * @param preferReferences
 * @param identifierPrefix
 * @returns
 */
export function calcFootnoteDefinitionMap(
  immutableRoot: Readonly<IRoot>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher = [
    FootnoteDefinitionType,
  ],
  presetFootnoteDefinitions: ReadonlyArray<IFootnoteDefinition> = [],
  preferReferences = false,
  identifierPrefix = 'footnote-',
): {
  root: Readonly<IRoot>
  footnoteDefinitionMap: Record<string, Readonly<IFootnoteDefinition>>
} {
  const footnoteDefinitionMap: Record<
    string,
    Readonly<IFootnoteDefinition>
  > = {}

  // Traverse Yozora AST and collect footnote definitions.
  traverseAst(immutableRoot, aimTypesOrNodeMatcher, (node): void => {
    const footnoteDefinition = node as IFootnoteDefinition
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
  const validPresetFootnoteDefinitions: IFootnoteDefinition[] = []
  for (const footnoteDefinition of presetFootnoteDefinitions) {
    if (footnoteDefinition[footnoteDefinition.identifier] != null) continue
    footnoteDefinitionMap[footnoteDefinition.identifier] = footnoteDefinition
    validPresetFootnoteDefinitions.push(footnoteDefinition)
  }

  // Append the preset footnote reference definitions to the end of the
  // root.children after the ones generated from footnotes appended.
  let root: IRoot =
    validPresetFootnoteDefinitions.length > 0
      ? {
          ...immutableRoot,
          children: immutableRoot.children.concat(
            validPresetFootnoteDefinitions,
          ),
        }
      : immutableRoot

  // Replace footnotes into footnote references and footnote reference definitions.
  if (preferReferences) {
    root = replaceFootnotesInReferences(
      immutableRoot,
      footnoteDefinitionMap,
      identifierPrefix,
    )
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
  identifierPrefix = 'footnote-',
): IRoot {
  let footnoteId = 1
  const footnoteDefinitions: IFootnoteDefinition[] = []

  const root: IRoot = shallowMutateAstInPostorder(
    immutableRoot,
    [FootnoteType],
    node => {
      const footnote = node as IFootnote
      for (; ; footnoteId += 1) {
        const label = String(footnoteId)
        const identifier = identifierPrefix + label
        if (
          footnoteDefinitionMap[label] != null ||
          footnoteDefinitionMap[identifier] != null
        ) {
          continue
        }

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
      }
    },
  )

  // Append footnote definitions to the end of the root.children
  return footnoteDefinitions.length > 0
    ? { ...root, children: root.children.concat(footnoteDefinitions) }
    : root
}
