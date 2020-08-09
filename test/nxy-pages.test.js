const test = require('ava')
const nxyPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => nxyPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(nxyPages('w'), 'w@zce.me')
  t.is(nxyPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
