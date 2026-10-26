import { spawnSync } from 'node:child_process'

try {
  const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
    stdio: 'ignore',
  })
  if (result.error || result.status !== 0) {
    console.warn('Could not configure the repository pre-commit hook.')
  }
} catch {
  console.warn('Could not configure the repository pre-commit hook.')
}
