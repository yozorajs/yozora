// Official strict SemVer grammar (semver.org): numeric identifiers have no
// leading zeros; prerelease is non-empty dot-separated identifiers; build
// metadata is accepted but ignored for precedence.
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

function parse(v) {
  const m = SEMVER.exec(v)
  if (!m) return null
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? '' }
}

/**
 * SemVer precedence comparison; returns <0 / 0 / >0 for a<b / a==b / a>b.
 * Follows semver.org prerelease rules (a version with a prerelease ranks below
 * the same version without one; identifiers compared numerically when numeric,
 * else lexically). Throws on non-SemVer input.
 */
export function compare(a, b) {
  const pa = parse(a)
  const pb = parse(b)
  if (!pa) throw new Error(`Not a valid SemVer: ${a}`)
  if (!pb) throw new Error(`Not a valid SemVer: ${b}`)
  for (const k of ['major', 'minor', 'patch']) if (pa[k] !== pb[k]) return pa[k] - pb[k]
  if (pa.pre === pb.pre) return 0
  if (!pa.pre) return 1 // no prerelease outranks a prerelease
  if (!pb.pre) return -1
  const A = pa.pre.split('.')
  const B = pb.pre.split('.')
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    if (A[i] === undefined) return -1
    if (B[i] === undefined) return 1
    const numeric = /^\d+$/.test(A[i]) && /^\d+$/.test(B[i])
    if (numeric) {
      const d = Number(A[i]) - Number(B[i])
      if (d) return d
    } else if (A[i] !== B[i]) {
      return A[i] < B[i] ? -1 : 1
    }
  }
  return 0
}

/**
 * Compute the next lockstep version from the current one. `kind` is a semver
 * keyword (patch | minor | major) or an exact version string (e.g. a preview
 * like `2.4.0-alpha.0`). The result must be strictly greater than `current`
 * unless allowDowngrade is set (e.g. re-running a release). Throws on an
 * unknown keyword or an exact version that is not strict SemVer.
 */
export function bump(current, kind, { allowDowngrade = false } = {}) {
  const cur = parse(current)
  if (!cur) throw new Error(`Current version is not valid SemVer: ${current}`)

  let next
  if (/^\d/.test(kind)) {
    if (!parse(kind)) {
      throw new Error(
        `Invalid exact version: "${kind}" (expected strict SemVer, e.g. 2.4.0 or 2.4.0-alpha.0)`,
      )
    }
    next = kind
  } else {
    const table = {
      major: `${cur.major + 1}.0.0`,
      minor: `${cur.major}.${cur.minor + 1}.0`,
      patch: `${cur.major}.${cur.minor}.${cur.patch + 1}`,
    }
    if (!(kind in table)) {
      throw new Error(`Unknown bump type: "${kind}" (use patch | minor | major | x.y.z[-tag])`)
    }
    next = table[kind]
  }

  if (!allowDowngrade && compare(next, current) <= 0) {
    throw new Error(
      `Refusing ${current} → ${next}: next must be greater than current. ` +
        `Pass --allow-downgrade to override (e.g. re-publishing).`,
    )
  }
  return next
}
