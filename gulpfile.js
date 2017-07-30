var gulp = require('gulp');
var sass = require('gulp-sass');
var nodemon = require('gulp-nodemon');
var less = require('gulp-less');
var header = require('gulp-header');
var pkg = require('./package.json');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cleanCss = require('gulp-clean-css');



// Set the banner for bootstrap template
var banner = ['/*!\n',
    ' * Start Bootstrap - New Age v3.3.7 (http://startbootstrap.com/template-overviews/new-age)\n',
    ' * Copyright 2013-' + (new Date()).getFullYear(), ' Start Bootstrap\n',
    ' * Licensed under MIT  (https://github.com/BlackrockDigital/startbootstrap/blob/gh-pages/LICENSE)\n',
    ' */\n',
    ''
].join('');

// minify JS
gulp.task('minify-js', function() {
     gulp.src('src/js/*.js')
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('public/js/'))
});

// Compile and Clean Sass
gulp.task('scss', function() {
    gulp.src('src/styles/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCss())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('public/css/'));
});

// Compile and clean Less from Bootstrap template
gulp.task('less', function(){
  gulp.src('src/styles/new-age.less')
      .pipe(less())
      .pipe(cleanCss())
      .pipe(rename({ suffix: '.min' }))
      .pipe(header(banner, { pkg: pkg }))
      .pipe(gulp.dest('public/css'))
});

// start server and run less, scss and minify js
gulp.task('start',['less', 'scss', 'minify-js'], function () {
  nodemon({
    script: 'index.js'
  , env: { 'NODE_ENV': 'development' }
  });
});

// watch less, scc and js files
gulp.task('watch', function() {
    gulp.watch('src/js/*.js',['minify-js']);
    gulp.watch('src/styles/*.scss',['scss']);
    gulp.watch('src/styles/*.less',['less']);

});

// run all
gulp.task('default', ['start', 'watch']);
