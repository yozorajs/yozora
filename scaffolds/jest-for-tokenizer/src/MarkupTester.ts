import type { Root } from '@yozora/ast'
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
    const { description, input } = useCase

    test(description, async () => {
      const { markup, ast, ast2 } = this._weaveAndFormat(input, filepath)
      expect(ast).toEqual(ast2)
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
  ): { markup: string; ast: Root; ast2: Root } {
    return this.carefulProcess(filepath, () => {
      const ast = parser.parse(input)
      const markup = this.weaver.weave(ast)
      const ast2 = parser.parse(markup)
      return { markup, ast, ast2 }
    })
  }
}
