import invariant from '@yozora/invariant'
import fs from 'node:fs'
import path from 'node:path'
import { describe } from 'vitest'
import type { IYozoraUseCase, IYozoraUseCaseGroup } from './types'

type IPathMatcher = (relativeFilepath: string) => boolean

function normalizeRelativePath(filepath: string): string {
  return filepath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '')
}

function normalizePatternPath(pattern: string): string {
  return pattern.replace(/^\.?\//, '').replace(/\/+$/, '')
}

function hasGlobMagic(pattern: string): boolean {
  let escaped = false
  for (const ch of pattern) {
    if (escaped) {
      escaped = false
      continue
    }

    if (ch === '\\') {
      escaped = true
      continue
    }

    if (ch === '*' || ch === '?' || ch === '[' || ch === '{') {
      return true
    }
  }
  return false
}

function escapeRegExp(ch: string): string {
  return /[\\^$.*+?()[\]{}|]/.test(ch) ? `\\${ch}` : ch
}

function splitPatternSegments(pattern: string): string[] {
  const segments: string[] = []
  let segment = ''
  let escaped = false

  for (const ch of pattern) {
    if (escaped) {
      segment += `\\${ch}`
      escaped = false
      continue
    }

    if (ch === '\\') {
      escaped = true
      continue
    }

    if (ch === '/') {
      segments.push(segment)
      segment = ''
      continue
    }

    segment += ch
  }

  if (escaped) segment += '\\\\'
  segments.push(segment)
  return segments
}

function compileSegmentPattern(segmentPattern: string): RegExp {
  let regex = ''
  let escaped = false

  for (const ch of segmentPattern) {
    if (escaped) {
      regex += escapeRegExp(ch)
      escaped = false
      continue
    }

    if (ch === '\\') {
      escaped = true
      continue
    }

    if (ch === '*') {
      regex += '.*'
      continue
    }

    if (ch === '?') {
      regex += '.'
      continue
    }

    regex += escapeRegExp(ch)
  }

  if (escaped) regex += '\\\\'
  return new RegExp(`^${regex}$`)
}

function compileGlobMatcher(pattern: string): IPathMatcher {
  const rawSegments = splitPatternSegments(pattern)
  const segmentMatchers = rawSegments.map(segment =>
    segment === '**' ? null : compileSegmentPattern(segment),
  )

  const isMatch = (pathSegments: string[], patternIdx: number, pathIdx: number): boolean => {
    if (patternIdx >= rawSegments.length) return pathIdx >= pathSegments.length
    if (pathIdx > pathSegments.length) return false

    if (rawSegments[patternIdx] === '**') {
      for (let nextPathIdx = pathIdx; nextPathIdx <= pathSegments.length; ++nextPathIdx) {
        if (isMatch(pathSegments, patternIdx + 1, nextPathIdx)) return true
      }
      return false
    }

    if (pathIdx >= pathSegments.length) return false
    const matcher = segmentMatchers[patternIdx]
    if (matcher == null || !matcher.test(pathSegments[pathIdx])) return false
    return isMatch(pathSegments, patternIdx + 1, pathIdx + 1)
  }

  return (relativeFilepath: string): boolean => {
    const pathSegments = normalizeRelativePath(relativeFilepath).split('/')
    return isMatch(pathSegments, 0, 0)
  }
}

function createPathMatcher(rawPattern: string): IPathMatcher {
  const pattern = normalizePatternPath(rawPattern)
  if (pattern.length === 0) return () => false

  if (!hasGlobMagic(pattern)) {
    return (relativeFilepath: string): boolean =>
      relativeFilepath === pattern || relativeFilepath.startsWith(`${pattern}/`)
  }

  return compileGlobMatcher(pattern)
}

/**
 * Params for construct BaseTester
 */
export interface IBaseTesterProps {
  /**
   * Root directory of the use cases located
   */
  caseRootDirectory: string
}

export abstract class BaseTester<T = unknown> {
  protected readonly caseRootDirectory: string
  protected readonly formattedCaseRootDirectory: string
  protected readonly caseGroups: IYozoraUseCaseGroup<T>[]
  protected readonly visitedFilepathSet: Set<string>

  constructor(props: IBaseTesterProps) {
    const { caseRootDirectory } = props
    this.caseRootDirectory = path.normalize(caseRootDirectory)
    this.formattedCaseRootDirectory = this._formatDirpath(caseRootDirectory)
    this.caseGroups = []
    this.visitedFilepathSet = new Set<string>()
  }

  /**
   * Get the list of TestCaseGroup
   */
  public collect(): IYozoraUseCaseGroup<T>[] {
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
    const includeMatchers: IPathMatcher[] = []
    const excludeMatchers: IPathMatcher[] = []

    for (const item of [patterns].flat()) {
      const isExclude = item.startsWith('!')
      const matcher = createPathMatcher(isExclude ? item.slice(1) : item)
      if (isExclude) excludeMatchers.push(matcher)
      else includeMatchers.push(matcher)
    }

    const filepaths = this._collectFilepaths(caseRootDirectory)
      .filter((filepath): boolean => {
        const relativeFilepath = normalizeRelativePath(path.relative(caseRootDirectory, filepath))
        const matchedByInclude =
          includeMatchers.length === 0 || includeMatchers.some(match => match(relativeFilepath))
        if (!matchedByInclude) return false
        if (excludeMatchers.some(match => match(relativeFilepath))) return false
        return true
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
      caseGroup: IYozoraUseCaseGroup<T>,
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
        cases: caseGroup.cases.map(c => {
          const { description, input, markupAnswer, htmlAnswer, parseAnswer } = {
            ...c,
            ...this._answerCase(c, caseGroup.filepath),
          }
          return { description, input, markupAnswer, htmlAnswer, parseAnswer }
        }),
      }
      const content = this.stringify(result)
      fs.writeFileSync(caseGroup.filepath, content + '\n', 'utf-8')
    }

    // Generate answers
    const tasks: Promise<void>[] = []
    for (const caseGroup of this.collect()) {
      const task = answerUseCaseGroup(this.formattedCaseRootDirectory, caseGroup)
      tasks.push(task)
    }

    // Wait all tasks completed
    return Promise.all(tasks)
  }

  /**
   * Run all use cases
   */
  public runTest(): void {
    const testUseCaseGroup = (parentDir: string, caseGroup: IYozoraUseCaseGroup<T>): void => {
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
    const filter = (_key: string, value: unknown): unknown => {
      if (value instanceof RegExp) return value.source
      return value
    }
    return JSON.stringify(data, filter, 2)
  }

  /**
   * Format data
   * @param data
   */
  public format<T = unknown>(data: T): Partial<T> {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      if (val && val.type && val.position) {
        const { type, position, ...restData } = val
        return { type, position, ...restData }
      }

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
  public carefulProcess<T = unknown>(filepath: string, fn: () => T): T {
    try {
      const result = fn()
      return result
    } catch (error) {
      console.error(`[handle failed] ${filepath}`)
      throw error
    }
  }

  protected _collectFilepaths(rootDir: string): string[] {
    const normalizedRootDir = path.normalize(rootDir)
    const queue: string[] = [normalizedRootDir]
    const filepaths: string[] = []

    while (queue.length > 0) {
      const currentDir = queue.pop()
      if (currentDir == null) continue

      const dirents = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const dirent of dirents) {
        const filepath = path.join(currentDir, dirent.name)
        if (dirent.isDirectory()) {
          queue.push(filepath)
        } else if (dirent.isFile()) {
          filepaths.push(path.normalize(filepath))
        }
      }
    }

    return filepaths
  }

  /**
   * Extract ITokenizerUseCaseGroup from json file that holds the content of
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

    const content = fs.readFileSync(filepath, { encoding: 'utf8' })
    const data = JSON.parse(content)

    const cases: IYozoraUseCase<T>[] = (data.cases || []).map(
      (c: IYozoraUseCase<T>, index: number): IYozoraUseCase<T> => ({
        description: c.description || 'case#' + index,
        input: c.input,
        htmlAnswer: c.htmlAnswer,
        parseAnswer: c.parseAnswer,
        markupAnswer: c.markupAnswer,
      }),
    )

    const dirpath = this._formatDirpath(path.dirname(filepath))
    const createCaseGroup = (parentDirpath: string): IYozoraUseCaseGroup<T> => {
      const caseGroup: IYozoraUseCaseGroup<T> = {
        dirpath,
        filepath,
        title: data.title,
        cases,
        subGroups: [],
      }

      if (caseGroup.dirpath === parentDirpath) return caseGroup

      const wrapper: IYozoraUseCaseGroup<T> = {
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
      caseGroups: IYozoraUseCaseGroup<T>[],
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
        const commonDirpath = this._calcCommonDirpath(caseGroup.dirpath, dirpath)
        if (commonDirpath.length > longestCommonDirpath.length) {
          longestCommonDirpath = commonDirpath
          LCDIds = [i]
        } else if (commonDirpath.length === longestCommonDirpath.length) {
          LCDIds.push(i)
        }
      }

      if (longestCommonDirpath <= parentDirpath) return false

      invariant(
        LCDIds.length > 0 && LCDIds.every((x, i, A) => i === 0 || x - 1 === A[i - 1]),
        'LCDIds should be continuously increasing integers',
      )

      // try to create a new common parent
      const parentGroup: IYozoraUseCaseGroup<T> = {
        dirpath: longestCommonDirpath,
        filepath: longestCommonDirpath,
        title: undefined,
        cases,
        subGroups: [...LCDIds.map(i => caseGroups[i]), createCaseGroup(longestCommonDirpath)],
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
  protected abstract _testCase(useCase: IYozoraUseCase<T>, filepath: string): void

  /**
   * Create an answer for a single use case
   *
   * @param useCase
   * @param filepath
   */
  protected abstract _answerCase(
    useCase: IYozoraUseCase<T>,
    filepath: string,
  ): Partial<IYozoraUseCase<T>>
}
