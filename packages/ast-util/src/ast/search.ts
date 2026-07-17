import type { Node, Parent, Root } from '@yozora/ast'
import type { IAstStackItem } from './util'

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
  const stack: IAstStackItem[] = [
    {
      parent: immutableRoot,
      children: immutableRoot.children,
      childIndex: 0,
    },
  ]

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.childIndex >= frame.children.length) {
      stack.pop()
      continue
    }

    const childIndex = frame.childIndex++
    const node = frame.children[childIndex] as Parent
    childrenIndex[stack.length - 1] = childIndex
    if (isTarget(node, frame.parent, childIndex)) {
      childrenIndex.length = stack.length
      return childrenIndex
    }

    if (node.children != null) {
      stack.push({ parent: node, children: node.children, childIndex: 0 })
    }
  }
  return null
}
