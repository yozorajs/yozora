/**
 * ITokenizer UseCase
 */
export interface IYozoraUseCase<T = unknown> {
  /**
   * Description of the use case
   */
  readonly description: string
  /**
   * Input content of the use case
   */
  readonly input: string
  /**
   * Expected representations, grouped by parser.
   */
  readonly answer: IYozoraUseCaseAnswers<T>
}

/**
 * Group of IYozoraUseCase
 */
export interface IYozoraUseCaseGroup<T = unknown> {
  /**
   * Directory path of the use case located
   */
  readonly dirpath: string
  /**
   * File path of the use case located
   */
  readonly filepath: string
  /**
   * Title of the use case group
   */
  readonly title?: string
  /**
   * Use cases of current group
   */
  readonly cases: IYozoraUseCase<T>[]
  /**
   * Sub use case group
   */
  readonly subGroups: IYozoraUseCaseGroup<T>[]
}

export type ParserName = 'gfm' | 'gfm-ex' | 'yozora'

/**
 * Expected representations for one parser.
 */
export interface IYozoraUseCaseAnswer<T = unknown> {
  readonly html?: string
  readonly markup?: string
  readonly ast?: T
}

/**
 * Each representation falls back from yozora to gfm-ex, then to gfm.
 */
export interface IYozoraUseCaseAnswers<T = unknown> {
  readonly gfm: IYozoraUseCaseAnswer<T>
  readonly 'gfm-ex'?: IYozoraUseCaseAnswer<T>
  readonly yozora?: IYozoraUseCaseAnswer<T>
}
