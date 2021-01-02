import type { TokenizerUseCase, TokenizerUseCaseGroup } from '../types'
import fs from 'fs-extra'
import path from 'path'
import globby from 'globby'


export abstract class BaseTokenizerTester<T extends unknown = unknown> {
  protected readonly caseRootDirectory: string
  protected readonly formattedCaseRootDirectory: string
  protected readonly caseGroups: TokenizerUseCaseGroup<T>[]
  protected readonly visitedFilepathSet: Set<string>

  public constructor(caseRootDirectory: string) {
    this.caseRootDirectory = path.normalize(caseRootDirectory)
    this.formattedCaseRootDirectory = this.formatDirpath(caseRootDirectory)
    this.caseGroups = []
    this.visitedFilepathSet = new Set<string>()
  }

  /**
   * Get the list of TestCaseGroup
   */
  public collect(): TokenizerUseCaseGroup<T>[] {
    return this.caseGroups.slice()
  }

  public reset(): this {
    this.caseGroups.splice(0, this.caseGroups.length)
    this.visitedFilepathSet.clear()
    return this
  }

  /**
   * Scan filepath for generating use-case group
   *
   * @param patterns          glob patterns
   * @param isDesiredFilepath test whether a filepath is desired
   */
  public scan(
    patterns: string | string[],
    isDesiredFilepath: (filepath: string) => boolean = () => true,
  ): this {
    const filepaths: string[] = globby
      .sync(patterns, {
        cwd: this.caseRootDirectory,
        absolute: true,
        onlyDirectories: false,
        onlyFiles: true,
        markDirectories: true,
        unique: true,
        braceExpansion: true,
        caseSensitiveMatch: true,
        dot: true,
        extglob: true,
        globstar: true,
        objectMode: false,
        stats: false,
      })
      .sort()

    for (const filepath of filepaths) {
      if (!isDesiredFilepath(filepath)) continue
      this.scanForUseCaseGroup(filepath)
    }
    return this
  }

  /**
   * Create answers for all use cases
   */
  public runAnswer(): Promise<void | void[]> {
    const answerUseCaseGroup = async (caseGroup: TokenizerUseCaseGroup<T>): Promise<void> => {
      if (caseGroup.dirpath === caseGroup.filepath) {
        // Test sub groups
        for (const subGroup of caseGroup.subGroups) {
          await answerUseCaseGroup(subGroup)
        }
        return
      }

      const cases: TokenizerUseCase<T>[] = caseGroup.cases
        .map(c => ({ ...c, ...this.answerCase(c) }))
      const result = { title: caseGroup.title, cases }
      const content = this.stringify(result)
      await fs.writeFile(caseGroup.filepath, content, 'utf-8')
    }

    // Generate answers
    const caseGroups = this.collect()
    const answerTasks = caseGroups.map(answerUseCaseGroup)

    // Wait all tasks completed
    return Promise.all(answerTasks)
  }

  /**
   * Run all use cases
   */
  public runTest(): void {
    const testUseCaseGroup = (caseGroup: TokenizerUseCaseGroup<T>) => {
      const self = this
      describe(caseGroup.title, function () {
        // Test current group use cases
        for (const kase of caseGroup.cases) {
          self.testCase(kase)
        }

        // Test sub groups
        for (const subGroup of caseGroup.subGroups) {
          testUseCaseGroup(subGroup)
        }
      })
    }

    // Run test
    const caseGroups = this.collect()
    caseGroups.forEach(testUseCaseGroup)
  }

  /**
   * Extract TokenizerUseCaseGroup from json file that holds the content of
   * the use case
   *
   * @param filepath  absolute filepath of json file
   */
  protected scanForUseCaseGroup(filepath: string): void {
    // Avoid duplicated scan
    if (this.visitedFilepathSet.has(filepath)) {
      console.warn(`[scan] ${ filepath } has been scanned`)
      return
    }
    this.visitedFilepathSet.add(filepath)

    const data = fs.readJSONSync(filepath)
    const title = data.title || path.parse(filepath).name
    const cases: TokenizerUseCase<T>[] = (data.cases || [])
      .map((c: TokenizerUseCase<T>, index: number): TokenizerUseCase<T> => ({
        description: c.description || ('case#' + index),
        input: c.input,
        htmlAnswer: c.htmlAnswer,
        parseAnswer: c.parseAnswer,
      }))

    const dirpath = this.formatDirpath(path.dirname(filepath))
    const createCaseGroup = (parentDirpath: string): TokenizerUseCaseGroup<T> => {
      const caseGroup: TokenizerUseCaseGroup<T> = {
        dirpath,
        filepath,
        title,
        cases,
        subGroups: [],
      }

      if (caseGroup.dirpath === parentDirpath) return caseGroup

      const wrapper: TokenizerUseCaseGroup<T> = {
        dirpath: caseGroup.dirpath,
        filepath: caseGroup.dirpath,
        title: path.relative(parentDirpath, caseGroup.dirpath).replace(/[\//]+/g, '/'),
        cases: [],
        subGroups: [caseGroup]
      }
      return wrapper
    }


    // Try to merge `result` into existing caseGroup
    const traverseCaseGroup = (caseGroups: TokenizerUseCaseGroup<T>[]): boolean => {
      for (const caseGroup of caseGroups) {
        if (caseGroup.dirpath !== caseGroup.filepath) continue
        if (!dirpath.startsWith(caseGroup.dirpath)) continue
        if (!traverseCaseGroup(caseGroup.subGroups)) {
          const result = createCaseGroup(caseGroup.dirpath)
          caseGroup.subGroups.push(result)
        }
        return true
      }
      return false
    }

    // If not belong to any existing case group,
    // regard it as one of the top level group
    if (!traverseCaseGroup(this.caseGroups)) {
      const result = createCaseGroup(this.formattedCaseRootDirectory)
      this.caseGroups.push(result)
    }
  }

  /**
   * Format result data before saved to file
   * @param data
   */
  protected stringify(data: unknown): string {
    const filter = (key: string, value: unknown) => {
      if (value instanceof RegExp) return value.source
      return value
    }
    return JSON.stringify(data, filter, 2)
  }

  /**
   * Format dir path
   *
   * @param dirpath
   */
  protected formatDirpath(dirpath: string): string {
    const result = path.normalize(dirpath).replace(/[/\/]$/, '') + path.sep
    return result
  }

  /**
   * Create test for a single use case
   *
   * @param useCase
   */
  protected abstract testCase(useCase: TokenizerUseCase<T>): void

  /**
   * Create an answer for a single use case
   *
   * @param useCase
   */
  protected abstract answerCase(useCase: TokenizerUseCase<T>): Partial<TokenizerUseCase<T>>
}
