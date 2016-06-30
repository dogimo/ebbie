// Variables
//-------------------------------------
var gulp = require('gulp');

var browserSync = require('browser-sync').create();
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');

var rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
//var pngquant = require('imagemin-pngquant');
var spritesmith = require('gulp.spritesmith');
var csscomb = require('gulp-csscomb');
var combineMq = require('gulp-combine-mq');
var csso = require('gulp-csso');
var runSequence = require('run-sequence');
var sassdoc = require('sassdoc');

var sass = require('gulp-sass');
var neat = require('node-neat');
var normalize = require('node-normalize-scss');
//var styleguide = require('sc5-styleguide');
var del = require('del');

var src = 'src';
var dest = 'dest';
var scss = {
    src: src + '/sass/**/*.scss',
    dest: dest + '/css',
    filepath: src + '/sass/main.scss'
}
var css = {
    lib: src + '/css/lib/normalize.css',
    dest: dest + '/css/',
    filepath: dest + '/css/main.css'
}
var js = {
    src: [
        src + '/js/jquery-2.0.0.min.js',
        src + '/js/example.js'
    ],
    dest : dest + '/js',
    filepath: dest + '/js/main.js',
    filename: 'main.js'
}
var img = {
    imagemin: {
        src: [
            src + '/img/**/*.+(jpg|jpeg|png|gif|svg)',
            '!' + src + '/img/sprite/**/*'
        ],
        dest: dest + '/img'
    },
    sprite: {
        src: src + '/img/sprite/*.png',
        src2x: src + '/img/sprite/*@2x.png',
        dest: src + '/img',
        sass: src + '/sass'
    }
}

// browserSync Sync
//-------------------------------------
// Static Server + watching scss/html files
gulp.task('serve', function () {
    browserSync.init({
        server: {
            baseDir: dest
        }
    });
    gulp.watch([js.src], ['js-concat', ['js-clean']]);
    gulp.watch([scss.src], ['sass', 'sassdoc']);
    gulp.watch([dest + '/**/*.html']).on('change', browserSync.reload);
});

// Sass関連
//-------------------------------------
// Sass Compile, Autoprefixer、Sourcemaps生成
neat.with(scss.filepath);
gulp.task('sass', function () {
    return gulp.src(scss.src)
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [].concat(
                normalize.includePaths,
                neat.includePaths
            )
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 version'],
            cascade: true
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(scss.dest))
        .pipe(browserSync.stream());
});
gulp.task('sass:release', function () {
    return gulp.src(scss.src)
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(sass({
            includePaths: [].concat(
                normalize.includePaths,
                neat.includePaths
            )
        }))
        .pipe(autoprefixer({
            browsers: ['last 2 version'],
            cascade: true
        }))
        .pipe(gulp.dest(scss.dest));
});

gulp.task('sassdoc', function () {
    return gulp.src(scss.src)
        .pipe(sassdoc({
            dest: dest + '/sassdoc',
            verbose: true,
            display: {
                access: ['public', 'private'],
                alias: true,
                watermark: true,
            }
        }));
});

// SC5関連
//-------------------------------------
//var outputPath = dest + '/styleguide';
//gulp.task('styleguide:generate', function () {
//    return gulp.src(scss.src)
//        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
//        .pipe(styleguide.generate({
//            title: 'Styleguide',
//            server: true,
//            rootPath: outputPath,
//            overviewPath: 'sc5-overview.md',
//            port: 3001
//        }))
//        .pipe(gulp.dest(outputPath));
//});
//gulp.task('styleguide:applystyles', function () {
//    return gulp.src(scss.src)
//        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
//        .pipe(sass({
//            includePaths: [].concat(
//                normalize.includePaths,
//                neat.includePaths
//            )
//        }))
//        .pipe(styleguide.applyStyles())
//        .pipe(gulp.dest(outputPath));
//});

// JavaScript関連
//-------------------------------------
// jsの連結
gulp.task('js-concat', ['js-clean'], function () {
    return gulp.src(js.src)
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(concat(js.filename))
        .pipe(gulp.dest(js.dest))
        .pipe(browserSync.stream());
});
// jsの圧縮
gulp.task('js-uglify', function () {
    return gulp.src(js.filepath)
        .pipe(uglify({
            preserveComments: 'some' // /*! */ で始まるコメントコメントを残す
        }))
        .pipe(gulp.dest(js.dest));
});

// 連結、圧縮したJavascriptファイルの削除
gulp.task('js-clean', function (cb) {
    return del([js.filepath], cb);
});

// 画像関連
//-------------------------------------
// sprite画像作成
gulp.task('sprite', function () {
    var spriteData = gulp.src(img.sprite.src)
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(spritesmith({
            imgName: 'sprite.png',
            imgPath: '/img/sprite.png',
            cssName: '_sprite.scss',
            //cssFormat: 'scss',
            padding: 10,
            retinaSrcFilter: img.sprite.src2x,
            retinaImgName: 'sprite@2x.png',
            retinaImgPath: '/img/sprite@2x.png'
            //cssVarMap: function (sprite) {
            //    sprite.name = 'sprite-' + sprite.name;
            //}
        }))
    spriteData.img.pipe(gulp.dest(img.sprite.dest))
    spriteData.css.pipe(gulp.dest(img.sprite.sass))
    return spriteData;
});
// 画像の圧縮
gulp.task('imagemin', function () {
    return gulp.src(img.imagemin.src)
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            //use: [pngquant()]
        }))
        .pipe(gulp.dest(img.imagemin.dest));
});

// css関連
//-------------------------------------
// cssのプロパティ並び替え、MediaQueryを纏める、cssの圧縮
gulp.task('styles', function () {
    return gulp.src(css.filepath)
        .pipe(csscomb())
        .pipe(combineMq({
            beautify: false
        }))
        .pipe(gulp.dest(css.dest));
});
gulp.task('styles:release', function () {
    return gulp.src(css.filepath)
        .pipe(csscomb())
        .pipe(combineMq({
            beautify: false
        }))
        .pipe(csso())
        .pipe(gulp.dest(css.dest));
});

// Styleguide task
//-------------------------------------
//gulp.task('styleguide', ['styleguide:generate', 'styleguide:applystyles']);
//gulp.task('stylegd', ['styleguide'], function () {
//    // Start watching changes and update styleguide whenever changes are detected
//    // Styleguide automatically detects existing server instance
//    gulp.watch([scss.src], ['styleguide']);
//});

// Default task
//-------------------------------------
gulp.task('default', ['serve']);

// Build task
//-------------------------------------
gulp.task('build', function (callback) {
    return runSequence('js-clean', ['js-concat', 'sprite'], 'sass:release', 'sassdoc', 'imagemin', 'styles', callback);
});

// Release task
//-------------------------------------
gulp.task('release', function (callback) {
    return runSequence('js-clean', ['js-concat', 'sprite'], 'sass:release', 'sassdoc', ['js-uglify', 'imagemin'], 'styles:release', callback);
});
