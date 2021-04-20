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

  // Optimization: if there is only one element, use the equal operator
  //               directly for comparison
  if (aimTypes.length === 1) {
    const t = aimTypes[0]
    return (node: YastNode) => node.type === t
  }

  if (aimTypes.length > 1) {
    return (node: YastNode) => aimTypes.indexOf(node.type) > -1
  }

  // Bad parameters.
  return () => false
}
