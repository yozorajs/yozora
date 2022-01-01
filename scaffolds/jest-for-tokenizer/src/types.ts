/**
 * ITokenizer UseCase
 */
export interface ITokenizerUseCase<T = unknown> {
  /**
   * Description of the use case
   */
  readonly description: string
  /**
   * Input content of the use case
   */
  readonly input: string
  /**
   * Parsed answer in html format
   */
  readonly htmlAnswer?: string
  /**
   * Parsed answer in json format
   */
  readonly parseAnswer?: T
}

/**
 * Group of ITokenizerUseCase
 */
export interface ITokenizerUseCaseGroup<T = unknown> {
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
  readonly cases: Array<ITokenizerUseCase<T>>
  /**
   * Sub use case group
   */
  readonly subGroups: Array<ITokenizerUseCaseGroup<T>>
}
