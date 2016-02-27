'use strict';

var gulp = require('gulp');
var insert = require('gulp-insert');
var fs = require('fs');
var rename = require('gulp-rename');
var base64 = require('base64-js');
var compressor = require('node-minify');

/*************************
 * Minify FourJS: Minifies the FourJS files
 *
 */
var MinifyFourJs = {};

MinifyFourJs.fourJsVersion = "1.0.0";
MinifyFourJs.fourJsFileList = [
  'vendor/underscore.min.js',
  'vendor/signals.min.js',
  'vendor/threejs/original/system.min.js',
  'vendor/threejs/original/build/three.js',
  'vendor/threejs/original/examples/js/controls/OrbitControls.js',
  'vendor/threejs/original/examples/js/controls/DeviceOrientationControls.js',
  'vendor/threejs/patched/examples/js/loaders/OBJLoader.js',
  'vendor/threejs/patched/examples/js/loaders/MaterialLoader.js',
  'vendor/threejs/patched/src/loaders/ObjectLoader.js',
  'vendor/threejs/patched/examples/js/loaders/TextureLoader.js',
  'vendor/threejs/original/examples/js/renderers/Projector.js',
  'vendor/threejs/patched/examples/js/effects/StereoEffect.js',
  'src/threex/threex.arrowmodelobject/threex.arrowmodelobject.js',
  'src/threex/threex.audioobject.js',
  'src/threex/threex.callout/threex.callout.js',
  'src/threex/threex.callout/threex.calloutgeometry.js',
  'src/threex/threex.buttonobject.js',
  'src/threex/threex.imageobject/threex.imageobject.js',
  'src/threex/threex.posrotscaanimation/threex.posrotsca.js',
  'src/threex/threex.posrotscaanimation/threex.posrotscaanimation.js',
  'src/threex/threex.textgeometry/threex.textgeometry.js',
  'src/threex/threex.touchparams.js',
  'src/threex/threex.tweencontrols/threex.tweencontrols.js',
  'src/threex/threex.videoobject/threex.videoobject.js',
  'src/threex/threex.dynamictexture/threex.text2dobject.js',
  'src/threex/threex.dynamictexture/threex.dynamictexture.js',
  'src/threex/threex.sprite2dobject.js',
  'src/threex/threex.scripts.js',
  'src/threex/threex.gui.js',
  'src/threex/threex.text/fonts/droid/droid_serif_regular.typeface.js',
  'src/threex/threex.text/fonts/helvetiker_regular.typeface.js',
  'src/threex/threex.text/threex.text.js',
  'src/threex/threex.galleryobject.js',
  'src/threex/threex.dommirror.js',
  'src/app-lib/scene-viewer.js',
  'src/app-lib/renderer.js',
  'src/app-lib/loader.js',
  'src/app-lib/api-access-v2.js',
  'src/app-lib/sockets.js',
  'src/app-lib/scanning-indicator.js',
  'src/app-lib/loading-indicator.js'
];

MinifyFourJs.minify = function() {

  // Build the assets.
  EmbeddedAssets.buildEmbeddedAssetsFile();

  var allFiles = MinifyFourJs.fourJsFileList.slice(0, MinifyFourJs.fourJsFileList.length);
  allFiles.unshift(EmbeddedAssets.assetsFilePath);

  var uncompressed = new compressor.minify({
    type: 'no-compress',
    fileIn: allFiles,
    fileOut: "dist/fourjs-" + MinifyFourJs.fourJsVersion + ".js",
    callback: function (err, min) {
      if (!err) {
        console.log("Concatenated version created successfully");
      } else {
        console.log(err);
      }
    }
  });
};

/*************************
 * Build Embedded Assets: The functions in this section are for building the embedded assets files.
 *   The problem we were facing was that THREE.js files sometimes had common images or geometry files.
 *   Examples are placeholder images for image and video objects, and shape/geometry files for arrows.
 *   The objects used to sit as files in 4dstudio, hence on a server, but for FourJS and mobile this
 *   did not work too well.
 *
 *   The solution was to convert the files to base64, put them in a JS file, and then add that file
 *   to the fourjs-0.0.0.js file. These routines take all files in assets (with the obvious exception
 *   of embedded-assets.js) and convert them to base64. The identifier for the object is the path,
 *   so for the image placeholder in assets/png/i4ds/placeholders/image.png the entry is added
 *
 *     FourJS.Assets["png/i4ds/placeholders/image.png"] = "data:image/png;base64,iVBORw0K...x==";
 *
 *   To add files to the assets, simply put them in the assets directory. If you are adding a new OBJ file,
 *   just create the subdirectories and add the file wherever.
 */

var EmbeddedAssets = {};

EmbeddedAssets.pathRoot = 'assets';
EmbeddedAssets.watchDirectories = ['assets/**/*.*'];
EmbeddedAssets.assetsFilePath = 'dist/embedded-assets.js';

EmbeddedAssets.buildEmbeddedAssetsFile = function() {
  fs.writeFileSync('dist/embedded-assets.js', EmbeddedAssets.convertResourcesToBase64());
};

EmbeddedAssets.readResourceFiles = function(rootPath, currentPath) {
  var fileList = [];
  var dir = rootPath+'/'+currentPath;
  var files = fs.readdirSync(dir);
  var childFileList;
  for(var i=0; i<files.length; i++) {
    var fileName = files[i];
    var stats = fs.statSync(dir+'/'+fileName);
    if(stats.isDirectory()) {
      childFileList = EmbeddedAssets.readResourceFiles(rootPath, currentPath+'/'+fileName);
      fileList.push.apply(fileList, childFileList);
    } else if(fileName[0] !== '.') {    // Don't process 'hidden' files.
      var fileExtension = fileName.split('.').pop().toLowerCase();
      var contents = fs.readFileSync(dir + '/' + fileName);
      if(fileExtension === "obj" || fileExtension === "json") {
        fileList.push({file: currentPath + '/' + fileName, stringified: JSON.stringify(contents.toString())});
      } else {
        var base64String = base64.fromByteArray(contents);
        fileList.push({file: currentPath + '/' + fileName, base64: base64String, fileExtension: fileExtension});
      }
    }
  }
  return fileList;
};

EmbeddedAssets.convertResourcesToBase64 = function() {
  var pathRoot = EmbeddedAssets.pathRoot;
  var models = EmbeddedAssets.readResourceFiles(pathRoot, 'models');
  var pngs = EmbeddedAssets.readResourceFiles(pathRoot, 'png');
  var all = [];
  all.push.apply(all, models);
  all.push.apply(all, pngs);

  var allBase64 = "var FourJS = FourJS || {};\nFourJS.Assets = FourJS.Assets || {};\n";
  for(var i=0; i<all.length; i++) {
    var item = all[i];
    if(item.hasOwnProperty('base64')) {
      allBase64 += 'FourJS.Assets["' + item.file + '"] = "data:image/'+item.fileExtension+';base64,' + item.base64 + '";\n';
    } else if(item.hasOwnProperty('stringified')) {
      allBase64 += 'FourJS.Assets["' + item.file + '"] = ' + item.stringified + ';\n';
    }
  }
  return allBase64;
};

function displayInlineHelp(){
  console.log('gulp watch\t- keep watching files and minify on change');
  console.log('gulp minify\t- build a minified version of four.js');
  console.log('gulp \t\t- display inline help');
  console.log('gulp help\t- display inline help');
}

/***
 * Gulp Tasks
 *
 */
gulp.task('default', function() {
  displayInlineHelp();
});

gulp.task('help', function() {
  displayInlineHelp();
});

gulp.task('minify', function() {
  MinifyFourJs.minify();
});


gulp.task('watch', function() {
  // minify the source before starting to watch
  MinifyFourJs.minify();

  gulp.watch(MinifyFourJs.fourJsFileList).on('change', function(event) {
    console.log('Minifying a new version');
    MinifyFourJs.minify();
  });
  
  gulp.watch(EmbeddedAssets.watchDirectories).on('change', function(event) {
    console.log('Minifying a new version');
    MinifyFourJs.minify();
  });
});
