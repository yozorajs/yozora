import type {
  Heading,
  HeadingToc,
  HeadingTocNode,
  Root,
  YastLiteral,
  YastNode,
  YastParent,
} from '@yozora/ast'
import { HeadingType } from '@yozora/ast'

/**
 * Generate heading toc.
 * @param ast
 * @param identifierPrefix  prefix of identifier
 * @returns
 */
export function calcHeadingToc(
  ast: Root,
  identifierPrefix = 'heading-',
): HeadingToc {
  // Generate toc
  const nodes: HeadingTocNode[] = []
  const headings = ast.children.filter(o => o.type === HeadingType) as Heading[]
  for (const heading of headings) {
    const identifier: string =
      identifierPrefix + calcIdentifierFromYastNodes(heading.children)

    const node: HeadingTocNode = {
      depth: heading.depth,
      identifier,
      contents: [...heading.children],
      children: [],
    }
    // Update heading's identifier
    heading.identifier = identifier

    let u: HeadingTocNode[] = nodes
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
 * Calc link identifier for YastNode list.
 */
export function calcIdentifierFromYastNodes(
  nodes: ReadonlyArray<YastNode>,
): string {
  const textList: string[] = []

  const resolveText = (nodes: ReadonlyArray<YastNode>): void => {
    for (const o of nodes) {
      const { value, children } = o as YastLiteral & YastParent
      if (value != null) {
        textList.push(value)
      } else if (children != null) {
        resolveText(children)
      }
    }
  }

  resolveText(nodes)
  const content = textList.join('-').trim()
  const identifier = content
    .toLowerCase()
    .replace(/(?:\s|\p{P})+/gu, '-')
    .replace(/(?:^[-]|[-]$)/g, '')
  return identifier
}
