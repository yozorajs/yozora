import type {
  Admonition,
  Footnote,
  FootnoteDefinition,
  FootnoteReference,
  Node,
  NodeType,
  Paragraph,
  Parent,
  Root,
} from '@yozora/ast'
import {
  AdmonitionType,
  FootnoteDefinitionType,
  FootnoteReferenceType,
  FootnoteType,
  ParagraphType,
} from '@yozora/ast'
import { traverseAst } from '../traverse'
import type { INodeMatcher, IShallowNodeCollector } from './misc'
import { createShallowNodeCollector } from './misc'
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
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher = [FootnoteDefinitionType],
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
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher = [FootnoteDefinitionType],
  presetFootnoteDefinitions: readonly FootnoteDefinition[] = [],
  preferReferences = false,
  identifierPrefix = defaultFootnoteIdentifierPrefix,
): {
  root: Readonly<Root>
  footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>>
} {
  const footnoteDefinitionMap: Record<string, Readonly<FootnoteDefinition>> = Object.create(null)

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

  const root: Root = mutateFootnotesInPostorder(immutableRoot, footnote => {
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

interface IFootnoteMutationFrame {
  immutableNode: Readonly<Node>
  node: Node
  fieldIndex: number
  children: readonly Node[] | null
  collector0: IShallowNodeCollector<Node> | null
  childIndex: number
  nextChildren: Node[] | null
  collector1: IShallowNodeCollector<Node> | null
  nextChildIndex: number
  parentChildIndex: number
}

/**
 * Unlike regular parent children, an admonition title is stored in a separate
 * node array. Traverse the title before the body so its footnotes receive
 * identifiers first, while preserving the existing post-order within each array.
 */
function mutateFootnotesInPostorder(
  immutableRoot: Readonly<Root>,
  replace: (footnote: Readonly<Footnote>) => Node,
): Root {
  const createFrame = (
    immutableNode: Readonly<Node>,
    parentChildIndex: number,
  ): IFootnoteMutationFrame => ({
    immutableNode,
    node: immutableNode as Node,
    fieldIndex: immutableNode.type === AdmonitionType ? 0 : 1,
    children: null,
    collector0: null,
    childIndex: 0,
    nextChildren: null,
    collector1: null,
    nextChildIndex: 0,
    parentChildIndex,
  })

  const stack: IFootnoteMutationFrame[] = [createFrame(immutableRoot, -1)]
  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.children == null) {
      if (frame.fieldIndex === 0) {
        frame.children = (frame.immutableNode as Admonition).title
      } else if (frame.fieldIndex === 1) {
        const children = (frame.immutableNode as Parent).children
        if (children == null) {
          frame.fieldIndex += 1
          continue
        }
        frame.children = children
      } else {
        stack.pop()
        if (stack.length <= 0) return frame.node as Root

        const parentFrame = stack[stack.length - 1]
        parentFrame.collector0!.add(frame.node, frame.immutableNode, frame.parentChildIndex)
        continue
      }

      if (frame.children.length <= 0) {
        frame.fieldIndex += 1
        frame.children = null
        continue
      }
      frame.collector0 = createShallowNodeCollector(frame.children as Node[])
      frame.childIndex = 0
    }

    if (frame.nextChildren == null) {
      if (frame.childIndex < frame.children.length) {
        const childIndex = frame.childIndex++
        const child = frame.children[childIndex]
        const title = child.type === AdmonitionType ? (child as Admonition).title : null
        const children = (child as Parent).children
        if ((title?.length ?? 0) > 0 || (children?.length ?? 0) > 0) {
          stack.push(createFrame(child, childIndex))
        } else {
          frame.collector0!.add(child, child, childIndex)
        }
        continue
      }

      frame.nextChildren = frame.collector0!.collect()
      frame.collector1 = createShallowNodeCollector(frame.nextChildren)
      frame.nextChildIndex = 0
    }

    if (frame.nextChildIndex < frame.nextChildren.length) {
      const childIndex = frame.nextChildIndex++
      const child = frame.nextChildren[childIndex]
      const nextChild = child.type === FootnoteType ? replace(child as Footnote) : child
      frame.collector1!.add(nextChild, child, childIndex)
      continue
    }

    const finalChildren = frame.collector1!.collect()
    if (finalChildren !== frame.children) {
      frame.node =
        frame.fieldIndex === 0
          ? ({ ...(frame.node as Admonition), title: finalChildren } as Admonition)
          : ({ ...(frame.node as Parent), children: finalChildren } as Parent)
    }
    frame.fieldIndex += 1
    frame.children = null
    frame.collector0 = null
    frame.nextChildren = null
    frame.collector1 = null
  }
  return immutableRoot
}
