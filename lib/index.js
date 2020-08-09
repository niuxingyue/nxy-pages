const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')
const browserSync = require('browser-sync')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins() // 替换掉单个gulp插件文件引入

// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')


const bs = browserSync.create()

const cwd = process.cwd() // cwd代表的是当前命令行所在的工作目录

let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)  // 最好使用path.join()
  config = Object.assign({}, config, loadConfig)
} catch(e) {}

const clean = () => {
    return del([config.build.dist, config.build.temp])
}

// dest目标位置
// dist分发发布
// 样式转化
const style = () => {
    return src(config.build.paths.styles, {base: config.build.src, cwd: config.build.src}) // base是基准路径，会把src后面的路径保留下来
        .pipe(plugins.sass({ outputStyle: 'expanded' })) // outputStyle输出的格式，expanded表示完全展开
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

// 脚本转化
const script = () => {
    return src(config.build.paths.scripts, {base: config.build.src, cwd: config.build.src})
        .pipe(plugins.babel({ presets: [require('@babel/preset-env')]}))
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

// 页面转化
const page = () => {
    return src(config.build.paths.pages, {base: config.build.src, cwd: config.build.src}) // 'src/**/*.html'表示erc下的任意子目录的文件
        .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 防止模板缓存导致页面不能及时更新    
        .pipe(dest(config.build.temp))
        .pipe(bs.reload({ stream: true }))
}

// 图片压缩
const img = () => {
    return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}

// 字体图标
const font = () => {
    return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}

// 额外文件的处理
const extra = () => {
    return src('**', {base: config.build.public, cwd: config.build.public})
        .pipe(dest(config.build.dist))
}

// 浏览器热更新
const serve = () => {
    watch(config.build.paths.styles, {cwd: config.build.src}, style)
    watch(config.build.paths.scripts, {cwd: config.build.src}, script)
    watch(config.build.paths.pages, {cwd: config.build.src}, page)
    // 上线之前在操作下面的编译
    // watch('src/assets/images/**', img)
    // watch('src/assets/fonts/**', font)
    // watch('public/**', extra)
    // watch监听文件的变化并且编译到dist，dist文件发生变化就会触发browsersync设置的监听，从而浏览器内容发生变化
    watch([
        config.build.paths.images,
        config.build.paths.fonts,
        'public/**'
    ], {cwd: config.build.src}, bs.reload) // 这几个文件发生变化之后监听
    watch([
      '**'
    ], {cwd: config.build.public}, bs.reload)
    bs.init({
        notify: false, // 提示browsersync是否连接上
        port: 2080, // 端口设置
        // open: false, // 是否自动打开浏览器，默认是true
        // files: 'dist/**', // browsersync启动后被监听的路径通配符, 给每个任务后面加上.pipe(bs.reload({ stream: true }))，files就不需要了
        server: {
            baseDir: [config.build.temp, config.build.src, config.build.public], // 给web服务器指定网站的根目录,先从temp里面找，找不到就去src找，找不到就去public找
            routes: {
                '/node_modules': 'node_modules' // 相对路径，相对于网站根目录
            }// 单独加特殊路由，优先于baseDir，先看routes有没有配置
        }
    })
}

const useref = () => {
    return src(config.build.paths.pages, {base: config.build.temp, cwd: config.build.temp})
        .pipe(plugins.useref({searchPath: [config.build.temp, '.']})) // 指定去哪个目录找要处理的文件 '.'表示项目的根目录
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true, // 压缩html需要配置，默认只压缩属性中的空白字符，设置后折叠掉所有的空白字符和换行符
            minifyCSS: true, // 压缩页面上style里面的样式
            minifyJS: true // 压缩页面上script里面的样式
        })))
        .pipe(dest(config.build.dist)) // 不要将结果放在dist下，因为一个文件一边读一边写，读写没有分离开的话会可能会出现问题，文件写不进去
}

// 把任务组合
// 开发阶段用到的任务
const compile = parallel(style, script, page) // 并行组合
const develop = series(compile, serve)

// 上线之前用到的任务
const build = series(
    clean,
    parallel(
        series(compile, useref),
        img,
        font,
        extra
    )
)

module.exports = {
    clean,
    build,
    develop
}