// @ts-check

/**
 * A fixture and its expected representations.
 * @template [T=unknown]
 * @typedef {Readonly<{
 *   description: string,
 *   input: string,
 *   answer: IYozoraUseCaseAnswers<T>,
 * }>} IYozoraUseCase
 */

/**
 * Fixtures grouped by their directory and source file.
 * @template [T=unknown]
 * @typedef {Readonly<{
 *   dirpath: string,
 *   filepath: string,
 *   title?: string,
 *   cases: IYozoraUseCase<T>[],
 *   subGroups: IYozoraUseCaseGroup<T>[],
 * }>} IYozoraUseCaseGroup
 */

/** @typedef {'gfm' | 'gfm-ex' | 'yozora'} ParserName */

/**
 * Expected representations for one parser.
 * @template [T=unknown]
 * @typedef {Readonly<{ html?: string, markup?: string, ast?: T }>} IYozoraUseCaseAnswer
 */

/**
 * Each representation falls back from yozora to gfm-ex, then to gfm.
 * @template [T=unknown]
 * @typedef {Readonly<
 *   { gfm: IYozoraUseCaseAnswer<T> } &
 *   Partial<Record<'gfm-ex' | 'yozora', IYozoraUseCaseAnswer<T>>>
 * >} IYozoraUseCaseAnswers
 */

export {}
