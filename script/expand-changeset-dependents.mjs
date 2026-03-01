import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const CHANGESET_DIR = path.join(ROOT_DIR, '.changeset')
const AUTO_CHANGESET_FILE = path.join(CHANGESET_DIR, 'zz-auto-dependents.md')
const BUMP_PRIORITY = { patch: 1, minor: 2, major: 3 }

function parseBumpFromLine(line) {
  const matched = line.match(/["']([^"']+)["']\s*:\s*(patch|minor|major)\s*$/)
  if (!matched) return null
  const [, packageName, bump] = matched
  return { packageName, bump }
}

function setMaxBump(target, packageName, bump) {
  const current = target.get(packageName)
  if (current == null || BUMP_PRIORITY[bump] > BUMP_PRIORITY[current]) {
    target.set(packageName, bump)
  }
}

function readChangesetBumps() {
  const bumpMap = new Map()
  const files = fs
    .readdirSync(CHANGESET_DIR)
    .filter(filename => filename.endsWith('.md') && filename.toLowerCase() !== 'readme.md')

  for (const filename of files) {
    const filepath = path.join(CHANGESET_DIR, filename)
    const content = fs.readFileSync(filepath, 'utf8')
    const frontmatterMatched = content.match(/^---\n([\s\S]*?)\n---\n/m)
    if (frontmatterMatched == null) continue

    const frontmatter = frontmatterMatched[1]
    for (const line of frontmatter.split('\n')) {
      const parsed = parseBumpFromLine(line.trim())
      if (parsed == null) continue
      setMaxBump(bumpMap, parsed.packageName, parsed.bump)
    }
  }

  return bumpMap
}

function collectWorkspacePackageDirs() {
  const roots = ['packages', 'tokenizers']
  const dirs = []
  for (const root of roots) {
    const baseDir = path.join(ROOT_DIR, root)
    if (!fs.existsSync(baseDir)) continue
    for (const dirent of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue
      const dirpath = path.join(baseDir, dirent.name)
      if (fs.existsSync(path.join(dirpath, 'package.json'))) {
        dirs.push(dirpath)
      }
    }
  }
  return dirs
}

function collectWorkspacePackages() {
  const packageMap = new Map()
  const packageDirs = collectWorkspacePackageDirs()

  for (const dirpath of packageDirs) {
    const pkg = JSON.parse(fs.readFileSync(path.join(dirpath, 'package.json'), 'utf8'))
    packageMap.set(pkg.name, {
      name: pkg.name,
      private: Boolean(pkg.private),
      dependencies: {
        ...pkg.dependencies,
        ...pkg.optionalDependencies,
        ...pkg.peerDependencies,
      },
    })
  }

  return packageMap
}

function buildDependentsMap(packageMap) {
  const dependentsMap = new Map()
  for (const packageName of packageMap.keys()) {
    dependentsMap.set(packageName, new Set())
  }

  for (const pkg of packageMap.values()) {
    for (const dependencyName of Object.keys(pkg.dependencies)) {
      if (!packageMap.has(dependencyName)) continue
      dependentsMap.get(dependencyName).add(pkg.name)
    }
  }

  return dependentsMap
}

function expandDependentsBumps(initialBumps, packageMap, dependentsMap) {
  const finalBumps = new Map(initialBumps)
  const initialPackages = new Set(initialBumps.keys())
  const pending = [...initialPackages]
  const seen = new Set()
  const addedReasonMap = new Map()

  while (pending.length > 0) {
    const packageName = pending.shift()
    if (packageName == null || seen.has(packageName)) continue
    seen.add(packageName)

    for (const dependentName of dependentsMap.get(packageName) ?? []) {
      const dependentPkg = packageMap.get(dependentName)
      if (dependentPkg == null || dependentPkg.private) continue

      const hadBump = finalBumps.has(dependentName)
      setMaxBump(finalBumps, dependentName, 'patch')

      if (!initialPackages.has(dependentName)) {
        if (!addedReasonMap.has(dependentName)) {
          addedReasonMap.set(dependentName, new Set())
        }
        addedReasonMap.get(dependentName).add(packageName)
      }

      if (!hadBump) pending.push(dependentName)
    }
  }

  return { finalBumps, initialPackages, addedReasonMap }
}

function writeAutoChangeset(addedBumps, addedReasonMap) {
  if (addedBumps.length === 0) {
    if (fs.existsSync(AUTO_CHANGESET_FILE)) fs.unlinkSync(AUTO_CHANGESET_FILE)
    console.log('No dependent packages need auto bumping.')
    return
  }

  const header = addedBumps.map(({ packageName, bump }) => `"${packageName}": ${bump}`).join('\n')

  const details = addedBumps.map(({ packageName }) => {
    const reasons = [...(addedReasonMap.get(packageName) ?? [])].sort()
    return `- ${packageName} (depends on: ${reasons.join(', ')})`
  })

  const content = [
    '---',
    header,
    '---',
    '',
    'Auto-added dependent packages so dependents are republished when dependencies are released.',
    ...details,
    '',
  ].join('\n')

  fs.writeFileSync(AUTO_CHANGESET_FILE, content, 'utf8')
  console.log(
    `Generated ${path.relative(ROOT_DIR, AUTO_CHANGESET_FILE)} with ${addedBumps.length} packages.`,
  )
}

function main() {
  if (fs.existsSync(AUTO_CHANGESET_FILE)) {
    fs.unlinkSync(AUTO_CHANGESET_FILE)
  }

  const initialBumps = readChangesetBumps()
  if (initialBumps.size === 0) {
    console.log('No changesets found, skip dependent expansion.')
    return
  }

  const packageMap = collectWorkspacePackages()
  const dependentsMap = buildDependentsMap(packageMap)
  const { finalBumps, initialPackages, addedReasonMap } = expandDependentsBumps(
    initialBumps,
    packageMap,
    dependentsMap,
  )

  const addedBumps = [...finalBumps.entries()]
    .filter(([packageName]) => !initialPackages.has(packageName))
    .map(([packageName, bump]) => ({ packageName, bump }))
    .sort((a, b) => a.packageName.localeCompare(b.packageName))

  writeAutoChangeset(addedBumps, addedReasonMap)
}

main()
