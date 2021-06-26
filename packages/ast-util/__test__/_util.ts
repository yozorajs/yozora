/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs-extra'
import path from 'path'

export const fixturesDir: string = path.join(__dirname, 'fixtures')

export const locateFixture = (...p: string[]): string =>
  path.join(fixturesDir, ...p)

export const loadJSONFixture = (...p: string[]): any => {
  const filepath = locateFixture(...p)
  return fs.readJsonSync(filepath)
}
