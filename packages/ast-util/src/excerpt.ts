import type { Literal, Parent, Root } from '@yozora/ast'
import { searchNode } from './ast/search'

/**
 * Calc excerpt ast from the original ast.
 */
export function calcExcerptAst(immutableRoot: Readonly<Root>, pruneLength: number): Readonly<Root> {
  if (immutableRoot.children.length <= 0) return immutableRoot

  let remainingLength = pruneLength
  const root: Parent = { ...immutableRoot, children: [] }
  const stack: Array<{
    parent: Readonly<Parent>
    nextParent: Parent
    childIndex: number
  }> = [{ parent: immutableRoot, nextParent: root, childIndex: 0 }]

  while (stack.length > 0) {
    if (remainingLength <= 0) break

    const frame = stack[stack.length - 1]
    if (frame.childIndex >= frame.parent.children.length) {
      stack.pop()
      continue
    }

    const node = frame.parent.children[frame.childIndex++]
    const { value } = node as Literal
    if (typeof value === 'string') {
      if (value.length > remainingLength) {
        let endIndex = Math.trunc(remainingLength)
        const lastCodeUnit = value.charCodeAt(endIndex - 1)
        const nextCodeUnit = value.charCodeAt(endIndex)

        // Keep the excerpt well-formed when the code-unit limit bisects an astral character.
        if (
          lastCodeUnit >= 0xd800 &&
          lastCodeUnit <= 0xdbff &&
          nextCodeUnit >= 0xdc00 &&
          nextCodeUnit <= 0xdfff
        ) {
          endIndex -= 1
        }

        if (endIndex > 0) {
          const truncatedNode: Literal = {
            ...(node as Literal),
            value: value.slice(0, endIndex),
          }
          frame.nextParent.children.push(truncatedNode)
        }
        remainingLength = 0
      } else {
        frame.nextParent.children.push(node)
        remainingLength -= value.length
      }
      continue
    }

    const parent = node as Parent
    if (parent.children == null) {
      frame.nextParent.children.push(node)
      continue
    }

    const nextParent: Parent = { ...parent, children: [] }
    frame.nextParent.children.push(nextParent)
    stack.push({ parent, nextParent, childIndex: 0 })
  }
  return root as Root
}

/**
 * Get excerpt ast from the full AST, if there is a matched excerptSeparator, then prune it until
 * meet the separator, otherwise, use the `calcExcerptAst` to generate the excerpt.
 * @returns
 */
export function getExcerptAst(fullAst: Root, pruneLength: number, excerptSeparator?: string): Root {
  const separator = excerptSeparator?.trim()
  if (separator) {
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
