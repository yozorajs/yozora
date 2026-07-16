import type { Literal, Node, Parent, Root } from '@yozora/ast'
import { searchNode } from './ast/search'

/**
 * Calc excerpt ast from the original ast.
 */
export function calcExcerptAst(immutableRoot: Readonly<Root>, pruneLength: number): Readonly<Root> {
  if (immutableRoot.children.length <= 0) return immutableRoot

  let remainingLength = pruneLength
  const clone = (parent: Readonly<Parent>): Parent => {
    const children: Node[] = []
    for (const node of parent.children) {
      if (remainingLength <= 0) break

      const { value } = node as Literal
      if (typeof value === 'string') {
        if (value.length > remainingLength) {
          const truncatedNode: Literal = {
            ...(node as Literal),
            value: value.slice(0, remainingLength),
          }
          children.push(truncatedNode)
          remainingLength = 0
        } else {
          children.push(node)
          remainingLength -= value.length
        }
        continue
      }

      const { children: subChildren } = node as Parent
      if (subChildren == null) {
        children.push(node)
      } else {
        children.push(clone(node as Parent))
      }
    }
    return { ...parent, children }
  }
  return clone(immutableRoot) as Root
}

/**
 * Get excerpt ast from the full AST, if there is a matched excerptSeparator, then prune it until
 * meet the separator, otherwise, use the `calcExcerptAst` to generate the excerpt.
 * @returns
 */
export function getExcerptAst(fullAst: Root, pruneLength: number, excerptSeparator?: string): Root {
  if (excerptSeparator != null) {
    const separator = excerptSeparator.trim()

    const childIndexList: number[] | null = searchNode(fullAst, node => {
      const { value } = node as Literal
      return typeof value === 'string' && value.trim() === separator
    })

    if (childIndexList != null) {
      const excerptAst = { ...fullAst }
      let node: Parent = excerptAst
      for (let pathIndex = 0; pathIndex < childIndexList.length; ++pathIndex) {
        const childIndex = childIndexList[pathIndex]
        const nextNode = node.children[childIndex]
        node.children = node.children.slice(0, childIndex)

        if (pathIndex + 1 >= childIndexList.length) break

        const nextParent = { ...nextNode } as Parent
        node.children.push(nextParent)
        node = nextParent
      }
      return excerptAst
    }
  }

  // Try to truncate excerpt.
  const excerptAst = calcExcerptAst(fullAst, pruneLength)
  return excerptAst
}
