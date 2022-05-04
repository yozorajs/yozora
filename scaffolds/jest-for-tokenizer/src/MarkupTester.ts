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
      const markup: string = this._weaveAndFormat(input, filepath)
      expect(input).toEqual(markup)
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
    // const parseAnswer = this._parseAndFormat(useCase.input, filepath)
    // return { parseAnswer }
    return {}
  }

  /**
   * Parse and format.
   * Print case filepath when it failed.
   *
   * @param input
   * @param filepath
   */
  protected _weaveAndFormat(input: string, filepath: string): string {
    return this.carefulProcess<string>(filepath, () => {
      const ast = parser.parse(input)
      const markup = this.weaver.weave(ast)
      return markup
    })
  }
}
