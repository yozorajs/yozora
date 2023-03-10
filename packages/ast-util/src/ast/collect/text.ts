import type { Literal, Node, Parent } from '@yozora/ast'

export const collectTexts = (nodes: ReadonlyArray<Node>): string[] => {
  const texts: string[] = []
  collect(nodes)
  return texts

  function collect(_nodes: ReadonlyArray<Node>): void {
    for (const o of _nodes as ReadonlyArray<Literal & Parent>) {
      if (typeof o.value === 'string') {
        const text: string = o.value.trim()
        if (text) texts.push(text)
      } else if (o.children?.length) {
        collect(o.children)
      }
    }
  }
}
