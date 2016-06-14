'use strict';

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
var browserify = require('browserify');
var babelify = require('babelify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gulpif = require('gulp-if');

var production = process.env.NODE_ENV === 'production';

gulp.task('start', function () {
    nodemon({
        script: './server/main.js',
        watch: ['server'],
        ignore: ['gulpfile.js'],
        env: { 'NODE_ENV': process.env.NODE_ENV || 'development' }
    });
});

gulp.task('browserify', function () {
    return browserify({ entries: 'client/app.js', debug: true })
        .transform(babelify)
        .bundle()
        .pipe(source('app_bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(gulpif(production, uglify({ mangle: true })))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('client/static/build'))
        .pipe(livereload());
});

gulp.task('watch-static', function () {
    gulp.watch(['client/static/*.html'], function () {
        gulp.src(['client/static/*.html'])
            .pipe(livereload());
    });
});

gulp.task('watch-app', function () {
    gulp.watch(['client/*.js'], ['browserify']);
});


gulp.task('default', ['start', 'watch-static', 'watch-app'], function () {
    livereload.listen();
});