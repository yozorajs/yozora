import type {
  IHeading,
  IHeadingToc,
  IHeadingTocNode,
  IRoot,
  IYastLiteral,
  IYastNode,
  IYastParent,
} from '@yozora/ast'
import { HeadingType } from '@yozora/ast'
import { foldCase } from '@yozora/character'

/**
 * Generate heading toc.
 * @param ast
 * @param identifierPrefix  prefix of identifier
 * @returns
 */
export function calcHeadingToc(ast: IRoot, identifierPrefix = 'heading-'): IHeadingToc {
  const duplicated: Record<string, true> = {}

  // Generate toc
  const nodes: IHeadingTocNode[] = []
  const headings = ast.children.filter(o => o.type === HeadingType) as IHeading[]
  for (const heading of headings) {
    let identifier: string = identifierPrefix + calcIdentifierFromYastNodes(heading.children)

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
 * Calc link identifier for IYastNode list.
 */
export function calcIdentifierFromYastNodes(nodes: ReadonlyArray<IYastNode>): string {
  const textList: string[] = []

  const resolveText = (nodes: ReadonlyArray<IYastNode>): void => {
    for (const o of nodes) {
      const { value, children } = o as IYastLiteral & IYastParent
      if (typeof value === 'string') {
        const text: string = value.trim()
        if (text) textList.push(text)
      } else if (children) {
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
  return foldCase(identifier)
}
