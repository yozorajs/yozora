import type { Heading, Node, Root } from '@yozora/ast'
import { HeadingType } from '@yozora/ast'
import { foldCase } from '@yozora/character'
import { collectTexts } from './collect/text'

/**
 * Document toc (table of contents).
 */
export interface IHeadingToc {
  /**
   * Toc nodes.
   */
  children: IHeadingTocNode[]
}

/**
 * Toc node.
 */
export interface IHeadingTocNode {
  /**
   * Identifier of the toc node (referer to the Heading.identifier)
   */
  identifier: string
  /**
   * Level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Toc node contents.
   */
  contents: Node[]
  /**
   * Sub toc nodes.
   */
  children: IHeadingTocNode[]
}

/**
 * Generate heading toc.
 * @param ast
 * @param identifierPrefix  prefix of identifier
 * @returns
 */
export function calcHeadingToc(ast: Root, identifierPrefix = 'heading-'): IHeadingToc {
  const duplicated: Record<string, true> = {}

  // Generate toc
  const nodes: IHeadingTocNode[] = []
  const headings = ast.children.filter(o => o.type === HeadingType) as Heading[]
  for (const heading of headings) {
    let identifier: string = identifierPrefix + calcIdentifierFromNodes(heading.children)

    // Avoid duplicate identifier
    if (duplicated[identifier]) {
      const baseIdentifier: string = identifier
      for (let i = 2; ; ++i) {
        identifier = baseIdentifier + '-' + i
        if (!duplicated[identifier]) break
      }
    }
    duplicated[identifier] = true

    const node: IHeadingTocNode = {
      depth: heading.depth,
      identifier,
      contents: [...heading.children],
      children: [],
    }
    // Update heading's identifier
    heading.identifier = identifier

    let u: IHeadingTocNode[] = nodes
    while (u.length > 0) {
      const v = u[u.length - 1]
      if (v.depth >= heading.depth) break
      u = v.children
    }
    u.push(node)
  }

  return { children: nodes }
}

/**
 * Calc link identifier for Node list.
 */
export function calcIdentifierFromNodes(nodes: readonly Node[]): string {
  const texts: string[] = collectTexts(nodes)
  const content = texts.join('-').trim()
  const identifier = content
    .toLowerCase()
    .replace(/(?:\s|\p{P})+/gu, '-')
    .replace(/(?:^[-]|[-]$)/g, '')
  return foldCase(identifier)
}
