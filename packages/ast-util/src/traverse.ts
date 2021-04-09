import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'

/**
 * Traverse yozora AST, and provide an opportunity to perform an action on
 * visited node.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `mutate` function..
 *
 * @param root
 * @param mutate
 * @param aimTypes
 */
export function traverseAST(
  root: Root,
  mutate: (node: YastNode, parent: YastParent, childIndex: number) => void,
  aimTypes: ReadonlyArray<YastNodeType> | null = null,
): void {
  const visit = (u: YastNode): void => {
    const { children } = u as YastParent

    // Recursively visit.
    if (children != null) {
      for (let i = 0; i < children.length; ++i) {
        const v = children[i]
        if (aimTypes == null || aimTypes.indexOf(v.type) > -1) {
          mutate(v, (u as unknown) as YastParent, i)
        }
        visit(v)
      }
    }
  }
  visit(root)
}
