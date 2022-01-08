import type { IRoot, IYastNode } from '@yozora/ast'
import { traverseAst } from './traverse'

export function removePositions(ast: IRoot): void {
  // eslint-disable-next-line no-param-reassign
  ast.position = undefined
  traverseAst(ast, null, node => {
    // eslint-disable-next-line no-param-reassign
    ;(node as IYastNode).position = undefined
  })
}
