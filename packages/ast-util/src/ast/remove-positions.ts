import type { IYastNode, IYastParent, Root } from '@yozora/ast'

export function removePositions(immutableAst: Readonly<Root>): Root {
  function remove(node: IYastNode): IYastNode {
    const { position, children, ...nextNode } = node as IYastParent
    for (const key of Object.keys(nextNode)) {
      nextNode[key] = Array.isArray(nextNode[key]) ? nextNode[key].map(remove) : nextNode[key]
    }
    if (children) {
      ;(nextNode as IYastParent).children = children.map(remove)
    }
    return nextNode
  }
  const tidyAst = remove(immutableAst) as Root
  return tidyAst
}
