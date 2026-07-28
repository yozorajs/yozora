# GFM fixture synchronization

`sync.mjs` is the single writer for `examples.json`, `source.json`, and the `fixtures/gfm` and
`fixtures/gfm-new` directories. `groups.json` is the explicit grouping input for matched fixtures.

## Contract

- Input: an HTTPS GFM document plus an explicit SHA-256 digest for write mode.
- Output: matched fixtures in `gfm` and source-only fixtures in `gfm-new`. An answered fixture that no
  longer matches any upstream example aborts the sync.
- State owner and only CLI writer: `sync.mjs`; `generate.mjs` provides its exact-input partition and
  transactional writer as an imported module.
- Data flow: upstream HTML → extracted examples → exact-input multiset match → validated staging →
  transactional artifact swap.
- Failure strategy: abort before writes on invalid input, invalid grouping, or an orphaned answered
  fixture; roll back installed artifacts if a swap fails. A rollback failure preserves backup artifacts
  and reports their paths through the thrown error.
- Concurrency: a lock serializes writers, and a baseline fingerprint rejects plans built from stale
  fixture state. Locks owned by exited processes are recovered automatically when no transaction
  artifacts remain; unresolved staging or backup artifacts keep synchronization fail-closed and are
  reported for manual recovery.
- Network timeout: 30 seconds. Maximum source size: 10 MiB.

## Workflow

Inspect the current upstream document without writing:

```sh
node script/fixtures/gfm/sync.mjs --inspect
```

Verify the pinned source and all checked-in fixtures:

```sh
pnpm sync:gfm
```

After reviewing the inspected metadata and updating `groups.json` when required, write an approved
upstream revision by repeating its exact digest:

```sh
node script/fixtures/gfm/sync.mjs --write --expected-sha256 <sha256>
```

Write mode preserves `markupAnswer` and `parseAnswer` by exact input, prefers same-number matches for
duplicate inputs, and fails before installation if the grouping does not cover the matched fixtures or
if an answered fixture no longer matches upstream.
