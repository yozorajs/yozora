import type {
  Admonition,
  ImageReference,
  LinkReference,
  Node,
  Parent,
  Root,
  Text,
} from '@yozora/ast'
import { AdmonitionType, ImageReferenceType, LinkReferenceType, TextType } from '@yozora/ast'
import { removePositions } from '@yozora/ast-util'
import type { IParser } from '@yozora/core-parser'
import type { IMarkupWeaver } from '@yozora/markup-weaver'
import { BaseTester } from './BaseTester'
import type { IYozoraUseCase } from './types'

/**
 * Params for construct TokenizerTester
 */
interface IMarkupTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Parser
   */
  parser: IParser
  /**
   * Markup weaver
   */
  weaver: IMarkupWeaver
}

export class MarkupTester<T = unknown> extends BaseTester<T> {
  public readonly parser: IParser
  public readonly weaver: IMarkupWeaver

  constructor(props: IMarkupTesterProps) {
    super(props)
    this.parser = props.parser
    this.weaver = props.weaver
  }

  /**
   * Create test for a single use case
   *
   * @param useCase
   * @param filepath
   */
  protected override _testCase(useCase: IYozoraUseCase<T>, filepath: string): void {
    const { description, input, markupAnswer } = useCase

    test(description, async () => {
      const { markup, expectedAst, receivedAst } = this._weaveAndFormat(input, filepath)
      expect(markup).toEqual(markupAnswer)
      if (!this._areSameAST(receivedAst, expectedAst)) {
        expect(receivedAst).toEqual(expectedAst)
      }
    })
  }

  /**
   * Create an answer for a single use case
   *
   * @param useCase
   * @param filepath
   */
  protected override _answerCase(
    useCase: IYozoraUseCase<T>,
    filepath: string,
  ): Partial<IYozoraUseCase<T>> {
    const { markup } = this._weaveAndFormat(useCase.input, filepath)
    return { markupAnswer: markup }
  }

  /**
   * Parse and format.
   * Print case filepath when it failed.
   *
   * @param input
   * @param filepath
   */
  protected _weaveAndFormat(
    input: string,
    filepath: string,
  ): { markup: string; expectedAst: Root; receivedAst: Root } {
    return this.carefulProcess(filepath, () => {
      const expectedAst = this.parser.parse(input, { shouldReservePosition: true })
      const markup = this.weaver.weave(expectedAst)
      const receivedAst = this.parser.parse(markup, { shouldReservePosition: true })
      return {
        markup,
        expectedAst: this._normalizeAst(expectedAst),
        receivedAst: this._normalizeAst(receivedAst),
      }
    })
  }

  protected _areSameAST(node1: Node, node2: Node): boolean {
    const { children: children1, ...data1 } = node1 as Parent
    const { children: children2, ...data2 } = node2 as Parent

    if (node1.type !== node2.type) return false
    switch (node1.type) {
      case AdmonitionType: {
        const { title: title1, ...o1 } = data1 as Admonition
        const { title: title2, ...o2 } = data2 as Admonition
        if (title1.length !== title2.length) return false
        for (let i = 0; i < title1.length; ++i) {
          if (!this._areSameAST(title1[i], title2[i])) return false
        }
        if (!this._areSomeObject(o1, o2)) return false
        break
      }
      case LinkReferenceType:
      case ImageReferenceType: {
        const { referenceType: _r1, ...o1 } = data1 as LinkReference | ImageReference
        const { referenceType: _r2, ...o2 } = data2 as LinkReference | ImageReference
        if (!this._areSomeObject(o1, o2)) return false
        break
      }
      case TextType: {
        const { value: v1 } = node1 as Text
        const { value: v2 } = node2 as Text
        const normalize = (v: string): string => v.replace(/\\([\s\S])/g, '$1')
        if (normalize(v1) === normalize(v2)) return true
        return false
      }
      default:
        if (!this._areSomeObject(data1, data2)) return false
        break
    }

    if (children1 || children2) {
      if (children1?.length !== children2?.length) return false
      const _size = children1.length
      for (let i = 0; i < _size; ++i) {
        if (!this._areSameAST(children1[i], children2[i])) return false
      }
    }
    return true
  }

  protected _areSomeObject(o1: Record<string, unknown>, o2: Record<string, unknown>): boolean {
    const keys1 = Object.keys(o1)
    const keys2 = Object.keys(o2)
    if (keys1.length !== keys2.length) return false
    for (const key of keys1) {
      if (o1[key] !== o2[key]) return false
    }
    return true
  }

  protected _normalizeAst(ast: Root): Root {
    const root: Root = removePositions(ast)
    const content = JSON.stringify(root)
    return JSON.parse(content)
  }
}
