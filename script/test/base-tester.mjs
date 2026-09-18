// @ts-check

import fs from 'node:fs'
import path from 'node:path'
import invariant from '@yozora/invariant'
import { describe } from 'vitest'

/** @import { IYozoraUseCase, IYozoraUseCaseGroup } from './types.mjs' */

/** @typedef {(relativeFilepath: string) => boolean} IPathMatcher */

/**
 * @param {string} filepath
 * @returns {string}
 */
function normalizeRelativePath(filepath) {
  return filepath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '')
}

/**
 * @param {string} pattern
 * @returns {string}
 */
function normalizePatternPath(pattern) {
  return pattern.replace(/^\.?\//, '').replace(/\/+$/, '')
}

/**
 * @param {string} pattern
 * @returns {boolean}
 */
function hasGlobMagic(pattern) {
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

/**
 * @param {string} ch
 * @returns {string}
 */
function escapeRegExp(ch) {
  return /[\\^$.*+?()[\]{}|]/.test(ch) ? `\\${ch}` : ch
}

/**
 * @param {string} pattern
 * @returns {string[]}
 */
function splitPatternSegments(pattern) {
  const segments = []
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

/**
 * @param {string} segmentPattern
 * @returns {RegExp}
 */
function compileSegmentPattern(segmentPattern) {
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

/**
 * @param {string} pattern
 * @returns {IPathMatcher}
 */
function compileGlobMatcher(pattern) {
  const rawSegments = splitPatternSegments(pattern)
  const segmentMatchers = rawSegments.map(segment =>
    segment === '**' ? null : compileSegmentPattern(segment),
  )

  /**
   * @param {string[]} pathSegments
   * @param {number} patternIdx
   * @param {number} pathIdx
   * @returns {boolean}
   */
  const isMatch = (pathSegments, patternIdx, pathIdx) => {
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

  return relativeFilepath => {
    const pathSegments = normalizeRelativePath(relativeFilepath).split('/')
    return isMatch(pathSegments, 0, 0)
  }
}

/**
 * @param {string} rawPattern
 * @returns {IPathMatcher}
 */
function createPathMatcher(rawPattern) {
  const pattern = normalizePatternPath(rawPattern)
  if (pattern.length === 0) return () => false

  if (!hasGlobMagic(pattern)) {
    return relativeFilepath =>
      relativeFilepath === pattern || relativeFilepath.startsWith(`${pattern}/`)
  }

  return compileGlobMatcher(pattern)
}

/** @typedef {{ caseRootDirectory: string }} IBaseTesterProps */

/**
 * Abstract hooks are enforced by their runtime stubs, since JSDoc cannot
 * require overrides during type checking.
 *
 * @abstract
 * @template [T=unknown]
 */
export class BaseTester {
  /**
   * @protected
   * @readonly
   * @type {string}
   */
  caseRootDirectory
  /**
   * @protected
   * @readonly
   * @type {string}
   */
  formattedCaseRootDirectory
  /**
   * @protected
   * @readonly
   * @type {IYozoraUseCaseGroup<T>[]}
   */
  caseGroups
  /**
   * @protected
   * @readonly
   * @type {Set<string>}
   */
  visitedFilepathSet

  /** @param {IBaseTesterProps} props */
  constructor(props) {
    const { caseRootDirectory } = props
    this.caseRootDirectory = path.normalize(caseRootDirectory)
    this.formattedCaseRootDirectory = this._formatDirpath(caseRootDirectory)
    this.caseGroups = []
    this.visitedFilepathSet = new Set()
  }

  /**
   * Get the list of TestCaseGroup
   * @returns {IYozoraUseCaseGroup<T>[]}
   */
  collect() {
    return this.caseGroups.slice()
  }

  reset() {
    this.caseGroups.splice(0, this.caseGroups.length)
    this.visitedFilepathSet.clear()
    return this
  }

  /**
   * Scan filepath for generating use-case group
   *
   * @param {string | string[]} patterns
   * @param {string} [caseRootDirectory]
   * @param {(filepath: string) => boolean} [isDesiredFilepath]
   * @returns {this}
   */
  scan(patterns, caseRootDirectory = this.caseRootDirectory, isDesiredFilepath = () => true) {
    /** @type {IPathMatcher[]} */
    const includeMatchers = []
    /** @type {IPathMatcher[]} */
    const excludeMatchers = []

    for (const item of [patterns].flat()) {
      const isExclude = item.startsWith('!')
      const matcher = createPathMatcher(isExclude ? item.slice(1) : item)
      if (isExclude) excludeMatchers.push(matcher)
      else includeMatchers.push(matcher)
    }

    const filepaths = this._collectFilepaths(caseRootDirectory)
      .filter(filepath => {
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
   * @returns {Promise<void | void[]>}
   */
  runAnswer() {
    /**
     * @param {string} parentDir
     * @param {IYozoraUseCaseGroup<T>} caseGroup
     * @returns {Promise<void>}
     */
    const answerUseCaseGroup = async (parentDir, caseGroup) => {
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
          const { description, input, answer } = {
            ...c,
            ...this._answerCase(c, caseGroup.filepath),
          }
          return { description, input, answer }
        }),
      }
      const content = this.stringify(result)
      fs.writeFileSync(caseGroup.filepath, content + '\n', 'utf-8')
    }

    // Generate answers
    /** @type {Promise<void>[]} */
    const tasks = []
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
  runTest() {
    /**
     * @param {string} parentDir
     * @param {IYozoraUseCaseGroup<T>} caseGroup
     * @returns {void}
     */
    const testUseCaseGroup = (parentDir, caseGroup) => {
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
   *
   * @param {unknown} data
   * @returns {string}
   */
  stringify(data) {
    /**
     * @param {string} _key
     * @param {unknown} value
     * @returns {unknown}
     */
    const filter = (_key, value) => {
      if (value instanceof RegExp) return value.source
      return value
    }
    return JSON.stringify(data, filter, 2)
  }

  /**
   * Format data
   *
   * @template [U=unknown]
   * @param {U} data
   * @returns {Partial<U>}
   */
  format(data) {
    const stringified = JSON.stringify(data, (key, val) => {
      if (val?.type && val.position) {
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
   * @template [U=unknown]
   * @param {string} filepath
   * @param {() => U} fn
   * @returns {U}
   */
  carefulProcess(filepath, fn) {
    try {
      const result = fn()
      return result
    } catch (error) {
      console.error(`[handle failed] ${filepath}`)
      throw error
    }
  }

  /**
   * @protected
   * @param {string} rootDir
   * @returns {string[]}
   */
  _collectFilepaths(rootDir) {
    const normalizedRootDir = path.normalize(rootDir)
    const queue = [normalizedRootDir]
    const filepaths = []

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
   * @protected
   * @param {string} filepath
   * @returns {void}
   */
  _scanForUseCaseGroup(filepath) {
    // Avoid duplicated scan
    if (this.visitedFilepathSet.has(filepath)) {
      console.warn(`[scan] ${filepath} has been scanned`)
      return
    }
    const content = fs.readFileSync(filepath, { encoding: 'utf8' })
    const data = JSON.parse(content)

    if (
      data?.cases === undefined &&
      data?.groups != null &&
      typeof data.groups === 'object' &&
      !Array.isArray(data.groups)
    ) {
      // Group metadata must stay out of caseGroups because runAnswer rewrites every group file.
      return
    }
    if (!Array.isArray(data?.cases)) {
      throw new TypeError(`Invalid fixture cases in ${filepath}`)
    }

    /** @type {IYozoraUseCase<T>[]} */
    const cases = data.cases.map(
      /** @param {IYozoraUseCase<T>} c @param {number} index */
      (c, index) => ({
        description: c.description || 'case#' + index,
        input: c.input,
        answer: c.answer,
      }),
    )
    this.visitedFilepathSet.add(filepath)

    const dirpath = this._formatDirpath(path.dirname(filepath))
    /**
     * @param {string} parentDirpath
     * @returns {IYozoraUseCaseGroup<T>}
     */
    const createCaseGroup = parentDirpath => {
      /** @type {IYozoraUseCaseGroup<T>} */
      const caseGroup = {
        dirpath,
        filepath,
        title: data.title,
        cases,
        subGroups: [],
      }

      if (caseGroup.dirpath === parentDirpath) return caseGroup

      /** @type {IYozoraUseCaseGroup<T>} */
      const wrapper = {
        dirpath: caseGroup.dirpath,
        filepath: caseGroup.dirpath,
        title: undefined,
        cases: [],
        subGroups: [caseGroup],
      }
      return wrapper
    }

    // Try to merge `result` into existing caseGroup
    /**
     * @param {string} parentDirpath
     * @param {IYozoraUseCaseGroup<T>[]} caseGroups
     * @returns {boolean}
     */
    const traverseCaseGroup = (parentDirpath, caseGroups) => {
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
      /** @type {number[]} */
      let LCDIds = []
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
      /** @type {IYozoraUseCaseGroup<T>} */
      const parentGroup = {
        dirpath: longestCommonDirpath,
        filepath: longestCommonDirpath,
        title: undefined,
        cases: [],
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
   * @protected
   * @param {string} dirpath
   * @returns {string}
   */
  _formatDirpath(dirpath) {
    const result = path.normalize(dirpath).replace(/[\\/]$/, '') + path.sep
    return result
  }

  /**
   * Calc common dirpath of two formatted dirpath
   *
   * @protected
   * @param {string} p1
   * @param {string} p2
   * @returns {string}
   */
  _calcCommonDirpath(p1, p2) {
    const x = p1.split(/[\\/]+/g)
    const y = p2.split(/[\\/]+/g)
    const z = []
    for (let i = 0; i < x.length && i < y.length; ++i) {
      if (x[i] !== y[i]) break
      z.push(x[i])
    }
    return this._formatDirpath(z.join(path.sep))
  }

  /**
   * Create test for a single use case
   *
   * @abstract
   * @protected
   * @param {IYozoraUseCase<T>} _useCase
   * @param {string} _filepath
   * @returns {void}
   */
  _testCase(_useCase, _filepath) {
    throw new Error('_testCase must be implemented by a subclass')
  }

  /**
   * Create an answer for a single use case
   *
   * @abstract
   * @protected
   * @param {IYozoraUseCase<T>} _useCase
   * @param {string} _filepath
   * @returns {Partial<IYozoraUseCase<T>>}
   */
  _answerCase(_useCase, _filepath) {
    throw new Error('_answerCase must be implemented by a subclass')
  }
}
