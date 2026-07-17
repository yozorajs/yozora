import type { Node, Parent } from '@yozora/ast'

export interface IAstStackItem {
  parent: Readonly<Parent>
  children: readonly Node[]
  childIndex: number
}
