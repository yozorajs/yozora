/* eslint-disable jest/valid-title */
/* eslint-disable jest/no-export */
import type { YastParser } from '@yozora/core-parser'
import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import invariant from 'tiny-invariant'
import type { TokenizerUseCase, TokenizerUseCaseGroup } from './types'

/**
 * Params for construct TokenizerTester
 */
export interface TokenizerTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
  /**
   * Parser
   */
  parser: YastParser
}

export class TokenizerTester<T extends unknown = unknown> {
  public readonly parser: YastParser
  protected readonly caseRootDirectory: string
  protected readonly formattedCaseRootDirectory: string
  protected readonly caseGroups: Array<TokenizerUseCaseGroup<T>>
  protected readonly visitedFilepathSet: Set<string>

  constructor(props: TokenizerTesterProps) {
    const { caseRootDirectory, parser } = props
    this.parser = parser
    this.caseRootDirectory = path.normalize(caseRootDirectory)
    this.formattedCaseRootDirectory = this._formatDirpath(caseRootDirectory)
    this.caseGroups = []
    this.visitedFilepathSet = new Set<string>()
  }

  /**
   * Get the list of TestCaseGroup
   */
  public collect(): Array<TokenizerUseCaseGroup<T>> {
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
    caseRootDirectory = this.caseRootDirectory,
    isDesiredFilepath: (filepath: string) => boolean = () => true,
  ): this {
    const filepaths: string[] = globby
      .sync(patterns, {
        cwd: caseRootDirectory,
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
      this._scanForUseCaseGroup(filepath)
    }
    return this
  }

  /**
   * Create answers for all use cases
   */
  public runAnswer(): Promise<void | void[]> {
    const answerUseCaseGroup = async (
      parentDir: string,
      caseGroup: TokenizerUseCaseGroup<T>,
    ): Promise<void> => {
      if (caseGroup.dirpath === caseGroup.filepath) {
        // Test sub groups
        for (const subGroup of caseGroup.subGroups) {
          await answerUseCaseGroup(caseGroup.dirpath, subGroup)
        }
        return
      }

      const result = {
        title: caseGroup.title || caseGroup.dirpath.slice(parentDir.length),
        cases: caseGroup.cases.map(c => ({
          ...c,
          ...this._answerCase(c, caseGroup.filepath),
        })),
      }
      const content = this.stringify(result)
      await fs.writeFile(caseGroup.filepath, content, 'utf-8')
    }

    // Generate answers
    const tasks: Array<Promise<void>> = []
    for (const caseGroup of this.collect()) {
      const task = answerUseCaseGroup(
        this.formattedCaseRootDirectory,
        caseGroup,
      )
      tasks.push(task)
    }

    // Wait all tasks completed
    return Promise.all(tasks)
  }

  /**
   * Run all use cases
   */
  public runTest(): void {
    const testUseCaseGroup = (
      parentDir: string,
      caseGroup: TokenizerUseCaseGroup<T>,
    ): void => {
      const self = this
      const title = caseGroup.title || caseGroup.dirpath.slice(parentDir.length)
      describe(title, function () {
        // Test current group use cases
        for (const kase of caseGroup.cases) {
          self._testCase(kase, caseGroup.filepath)
        }

        // Test sub groups
        for (const subGroup of caseGroup.subGroups) {
          testUseCaseGroup(caseGroup.dirpath, subGroup)
        }
      })
    }

    // Run test
    for (const caseGroup of this.collect()) {
      testUseCaseGroup(this.formattedCaseRootDirectory, caseGroup)
    }
  }

  /**
   * Format result data before saved to file
   * @param data
   */
  public stringify(data: unknown): string {
    const filter = (key: string, value: unknown): unknown => {
      if (value instanceof RegExp) return value.source
      return value
    }
    return JSON.stringify(data, filter, 2)
  }

  /**
   * Format data
   * @param data
   */
  public format<T extends unknown = unknown>(data: T): Partial<T> {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      switch (key) {
        default:
          return val
      }
    })
    return JSON.parse(stringified)
  }

  /**
   * Print filepath info when the handling failed
   *
   * @param filepath
   * @param fn
   */
  public trackHandle<T extends unknown = unknown>(
    filepath: string,
    fn: () => T,
  ): T {
    try {
      const result = fn()
      return result
    } catch (error) {
      console.error(`[handle failed] ${filepath}`)
      throw error
    }
  }

  /**
   * Extract TokenizerUseCaseGroup from json file that holds the content of
   * the use case
   *
   * @param filepath  absolute filepath of json file
   */
  protected _scanForUseCaseGroup(filepath: string): void {
    // Avoid duplicated scan
    if (this.visitedFilepathSet.has(filepath)) {
      console.warn(`[scan] ${filepath} has been scanned`)
      return
    }
    this.visitedFilepathSet.add(filepath)

    const data = fs.readJSONSync(filepath)
    const cases: Array<TokenizerUseCase<T>> = (data.cases || []).map(
      (c: TokenizerUseCase<T>, index: number): TokenizerUseCase<T> => ({
        description: c.description || 'case#' + index,
        input: c.input,
        htmlAnswer: c.htmlAnswer,
        parseAnswer: c.parseAnswer,
      }),
    )

    const dirpath = this._formatDirpath(path.dirname(filepath))
    const createCaseGroup = (
      parentDirpath: string,
    ): TokenizerUseCaseGroup<T> => {
      const caseGroup: TokenizerUseCaseGroup<T> = {
        dirpath,
        filepath,
        title: data.title,
        cases,
        subGroups: [],
      }

      if (caseGroup.dirpath === parentDirpath) return caseGroup

      const wrapper: TokenizerUseCaseGroup<T> = {
        dirpath: caseGroup.dirpath,
        filepath: caseGroup.dirpath,
        title: undefined,
        cases: [],
        subGroups: [caseGroup],
      }
      return wrapper
    }

    // Try to merge `result` into existing caseGroup
    const traverseCaseGroup = (
      parentDirpath: string,
      caseGroups: Array<TokenizerUseCaseGroup<T>>,
    ): boolean => {
      for (const caseGroup of caseGroups) {
        if (caseGroup.dirpath !== caseGroup.filepath) continue
        if (!dirpath.startsWith(caseGroup.dirpath)) continue
        if (!traverseCaseGroup(caseGroup.dirpath, caseGroup.subGroups)) {
          const result = createCaseGroup(caseGroup.dirpath)
          caseGroup.subGroups.push(result)
        }
        return true
      }

      // Find the caseGroup which has the longest common dirpath with `dirpath`
      let longestCommonDirpath = parentDirpath
      let LCDIds: number[] = []
      for (let i = 0; i < caseGroups.length; ++i) {
        const caseGroup = caseGroups[i]
        const commonDirpath = this._calcCommonDirpath(
          caseGroup.dirpath,
          dirpath,
        )
        if (commonDirpath.length > longestCommonDirpath.length) {
          longestCommonDirpath = commonDirpath
          LCDIds = [i]
        } else if (commonDirpath.length === longestCommonDirpath.length) {
          LCDIds.push(i)
        }
      }

      if (longestCommonDirpath <= parentDirpath) return false

      invariant(
        LCDIds.length > 0 &&
          LCDIds.every((x, i, A) => i === 0 || x - 1 === A[i - 1]),
        'LCDIds should be continuously increasing integers',
      )

      // try to create a new common parent
      const parentGroup: TokenizerUseCaseGroup<T> = {
        dirpath: longestCommonDirpath,
        filepath: longestCommonDirpath,
        title: undefined,
        cases,
        subGroups: [
          ...LCDIds.map(i => caseGroups[i]),
          createCaseGroup(longestCommonDirpath),
        ],
      }
      caseGroups.splice(LCDIds[0], LCDIds.length, parentGroup)
      return true
    }

    // If not belong to any existing case group,
    // regard it as one of the top level group
    if (!traverseCaseGroup(this.formattedCaseRootDirectory, this.caseGroups)) {
      const result = createCaseGroup(this.formattedCaseRootDirectory)
      this.caseGroups.push(result)
    }
  }

  /**
   * Format dir path
   *
   * @param dirpath
   */
  protected _formatDirpath(dirpath: string): string {
    const result = path.normalize(dirpath).replace(/[\\/]$/, '') + path.sep
    return result
  }

  /**
   * Calc common dirpath of two formatted dirpath
   *
   * @param p1
   * @param p2
   */
  protected _calcCommonDirpath(p1: string, p2: string): string {
    const x: string[] = p1.split(/[\\/]+/g)
    const y: string[] = p2.split(/[\\/]+/g)
    const z: string[] = []
    for (let i = 0; i < x.length && i < y.length; ++i) {
      if (x[i] !== y[i]) break
      z.push(x[i])
    }
    return this._formatDirpath(z.join(path.sep))
  }

  /**
   * Create test for a single use case
   *
   * @param useCase
   * @param filepath
   */
  protected _testCase(useCase: TokenizerUseCase<T>, filepath: string): void {
    const self = this
    const { description, input } = useCase
    test(description, async function () {
      const parseAnswer = self._parseAndFormat(input, filepath)
      expect(useCase.parseAnswer).toEqual(parseAnswer)
    })
  }

  /**
   * Create an answer for a single use case
   *
   * @param useCase
   * @param filepath
   */
  protected _answerCase(
    useCase: TokenizerUseCase<T>,
    filepath: string,
  ): Partial<TokenizerUseCase<T>> {
    const parseAnswer = this._parseAndFormat(useCase.input, filepath)
    return { parseAnswer }
  }

  /**
   * Parse and format.
   * Print case filepath when it failed.
   *
   * @param input
   * @param filepath
   */
  protected _parseAndFormat(input: string, filepath: string): any {
    return this.trackHandle<any>(filepath, () => {
      const output = this.parser.parse(input)
      const formattedOutput = this.format(output)
      return formattedOutput
    })
  }
}
