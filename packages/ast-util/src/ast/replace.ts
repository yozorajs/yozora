import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'

/**
 * Traverse AST and replace nodes.
 * @param root
 * @param aimTypes
 * @param replace
 */
export function replaceAST(
  root: Root,
  aimTypes: ReadonlyArray<YastNodeType> | null,
  replace: (
    node: Readonly<YastNode>,
    parent: Readonly<YastParent>,
    childIndex: number,
  ) => YastNode | YastNode[] | void,
): void {
  const visit = (o: YastNode): void => {
    const u: YastParent = o as YastParent

    // Recursively visit.
    if (u.children != null) {
      const { children } = u
      let nextChildren: YastNode[] | null = null
      for (let i = 0; i < children.length; ++i) {
        const v = children[i]
        let replaced = false
        if (aimTypes == null || aimTypes.indexOf(v.type) > -1) {
          const newChild = replace(v, u, i)
          if (newChild != null) {
            replaced = true
            if (nextChildren == null) nextChildren = children.slice(0, i)
            if (Array.isArray(newChild)) nextChildren.push(...newChild)
            else nextChildren.push(newChild)
          }
        }

        if (!replaced) {
          visit(v)
          if (nextChildren != null) nextChildren.push(v)
        }
      }

      // Replace children if any of them has been replaced.
      if (nextChildren != null) {
        u.children = nextChildren
      }
    }
  }
  visit(root)
}
