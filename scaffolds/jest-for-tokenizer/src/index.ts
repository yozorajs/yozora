import fs from 'fs-extra'
import path from 'path'
export * from './tester'
export * from './types'


const findPackageLocation = (p: string): string | never => {
  const stat = fs.statSync(p)
  if (stat.isDirectory()) {
    if (fs.existsSync(path.join(p, 'package.json'))) return p
  }

  const dir = path.dirname(p)
  if (dir === p) {
    throw new ReferenceError(
      'Cannot find package.json location of @yozora/jest-for-tokenizer.')
  }
  return findPackageLocation(dir)
}


// Root directory of cases carried in this package.
export const fixtureRootDirectory = path.join(
  findPackageLocation(__dirname),
  'fixtures'
)
