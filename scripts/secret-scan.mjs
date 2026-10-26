import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'))
const allowedEmail = site.company?.email?.toLowerCase()
const staged = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM', '-z'], {
  cwd: fileURLToPath(root),
  encoding: 'buffer',
})

if (staged.error || staged.status !== 0) {
  console.error('Unable to list staged files for the secret scan.')
  process.exit(1)
}

const blockedPath = /(?:^|\/)(?:\.env(?:\.(?!example(?:$|\/))[^/]*)?|[^/]*\.(?:pem|key|p12|pfx)|id_rsa[^/]*|\.npmrc|\.mcp\.json|mcp\.json|credentials[^/]*\.json|service-account[^/]*\.json)$/i
const privateKeyPattern = new RegExp('-----BEGIN[\\s\\S]{0,100}?PRIVATE' + '\\s+KEY-----', 'g')
const secretPatterns = [
  /AKIA[0-9A-Z]{16}/g,
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}/g,
  /github_pat_[A-Za-z0-9_]{50,}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /AIza[0-9A-Za-z_-]{35}/g,
  /xox[baprs]-[0-9A-Za-z-]{10,}/g,
  privateKeyPattern,
  /https?:\/\/[^/\s:@]+:[^@\s]+@/g,
  /Bearer [A-Za-z0-9._-]{20,}/g,
  /(api[_-]?key|secret|token|passw(or)?d)\s*[:=]\s*["'][^"'\s]{12,}["']/gi,
]
const personalPath = /(?:[A-Za-z]:\\Users\\[^\s\\]+|\/Users\/[^\s/]+|\/home\/[^\s/]+)/g
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const files = staged.stdout.toString('utf8').split('\0').filter(Boolean)
const failures = []
let warnings = 0

function lineNumber(content, index) {
  let line = 1
  for (let offset = 0; offset < index; offset += 1) {
    if (content.charCodeAt(offset) === 10) line += 1
  }
  return line
}

function reportMatch(file, content, index, value) {
  failures.push(`${file}:${lineNumber(content, index)} ${value.slice(0, 4)}…`)
}

for (const file of files) {
  const normalized = file.replaceAll('\\', '/')
  if (blockedPath.test(normalized)) {
    failures.push(`${file}: forbidden staged path`)
    continue
  }

  const size = spawnSync('git', ['cat-file', '-s', `:${file}`], {
    cwd: fileURLToPath(root),
    encoding: 'utf8',
  })
  if (size.error || size.status !== 0) {
    console.error(`Unable to inspect staged file size: ${file}`)
    process.exitCode = 1
    continue
  }
  if (Number(size.stdout) > 2 * 1024 * 1024) continue

  const blob = spawnSync('git', ['cat-file', 'blob', `:${file}`], {
    cwd: fileURLToPath(root),
    encoding: 'buffer',
  })
  if (blob.error || blob.status !== 0) {
    console.error(`Unable to read staged file for scanning: ${file}`)
    process.exitCode = 1
    continue
  }
  if (blob.stdout.includes(0)) continue

  const content = blob.stdout.toString('utf8')
  for (const pattern of secretPatterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      reportMatch(file, content, match.index, match[0])
    }
  }

  personalPath.lastIndex = 0
  for (const match of content.matchAll(personalPath)) {
    warnings += 1
    console.warn(`${file}:${lineNumber(content, match.index)} warning: absolute personal path`)
  }

  emailPattern.lastIndex = 0
  for (const match of content.matchAll(emailPattern)) {
    if (match[0].toLowerCase() === allowedEmail) continue
    warnings += 1
    console.warn(`${file}:${lineNumber(content, match.index)} warning: email differs from site company email`)
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure))
  console.error(`Secret scan failed with ${failures.length} blocking finding(s).`)
  process.exit(1)
}

console.log(`Secret scan passed for ${files.length} staged file(s); ${warnings} warning(s).`)
