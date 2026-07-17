import type { Literal, Node, Parent } from '@yozora/ast'

export const collectTexts = (nodes: readonly Node[]): string[] => {
  const texts: string[] = []
  const stack: Array<{ nodes: readonly Node[]; index: number }> = [{ nodes, index: 0 }]

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.index >= frame.nodes.length) {
      stack.pop()
      continue
    }

    const node = frame.nodes[frame.index++] as Literal & Parent
    if (typeof node.value === 'string') {
      const text: string = node.value.trim()
      if (text) texts.push(text)
    } else if (node.children?.length) stack.push({ nodes: node.children, index: 0 })
  }
  return texts
}
