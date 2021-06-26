import type { YastNode, YastNodeType } from '@yozora/ast'

export type NodeTypeMatcher = (node: YastNode) => boolean

/**
 * Create a matcher for match specified node types.
 * @param aimTypes
 * @returns
 */
export function createNodeTypeMatcher(
  aimTypes: ReadonlyArray<YastNodeType> | null,
): (node: YastNode) => boolean {
  if (aimTypes == null) return () => true

  // Does not match any types of YAST node.
  if (aimTypes.length === 0) {
    return () => false
  }

  // Optimization: if there is only one element, use the equal operator
  //               directly for comparison
  if (aimTypes.length === 1) {
    const t = aimTypes[0]
    return (node: YastNode) => node.type === t
  }

  return (node: YastNode) => {
    for (const t of aimTypes) {
      if (node.type === t) return true
    }
    return false
  }
}
