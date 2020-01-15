// * Requires - Do Not Remove
const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const cssmin = require('gulp-cssmin');
const uglify = require('gulp-uglify');
const merge = require('gulp-merge');
const log = require('fancy-log');
const util = require('gulp-util');
const path = require('path');
const fs = require('fs');

// * GLOBS representing file locations
let outputDir = 'Dist';

//==========================
// * GULP TASKS
//==========================

var onError = function (err) {
  util.log(util.colors.red.bold('[ERROR ]:'), util.colors.bgRed(err));
  this.emit('end');
};

done  = () => {
  console.log("Done!");
}

gulp.task('build', done => {
  var folders = getFolders(process.cwd());
  done();
  return folders.map(function (folder) {
    // Do not process these folders.
    if (
      folder == 'node_modules' ||
      folder === 'Dist' ||
      folder === 'rss' ||
      folder === 'interactive'
    ) {
      return;
    }

    return merge(
      gulp
      .src(path.join(folder + '/**/**.css'))
      .pipe(concat(folder + '.css'))
      .pipe(gulp.dest(outputDir + '/css'))
      .pipe(cssmin())
      .pipe(rename(folder + '.min.css'))
      .pipe(gulp.dest(outputDir + '/css')),

      gulp
      .src([path.join(folder + '/**/**.js'), path.join('!' + folder + '/app.js')])
      .pipe(concat(folder.toLowerCase() + '.js'))
      .pipe(gulp.dest(outputDir))
      .pipe(uglify({
        mangle: false
      }).on('error', onError))
      .pipe(rename(folder.toLowerCase() + '.min.js'))
      .pipe(gulp.dest(outputDir + '/min'))
      .on('error', onError),

      gulp
      .src(path.join(folder + '**/app.js'))
      .pipe(gulp.dest(outputDir))
      .pipe(uglify({
        mangle: false
      }).on('error', onError))
      .pipe(rename('app.min.js'))
      .pipe(gulp.dest(outputDir + '/min'))
      .on('error', onError),

      gulp
      .src(path.join(folder + '/**/**.html'))
      .pipe(gulp.dest(outputDir + '/templates'))
    );

  });
});

//==========================
// * GULP HELPER FUNCTIONS
//==========================

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function (file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}