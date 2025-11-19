const { execSync } = require('node:child_process')

if (process.env.CI === 'true') {
  console.log('CI=true -> skipping lefthook install')
  process.exit(0)
}

console.log('CI!=true -> running lefthook install')

try {
  execSync('lefthook install', { stdio: 'inherit' })
}
catch (err) {
  console.error('lefthook install failed')
  console.error(err)
  process.exit(1)
}
