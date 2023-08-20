import type { Literal, Parent, Root } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import { shallowCloneAst } from './ast/clone'
import { searchNode } from './ast/search'

/**
 * Calc excerpt ast from the original ast.
 */
export function calcExcerptAst(immutableRoot: Readonly<Root>, pruneLength: number): Readonly<Root> {
  if (immutableRoot.children.length <= 0) return immutableRoot

  let totalExcerptLengthSoFar = 0
  let parentOfLastLiteralNode: Parent | null = null as any
  let indexOfLastLiteralNode = 0
  const excerptAst = shallowCloneAst(immutableRoot, (node, parent, index) => {
    if (totalExcerptLengthSoFar >= pruneLength) return true
    const { value } = node as Literal
    if (value != null) {
      parentOfLastLiteralNode = parent
      indexOfLastLiteralNode = index
      totalExcerptLengthSoFar += value.length
    }
    return false
  })

  if (
    parentOfLastLiteralNode !== null &&
    parentOfLastLiteralNode.type === TextType &&
    totalExcerptLengthSoFar > pruneLength
  ) {
    // Try truncate last LiteralNode
    const parent = parentOfLastLiteralNode!
    parent.children = parent.children.map((node, i) => {
      if (i !== indexOfLastLiteralNode) return node
      return {
        ...node,
        value: (node as Literal).value.slice(totalExcerptLengthSoFar - pruneLength),
      }
    })
  }
  return excerptAst
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
      for (const childIndex of childIndexList) {
        const nextNode = { ...node.children[childIndex] } as unknown as Parent
        node.children = node.children.slice(0, childIndex)
        node.children.push(nextNode)
        node = nextNode
      }
      return excerptAst
    }
  }

  // Try to truncate excerpt.
  const excerptAst = calcExcerptAst(fullAst, pruneLength)
  return excerptAst
}
