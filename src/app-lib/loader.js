/***
 * Copyright (C) 2016 DAQRI, LLC. - All Rights Reserved.
 *
 * NOTICE:  This is not open source code. All source code and other information contained herein is, and remains the property of DAQRI LLC and/or its suppliers, partners, or
 * affiliates, if any (“DAQRI”) to the greatest extent possible.  The intellectual property, technical concepts, and creative expression contained herein (“code”) are proprietary to
 * DAQRI and may be covered by U.S. and Foreign Patents, patents in process, trade secret, or copyright law. Dissemination, alteration, reproduction, display, and performance
 * of this code is strictly forbidden unless prior written permission is obtained from DAQRI. Any access that DAQRI may grant you to this code is expressly conditioned on your
 * agreement to these terms, and to any other terms that DAQRI may request of you. Do not access this code if you do not agree to these terms.
 *
*/


'use strict';
var FourJS = FourJS || {};
THREEx.assetDownloads = {};

FourJS.Loader = function(context) {
  this.context = context;
};

FourJS.Loader.prototype.loadSceneAssets = function(scene) {
  this.sceneJson = scene.threejsScene;
  this.sceneFiles = scene.threejsScene.files;

  this.deferred = $.Deferred();

  this.loadStatus = {
    numToLoad: 0,
    numLoaded: 0,
    assetStatus: [],
    status: "loading"
  };

  var _this = this;

  if (this.sceneFiles.length > 0) {
    var assetDownloadedFunc = function(id, fileData,metadata) {
      var asset = _.findWhere(_this.sceneFiles, { "id": id });
      var url = id;
      if(asset && asset.file) { url += " "+asset.file.url; }
      else if(asset && asset.video_m4v_url) { url += " "+asset.video_m4v_url; }
      FourJS.Utils.log("*********************************** assetDownloadedFunc: "+url);

      _this.assetDownloaded(id, fileData, metadata);
    };

    for (var i = 0; i < this.sceneFiles.length; i++) {
      var asset = this.sceneFiles[i];

      this.loadStatus.numToLoad++;

      // model files use an array of uuids instead of single uuid
      var assetID = asset.uuid || asset.uuids.join(',');
      var type = asset.type_of;

      var url = '';
      if (asset.type_of === 'Video' || asset.type_of === 'GIF') {
        url = asset.video_m4v_url;
      } else {
        url = asset.file.url;
      }

      if (!THREEx.assetDownloads[assetID]) {
        THREEx.assetDownloads[assetID] = {
          assetID: assetID,
          type: type,
          url: url,
          fileData: void 0
        };
      } else if (type === 'Image') {
        // force textures to be downloaded again
        // otherwise this error happens: WebGL: INVALID_OPERATION: bindTexture: object not from this context
        // texture images are downloaded by setting the src on an img
        // so the browswer should cache them anyhow
        THREEx.assetDownloads[assetID].fileData = void 0;
      }

      var assetStatus = {
        "url": url,
        "type": type,
        "sizeLoaded": 0,
        "sizeTotal": 0,
        "status": "loading"
      };
      this.loadStatus.assetStatus.push(assetStatus);
      this.loadStatus.numToLoad++;

      if (type === 'Image') {
        FourJS.Utils.trace("Download Image");
        FourJS.Loader.downloadTexture(url, assetID, assetStatus, this).then(assetDownloadedFunc);
      } else if (type === 'Video' || type === 'GIF') {
        FourJS.Utils.trace("Download "+type+" " + url);
        FourJS.Loader.downloadVideo(url, assetID, assetStatus, this).then(assetDownloadedFunc);
      } else if (type === 'Audio') {
        FourJS.Utils.trace("Download Audio");
        FourJS.Loader.downloadAudio(url, assetID, assetStatus, this).then(assetDownloadedFunc);
      } else {
        FourJS.Utils.trace("Download File");
        FourJS.Loader.downloadFile(url, assetID, assetStatus, this).then(assetDownloadedFunc);
      }

    }

    this.notify();
  } else {
    this.loadScene();
  }
  return this.deferred;
};

FourJS.Loader.prototype.onSceneLoaded = function() {
  var light = new THREE.AmbientLight(0x777777);
  light.name = "Default AmbientLight";
  light.serialisable = false;
  light.cannotBeEdited = true;
  this.context.threejs.editor.addObject(light);

  //We need to setmode play when we see a target (camera transform exists)
  //Similarly we need to add pause when target is lost.
  this.context.setMode('play');
  FourJS.Utils.trace("Load scene complete");
};

FourJS.Loader.prototype.notify = function() {
  this.context.dispatch("loadStatus", this.loadStatus);
};

FourJS.Loader.prototype.loadScene = function(sceneFile) {
  var loader  = new THREE.ObjectLoader();
  var scene   = loader.parse(this.sceneJson);
  scene.scripts = this.sceneJson.scripts;
  this.loadStatus.status = "complete";
  this.notify();
  var _this = this;
  setTimeout(function() {
    _this.deferred.resolve(scene);
  }, 1);
};

FourJS.Loader.prototype.areAssetsLoaded = function() {
  for (var assetID in THREEx.assetDownloads) {
    if(THREEx.assetDownloads.hasOwnProperty(assetID)) {
      var downloadState = THREEx.assetDownloads[assetID];
      if (downloadState.fileData === void 0) {
        return false;
      }
    }
  }
  return true;
};

FourJS.Loader.prototype.assetDownloaded = function(id, fileData,metadata) {
  FourJS.Utils.log("******** asset " + id + " downloaded");
  var dl = THREEx.assetDownloads[id];
  this.loadStatus.numLoaded++;
  if (dl) {
      dl.fileData = fileData;
      dl.metadata = metadata;
    if (this.areAssetsLoaded()) {
      FourJS.Utils.trace('All scene asset downloads complete; loading scene...');
      this.loadScene();
    }
  }
};

FourJS.Loader.downloadTexture = function(url, id) {

  var deferred = $.Deferred();
  var image = document.createElement( 'img' );
  //  $("#viewport-container .top-left").append($(image));
  var fileName = url.split("/").pop();
  image.crossOrigin = "Anonymous";

  image.addEventListener( 'load', function() {
    var texture = new THREE.Texture( this ); // this = image
    texture.sourceFile = fileName;
    texture.sourceURL = url;
    texture.name = fileName;
    texture.needsUpdate = true;
    deferred.resolve(id, texture);
  }, false );
  image.src = url;
  return deferred;
};

FourJS.Loader.downloadVideo = function(url, id) {
  if (window.location.protocol === "http:") {
    url = url.replace(/https/, 'http');
  }

  var deferred = $.Deferred();
  var video = document.createElement( 'video' );
  video.crossOrigin = "anonymous";
  video.addEventListener( 'loadstart', function() {
    video.sourceFile = url.split("/").pop();
    // We should use http s3 url if user is on http
    video.needsUpdate = true;
    deferred.resolve(id, video);
  }, false );
  video.src = url;
  return deferred;
};

FourJS.Loader.downloadAudio = function(url, id) {
  var deferred = $.Deferred();
  var audio = new THREEx.AudioObject();
  audio.load(url, function() {
    deferred.resolve(id, audio);
  });
  return deferred;
};

FourJS.Loader.downloadFile = function (url, id, assetStatus, assetLoader) {
  var deferred = $.Deferred();
  var dl = THREEx.assetDownloads[id];
  dl.file_extension =  dl.url.split('.').pop();

  var loader = new THREE.XHRLoader();
  // If binary file
  if(dl.file_extension == 'bin'){
    var urlWithoutExtension = url.substr(0, url.lastIndexOf('.'));
    // Step 1: load the .json file describing the geobinary
    loader.load( urlWithoutExtension + '.json', function ( fileJson ){
      var loaderBin = new THREE.XHRLoader();
      loaderBin.setResponseType("arraybuffer")
      //  Step 2: load the .bin file once the json is loaded
      loaderBin.load(url, function ( fileBin ){
        assetStatus.sizeLoaded = assetStatus.sizeTotal;
        assetStatus.status = "loaded";
        assetLoader.notify();
        // Callback
        deferred.resolve(id, fileBin, fileJson);
      }, function(instance) { // progress callback
        assetStatus.sizeLoaded = instance.loaded;
        assetStatus.sizeTotal = instance.total;
        assetLoader.notify();
      }, function(err) {  // errors callback
        assetStatus.status = "error";
        assetLoader.notify();
      })

    }, undefined, function(err) {  // errors callback
      assetStatus.status = "error";
      assetLoader.notify();
    });



  }else{
    loader.load( url, function ( file ) { // loaded callback
      assetStatus.sizeLoaded = assetStatus.sizeTotal;
      assetStatus.status = "loaded";
      assetLoader.notify();
      deferred.resolve(id, file, url);
    }, function(instance) { // progress callback
      assetStatus.sizeLoaded = instance.loaded;
      assetStatus.sizeTotal = instance.total;
      assetLoader.notify();
    }, function(err) {  // errors callback
      assetStatus.status = "error";
      assetLoader.notify();
    });
  }
  return deferred;
};

FourJS.Loader.loadModel = function (file, name) {
  var extension = name.split( '.' ).pop().toLowerCase();
  var geometries;

  switch (extension) {
    case 'obj':
      var object = new THREE.OBJLoader().parse(file);
      geometries = object.children;
      break;

    default:
      FourJS.Utils.log( 'ERROR: FourJS.Loader.loadModel: Unsupported file format. Extension:'+ extension);
      break;
  }

  return geometries;
};
