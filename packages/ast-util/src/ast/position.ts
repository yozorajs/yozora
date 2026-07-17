import type { Node, Parent, Root } from '@yozora/ast'

export function removePositions(immutableAst: Readonly<Root>): Root {
  const createNode = (node: Node): { node: Node; nextNode: Node } => {
    const { position, children, ...nextNode } = node as Parent
    return { node, nextNode }
  }

  const root = createNode(immutableAst)
  const stack: Array<{ node: Node; nextNode: Node }> = [root]
  while (stack.length > 0) {
    const frame = stack.pop()!
    const { children } = frame.node as Parent
    const nextNode = frame.nextNode as unknown as Record<string, unknown>
    const subNodes: Array<{ node: Node; nextNode: Node }> = []

    for (const key of Object.keys(nextNode)) {
      const value = nextNode[key]
      if (!Array.isArray(value)) continue

      const nextValue = value.slice()
      nextNode[key] = nextValue
      for (let i = 0; i < value.length; ++i) {
        const item = value[i]
        if (!isNode(item)) continue

        const subNode = createNode(item)
        nextValue[i] = subNode.nextNode
        subNodes.push(subNode)
      }
    }

    if (children) {
      const nextChildren: Node[] = []
      ;(frame.nextNode as Parent).children = nextChildren
      for (const child of children) {
        const subNode = createNode(child)
        nextChildren.push(subNode.nextNode)
        subNodes.push(subNode)
      }
    }

    for (let i = subNodes.length - 1; i >= 0; --i) stack.push(subNodes[i])
  }
  return root.nextNode as Root
}

function isNode(value: unknown): value is Node {
  return value != null && typeof value === 'object' && typeof (value as Node).type === 'string'
}
