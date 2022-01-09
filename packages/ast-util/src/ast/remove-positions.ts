import type { IRoot, IYastNode, IYastParent } from '@yozora/ast'

export function removePositions(immutableAst: Readonly<IRoot>): IRoot {
  function remove(node: IYastNode): IYastNode {
    const { position, children, ...nextNode } = node as IYastParent
    if (children) {
      ;(nextNode as IYastParent).children = children.map(remove)
    }
    return nextNode
  }
  const tidyAst = remove(immutableAst) as IRoot
  return tidyAst
}
