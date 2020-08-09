#!/usr/bin/env node

process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..')) // require载入这个模块，resolve找到这个模块对应的路径传入的参数表示相对路径，要找的是../lib/index,对于我们项目来说要找的是根目录下的，在package中main配置的就是这个目录，所以使用'..'

require('gulp/bin/gulp')