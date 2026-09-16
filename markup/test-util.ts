import { expect, test } from 'vitest'
import type { IYozoraUseCase } from '../script/test/index.mjs'
import { MarkupTester } from '../script/test/index.mjs'

/** Existing markup round-trip exclusions, retained during the package split. */
export const markupFixtureSelection = {
  excludeExamples: [
    '#036',
    '#310',
    '#333',
    '#334',
    '#335',
    '#336',
    '#337',
    '#359',
    '#503',
    '#535',
    '#554',
    '#572',
    '#601',
    '#602',
    '#615',
    '#625',
    '#626',
    '#629',
    '#632',
  ],
}

/** Compare each flavor's AST without imposing another flavor's markup spelling. */
export class RoundTripMarkupTester extends MarkupTester {
  protected override _testCase(useCase: IYozoraUseCase, filepath: string): void {
    test(useCase.description, () => {
      const { expectedAst, receivedAst } = this._weaveAndFormat(useCase.input, filepath)
      if (!this._areSameAST(receivedAst, expectedAst)) expect(receivedAst).toEqual(expectedAst)
    })
  }
}
