import type { Node, Parent, Root } from '@yozora/ast'

export function removePositions(immutableAst: Readonly<Root>): Root {
  function remove(node: Node): Node {
    const { position, children, ...nextNode } = node as Parent
    for (const key of Object.keys(nextNode)) {
      nextNode[key] = Array.isArray(nextNode[key]) ? nextNode[key].map(remove) : nextNode[key]
    }
    if (children) {
      ;(nextNode as Parent).children = children.map(remove)
    }
    return nextNode
  }
  const tidyAst = remove(immutableAst) as Root
  return tidyAst
}
