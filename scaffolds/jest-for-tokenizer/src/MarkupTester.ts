import type { Admonition, ImageReference, LinkReference, Node, Parent, Root } from '@yozora/ast'
import { AdmonitionType, ImageReferenceType, LinkReferenceType } from '@yozora/ast'
import type { IMarkupWeaver } from '@yozora/core-markup'
// eslint-disable-next-line import/no-extraneous-dependencies
import YozoraParser from '@yozora/parser'
import { BaseTester } from './BaseTester'
import type { IYozoraUseCase } from './types'

const parser = new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })

/**
 * Params for construct TokenizerTester
 */
interface IMarkupTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Markup weaver
   */
  weaver: IMarkupWeaver
}

export class MarkupTester<T = unknown> extends BaseTester<T> {
  public readonly weaver: IMarkupWeaver

  constructor(props: IMarkupTesterProps) {
    super(props)
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
      const expectedAst = parser.parse(input)
      const markup = this.weaver.weave(expectedAst)
      const receivedAst = parser.parse(markup)
      return { markup, expectedAst, receivedAst }
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

  protected _areSomeObject(o1: object, o2: object): boolean {
    const keys1 = Object.keys(o1)
    const keys2 = Object.keys(o2)
    if (keys1.length !== keys2.length) return false
    for (const key of keys1) {
      if (o1[key] !== o2[key]) return false
    }
    return true
  }
}
