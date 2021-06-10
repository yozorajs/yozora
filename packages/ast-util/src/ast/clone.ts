import type { Root, YastNode, YastParent } from '@yozora/ast'

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
  endCondition: (
    node: YastNode,
    parent: YastParent,
    childIndex: number,
  ) => boolean,
): Root {
  const clone = (u: YastParent): YastParent => {
    const nextChildren = []
    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i] as YastParent
      if (endCondition(v, u, i)) break

      const nextChild = v.children == null ? v : clone(v)
      nextChildren.push(nextChild)
    }
    return { ...u, children: nextChildren }
  }
  return clone(root) as Root
}
