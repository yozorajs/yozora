import type { Node, Parent, Root } from '@yozora/ast'

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
  immutableRoot: Readonly<Root>,
  isTarget: (
    immutableNode: Readonly<Node>,
    immutableParent: Readonly<Parent>,
    childIndex: number,
  ) => boolean,
): number[] | null {
  const childrenIndex: number[] = []
  return dfs(immutableRoot, 0) ? childrenIndex : null

  function dfs(parent: Parent, cur: number): boolean {
    const children = parent.children
    for (let i = 0; i < children.length; ++i) {
      childrenIndex[cur] = i
      const node = children[i] as Parent
      if (isTarget(node, parent, i)) {
        childrenIndex.splice(cur + 1, childrenIndex.length - cur + 1)
        return true
      }
      if (node.children != null && dfs(node, cur + 1)) return true
    }
    return false
  }
}
