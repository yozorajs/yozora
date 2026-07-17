import type { Node, Parent, Root } from '@yozora/ast'

/**
 * Shallow clone ast until the match reaches the termination condition.
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `endCondition` function.
 *
 * @param root
 * @param endCondition
 * @returns
 */
export function shallowCloneAst(
  root: Root,
  endCondition: (node: Node, parent: Parent, childIndex: number) => boolean,
): Root {
  const stack: Array<{
    node: Parent
    children: Node[]
    nextChildren: Node[]
    childIndex: number
  }> = [{ node: root, children: root.children, nextChildren: [], childIndex: 0 }]
  let terminated = false

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (!terminated && frame.childIndex < frame.children.length) {
      const childIndex = frame.childIndex++
      const child = frame.children[childIndex] as Parent
      if (endCondition(child, frame.node, childIndex)) {
        terminated = true
      } else if (child.children == null) {
        frame.nextChildren.push(child)
      } else {
        stack.push({ node: child, children: child.children, nextChildren: [], childIndex: 0 })
      }
      continue
    }

    const nextNode: Parent = { ...frame.node, children: frame.nextChildren }
    stack.pop()
    if (stack.length <= 0) return nextNode as Root
    stack[stack.length - 1].nextChildren.push(nextNode)
  }
  return root
}
