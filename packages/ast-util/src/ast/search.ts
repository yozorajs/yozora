import type { Root, YastNode, YastParent } from '@yozora/ast'

/**
 * Search a node from Yozora AST in pre-order traversing.
 *
 * If a node that meets the conditions is found, the path starting from the root
 * node is returned (represented by the index array of the child nodes along
 * the way of the AST).
 *
 * @param root
 * @param isTarget
 * @returns
 */
export function searchNode(
  root: Root,
  isTarget: (
    node: YastNode,
    parent: Readonly<YastParent>,
    childIndex: number,
  ) => boolean,
): number[] | null {
  const childrenIndex: number[] = []
  return dfs(root, 0) ? childrenIndex : null

  function dfs(parent: YastParent, cur: number): boolean {
    const children = parent.children
    for (let i = 0; i < children.length; ++i) {
      childrenIndex[cur] = i
      const node = children[i] as YastParent
      if (isTarget(node, parent, i)) {
        childrenIndex.splice(cur + 1, childrenIndex.length - cur + 1)
        return true
      }
      if (node.children != null && dfs(node, cur + 1)) return true
    }
    return false
  }
}
