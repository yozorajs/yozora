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
  let terminated = false
  const clone = (u: Parent): Parent => {
    const nextChildren = []
    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      if (terminated) break

      const v = children[i] as Parent
      if (endCondition(v, u, i)) {
        terminated = true
        break
      }

      const nextChild = v.children == null ? v : clone(v)
      nextChildren.push(nextChild)
    }
    return { ...u, children: nextChildren }
  }
  return clone(root) as Root
}
