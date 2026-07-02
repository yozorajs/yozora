import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CHANGELOG_HEADER = '# Change Log'

function tagExists(rootDir, tag) {
  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], {
      cwd: rootDir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function gitSubjects(rootDir, range) {
  const args = ['log', '--pretty=%s', '--no-merges']
  if (range) args.push(range)
  const raw = execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' }).trim()
  if (!raw) return []
  return raw.split('\n').filter(s => !/^:bookmark:/.test(s)) // drop release commits
}

function isAncestor(rootDir, ref) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ref, 'HEAD'], {
      cwd: rootDir,
      stdio: 'ignore',
    })
    return true
  } catch {
    return false // exit 1 = not an ancestor (or unresolved ref)
  }
}

/** The most recent v* tag reachable from HEAD, or null when the repo has none. */
function latestTag(rootDir) {
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*'], {
      cwd: rootDir,
      encoding: 'utf8',
    }).trim()
  } catch {
    return null
  }
}

/**
 * Conventional-commit subjects for the release: commits since the previous
 * release tag `v<current>`. That tag must exist AND be an ancestor of HEAD
 * (enforces tag discipline so the `${tag}..HEAD` range is exact). When it is
 * missing, firstRelease falls back to the range since the most recent v* tag —
 * only a brand-new repo with no v* tag at all uses the full history. Throws when
 * the tag is missing / non-ancestor and firstRelease is not set.
 */
export function commitsForRelease(rootDir, current, { firstRelease = false } = {}) {
  const tag = `v${current}`
  if (tagExists(rootDir, tag)) {
    if (!isAncestor(rootDir, `refs/tags/${tag}`)) {
      throw new Error(
        `Tag ${tag} exists but is not an ancestor of HEAD; the range ${tag}..HEAD would be wrong.\n` +
          `Fetch tags or repair ${tag} (it may point to a different history).`,
      )
    }
    return gitSubjects(rootDir, `${tag}..HEAD`)
  }
  if (firstRelease) {
    // v<current> is missing (e.g. migrating in): start from the latest existing
    // v* tag instead of dumping the whole repo history; only a repo with no v*
    // tag at all falls back to full history.
    const fallback = latestTag(rootDir)
    return gitSubjects(rootDir, fallback ? `${fallback}..HEAD` : null)
  }
  throw new Error(
    `Expected previous-release tag ${tag} to exist, but it does not.\n` +
      `Tag the current release first (git tag ${tag} <commit>), or pass --first-release ` +
      `to generate the changelog since the latest v* tag.`,
  )
}

/** Render one release block: `## <version> (<date>)` followed by one bullet per line. */
export function changelogBlock(version, date, lines) {
  const body = lines.length ? lines.map(l => `- ${l}`).join('\n') : `- Release v${version}`
  return `## ${version} (${date})\n\n${body}\n`
}

/**
 * Prepend a release block just below the `# Change Log` header of
 * `<dir>/CHANGELOG.md` (created with a header if absent). Idempotent for the
 * same version: if the current top block is already for `version`, it is
 * replaced rather than duplicated — safe to re-run a failed release.
 */
export function prependChangelog(dir, version, block) {
  const path = join(dir, 'CHANGELOG.md')
  let content = ''
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    content = `${CHANGELOG_HEADER}\n`
  }
  let rest = content.startsWith(CHANGELOG_HEADER)
    ? content.slice(CHANGELOG_HEADER.length).replace(/^\n+/, '')
    : content
  const top = /^## (\S+)/.exec(rest)
  if (top && top[1] === version) {
    const nextBlock = rest.indexOf('\n## ', 1)
    rest = nextBlock >= 0 ? rest.slice(nextBlock + 1) : ''
  }
  writeFileSync(path, `${CHANGELOG_HEADER}\n\n${block}\n${rest}`)
}
