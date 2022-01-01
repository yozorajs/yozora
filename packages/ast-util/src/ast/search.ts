import type { IRoot, IYastNode, IYastParent } from '@yozora/ast'

/**
 * Search a node from Yozora AST in pre-order traversing.
 *
 * If a node that meets the conditions is found, the path starting from the root
 * node is returned (represented by the index array of the child nodes along
 * the way of the AST).
 *
 * @param immutableRoot
 * @param isTarget
 * @returns
 */
export function searchNode(
  immutableRoot: Readonly<IRoot>,
  isTarget: (
    immutableNode: Readonly<IYastNode>,
    immutableParent: Readonly<IYastParent>,
    childIndex: number,
  ) => boolean,
): number[] | null {
  const childrenIndex: number[] = []
  return dfs(immutableRoot, 0) ? childrenIndex : null

  function dfs(parent: IYastParent, cur: number): boolean {
    const children = parent.children
    for (let i = 0; i < children.length; ++i) {
      childrenIndex[cur] = i
      const node = children[i] as IYastParent
      if (isTarget(node, parent, i)) {
        childrenIndex.splice(cur + 1, childrenIndex.length - cur + 1)
        return true
      }
      if (node.children != null && dfs(node, cur + 1)) return true
    }
    return false
  }
}
