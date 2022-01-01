import type { IYastNode, YastNodeType } from '@yozora/ast'

export type INodeMatcher = (node: IYastNode) => boolean

/**
 * Create a matcher for match specified node types.
 * @param aimTypesOrNodeMatcher
 * @returns
 */
export function createNodeMatcher(
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher | null,
): INodeMatcher {
  if (aimTypesOrNodeMatcher == null) return () => true
  if (aimTypesOrNodeMatcher instanceof Function) return aimTypesOrNodeMatcher

  // Does not match any types of YAST node.
  if (aimTypesOrNodeMatcher.length === 0) return () => false

  // Optimization: if there is only one element, use the equal operator
  //               directly for comparison
  if (aimTypesOrNodeMatcher.length === 1) {
    const t = aimTypesOrNodeMatcher[0]
    return (node: IYastNode) => node.type === t
  }

  // Optimization: if there is only two elements, use the equal operator
  //               directly for comparison
  if (aimTypesOrNodeMatcher.length === 2) {
    const [s, t] = aimTypesOrNodeMatcher
    return (node: IYastNode) => node.type === s || node.type === t
  }

  return (node: IYastNode) => {
    for (const t of aimTypesOrNodeMatcher) {
      if (node.type === t) return true
    }
    return false
  }
}

/**
 * A shallow copy element collector, reuse unchanged nodes as much as possible,
 * if no element in the original array has changed, then return to the original
 * array, otherwise create a new array to return.
 */
export interface IShallowNodeCollector<T> {
  /**
   * Append a node depends whether if the node and nextNode is equal.
   * @param node
   * @param originalNode
   * @param originalIndex
   */
  add(node: T | T[] | null, originalNode: Readonly<T>, originalIndex: number): void
  /**
   * Return all of collected nodes.
   */
  collect(): T[]
}

/**
 * Create a shallow child collector.
 * @param nodes
 * @returns
 */
export function createShallowNodeCollector<T>(nodes: T[]): IShallowNodeCollector<T> {
  let nextNodes: T[] | null = null

  const add = (node: T | T[] | null, originalNode: Readonly<T>, originalIndex: number): void => {
    if (node === originalNode) {
      if (nextNodes !== null) nextNodes.push(node)
    } else {
      if (nextNodes === null) nextNodes = nodes.slice(0, originalIndex)
      if (Array.isArray(node)) nextNodes.push(...node)
      else if (node !== null) nextNodes.push(node)
    }
  }

  const collect: () => T[] = () => nextNodes ?? nodes

  return { add, collect }
}
