/**
 * Custom changelog functions for @changesets/cli
 * No GitHub API required - generates changelog from changeset summaries only
 *
 * @type {import('@changesets/types').ChangelogFunctions}
 */

export const getReleaseLine = async changeset => {
  const [firstLine, ...rest] = changeset.summary.split('\n').map(l => l.trimEnd())

  let result = `- ${firstLine}`
  if (rest.length > 0) {
    result += '\n' + rest.map(l => `  ${l}`).join('\n')
  }

  return result
}

export const getDependencyReleaseLine = async (_changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) return ''

  const updates = dependenciesUpdated.map(dep => `  - ${dep.name}@${dep.newVersion}`)

  return ['- Updated dependencies:', ...updates].join('\n')
}
