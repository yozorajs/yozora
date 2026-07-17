import type { Node, Parent, Root } from '@yozora/ast'
import type { INodeMatcher, IShallowNodeCollector } from '../collect/misc'
import { createShallowNodeCollector } from '../collect/misc'

interface IMutateNodeRequest {
  node: Readonly<Node>
  parent: Readonly<Parent>
  childIndex: number
}

type IMutation = Generator<IMutateNodeRequest, Readonly<Root>, Node | Node[] | null>

interface IPreorderFrame {
  parent: Readonly<Parent>
  children: readonly Node[]
  collector: IShallowNodeCollector<Node>
  childIndex: number
  parentChildIndex: number
}

interface IPostorderFrame {
  parent: Readonly<Parent>
  children: readonly Node[]
  collector0: IShallowNodeCollector<Node>
  childIndex: number
  parentChildIndex: number
  nextChildren: Node[] | null
  collector1: IShallowNodeCollector<Node> | null
  nextChildIndex: number
}

export function* createPreorderMutation(
  immutableRoot: Readonly<Root>,
  isMatched: INodeMatcher,
): IMutation {
  const createFrame = (parent: Readonly<Parent>, parentChildIndex: number): IPreorderFrame => {
    const children = parent.children
    return {
      parent,
      children,
      collector: createShallowNodeCollector(children as Node[]),
      childIndex: 0,
      parentChildIndex,
    }
  }

  const stack: IPreorderFrame[] = [createFrame(immutableRoot, -1)]
  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.childIndex < frame.children.length) {
      const childIndex = frame.childIndex++
      const child = frame.children[childIndex] as Parent
      if (isMatched(child)) {
        const nextChild = yield { node: child, parent: frame.parent, childIndex }
        frame.collector.add(nextChild, child, childIndex)
      } else if (child.children?.length) {
        stack.push(createFrame(child, childIndex))
      } else {
        frame.collector.add(child, child, childIndex)
      }
      continue
    }

    const finalChildren: Node[] = frame.collector.collect()
    const result: Node =
      finalChildren === frame.children ? frame.parent : { ...frame.parent, children: finalChildren }
    stack.pop()

    if (stack.length <= 0) return result as Root

    const parentFrame = stack[stack.length - 1]
    const originalNode = parentFrame.children[frame.parentChildIndex]
    parentFrame.collector.add(result, originalNode, frame.parentChildIndex)
  }
  return immutableRoot
}

export function* createPostorderMutation(
  immutableRoot: Readonly<Root>,
  isMatched: INodeMatcher,
): IMutation {
  const createFrame = (parent: Readonly<Parent>, parentChildIndex: number): IPostorderFrame => {
    const children = parent.children
    return {
      parent,
      children,
      collector0: createShallowNodeCollector(children as Node[]),
      childIndex: 0,
      parentChildIndex,
      nextChildren: null,
      collector1: null,
      nextChildIndex: 0,
    }
  }

  const stack: IPostorderFrame[] = [createFrame(immutableRoot, -1)]
  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.nextChildren == null) {
      if (frame.childIndex < frame.children.length) {
        const childIndex = frame.childIndex++
        const child = frame.children[childIndex] as Parent
        if (child.children?.length) {
          stack.push(createFrame(child, childIndex))
        } else {
          frame.collector0.add(child, child, childIndex)
        }
        continue
      }

      frame.nextChildren = frame.collector0.collect()
      frame.collector1 = createShallowNodeCollector(frame.nextChildren)
    }

    if (frame.nextChildIndex < frame.nextChildren.length) {
      const childIndex = frame.nextChildIndex++
      const child = frame.nextChildren[childIndex]
      const nextChild = isMatched(child)
        ? yield { node: child, parent: frame.parent, childIndex }
        : child
      frame.collector1!.add(nextChild, child, childIndex)
      continue
    }

    const finalChildren: Node[] = frame.collector1!.collect()
    const result: Node =
      finalChildren === frame.children ? frame.parent : { ...frame.parent, children: finalChildren }
    stack.pop()

    if (stack.length <= 0) return result as Root

    const parentFrame = stack[stack.length - 1]
    const originalNode = parentFrame.children[frame.parentChildIndex]
    parentFrame.collector0.add(result, originalNode, frame.parentChildIndex)
  }
  return immutableRoot
}
