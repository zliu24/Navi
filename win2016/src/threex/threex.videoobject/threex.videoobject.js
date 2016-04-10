var THREEx  = THREEx  || {}


THREEx.VideoObject  = function(video_type){

  this.video_type = (video_type ? video_type : 'video');  // Either 'gif' or 'video'
  this.status = '';
  this.fileID = undefined;
  this.fileName = null;

  this.startOptions = {
    option: 'AutoPlay'
  };

  this.touchOptions = {
    option: 'None',
    redirectType: '',
    redirectChapter: -1,
    redirectURL: ''
  };

  this.endOptions = {
    option: 'None',
    redirectType: '',
    redirectChapter: -1,
    redirectURL: ''
  };

  this.chromaSettings = {
    enable: false,
    color_hex: '#000000',
    threshold: 0.0,
    smoothness: 0.0
  };

  // build video element
  var video  = document.createElement('video');
  video.autoplay = false
  video.autoReplay = false

  video.volume  = 0.2  // mute the video during developement

  // export video element
  this.video  = video

  // Image-related block: for use in loading the placeholder image
  var image = document.createElement('img');
  image.crossOrigin = "Anonymous";
  this.image  = image;
  image.addEventListener('load', function(){
    var object = this;

    delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)

    // if there's no video src, don't resize based on the aspect of the placeholder
    if (this.autoResize && video.src) {
      object.geometry.dispose();
      // compute aspect
      var aspect = image.width / image.height;
      var height = this.geometry.parameters.height;
      var geometry = new THREE.PlaneGeometry(aspect * height, height);
      object.geometry = geometry;
    }

    object.material.map.needsUpdate = true;

  }.bind(this), false);

  //add an listener on loaded video data
  video.addEventListener('loadeddata', function() {
    var object  = this;  // THREEx.VideoObject

    delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)

    if (this.autoResize) {
      object.geometry.dispose();
      // compute aspect
      var videoW  = video.videoWidth;
      var videoH  = video.videoHeight;
      var aspect  = videoW / videoH;
      var height = this.geometry.parameters.height;

      // build plane
      var geometry  = new THREE.PlaneGeometry(aspect * height, height)
      object.geometry = geometry
    }

    this.texture = new THREE.Texture( video );
    this.texture.minFilter = THREE.LinearFilter;
    object.material.map = this.texture;
    object.material.map.needsUpdate = true;

    object.status = 'loaded';
    if (object.onLoadedCallback) {
      object.onLoadedCallback();
    }

  }.bind(this), false);

  this.setPlaceholder = function(video_type) {
    // By default, show movie.png on a double sided plane
    this.image.src =  FourJS.Assets['png/i4ds/placeholders/' + video_type + '.png'];

    this.texture = new THREE.Texture( image );
    this.texture.minFilter = THREE.LinearFilter;
    // build plane
    var geometry  = new THREE.PlaneGeometry(20, 20);
    var material  = new THREE.MeshBasicMaterial({
      side  : THREE.DoubleSide,
      map: this.texture
    });

    if (this.geometry) { // Object3d has already been initialized, so we're updating the geo/material rather than creating it fresh
      this.material = material;
    } else {
      // call the inherited contructor
      THREE.Mesh.call(this, geometry, material)
    }
  }

  this.update  = function(){
    // trick to work around bugs in the video loop
    if( this.video.currentTime === this.video.duration ){
      this.video.src = this.video.src  
    }

    if( this.texture && this.video.readyState === this.video.HAVE_ENOUGH_DATA ){
      this.texture.needsUpdate  = true;
    }
  }

  // If true, we're loading from the json, do not auto-set height. If false, we've uploaded or selected a video, DO auto-set height/width
  this.autoResize = true;
  this.load  = function(url, autoResize) {
    this.status    = 'loading'
    this.autoResize = autoResize;
    video.crossOrigin  = 'anonymous';
    video.src    = url;
  }

  this.destroy  = function(){
    video.pause();
  }

  this.toJson = function ( data ) {

    data.video_type = this.video_type;
    data.url  = this.video.src;
    data.volume  = this.video.volume;
    data.fileName  = this.fileName;
    data.fileID  = this.fileID;

    data.geometry = {
      width: this.geometry.parameters.width,
      height: this.geometry.parameters.height
    }
    
    // These are used internally by the Unity video playback behavior
    data.identifier  = this.video.identifier;
    data.materialForVideoIndex = this.video.materialForVideoIndex;
    data.useDefaultShader = true;
    data.autoReplay = this.video.autoReplay;

    data.startOptions = {
      option: this.startOptions.option
    };

    data.touchOptions = {
      option: this.touchOptions.option,
      redirectType: this.touchOptions.redirectType,
      redirectChapter: this.touchOptions.redirectChapter,
      redirectURL: this.touchOptions.redirectURL
    };

    data.endOptions = {
      option: this.endOptions.option,
      redirectType: this.endOptions.redirectType,
      redirectChapter: this.endOptions.redirectChapter,
      redirectURL: this.endOptions.redirectURL        
    };

    data.chromaSettings = {
      enable: this.chromaSettings.enable,
      color_hex: this.chromaSettings.color_hex,
      threshold: this.chromaSettings.threshold,
      smoothness: this.chromaSettings.smoothness
    };
  }

  this.fromJson = function ( data ) {

    this.video_type = data.video_type;
    this.setPlaceholder(this.video_type);
    this.video.volume  = data.volume;
    this.fileID    = data.fileID;
    this.fileName = data.fileName;
    
    this.video.identifier = data.identifier;
    this.video.materialForVideoIndex = data.materialForVideoIndex;
    this.video.useDefaultShader = data.useDefaultShader;
    this.video.autoReplay = data.autoReplay;

    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(data.geometry.width, data.geometry.height);

    if ( data.startOptions ) {
      this.startOptions.option = data.startOptions.option;
    }

    if ( data.touchOptions ) {
      this.touchOptions.option = data.touchOptions.option;
      this.touchOptions.redirectType = data.touchOptions.redirectType;
      this.touchOptions.redirectChapter = data.touchOptions.redirectChapter;
      this.touchOptions.redirectURL = data.touchOptions.redirectURL;
    }

    if ( data.endOptions ) {
      this.endOptions.option = data.endOptions.option;
      this.endOptions.redirectType = data.endOptions.redirectType;
      this.endOptions.redirectChapter = data.endOptions.redirectChapter;
      this.endOptions.redirectURL = data.endOptions.redirectURL;
    }

    if ( data.chromaSettings ) {
      this.chromaSettings.enable = data.chromaSettings.enable;
      this.chromaSettings.color_hex = data.chromaSettings.color_hex;
      this.chromaSettings.threshold = data.chromaSettings.threshold;
      this.chromaSettings.smoothness = data.chromaSettings.smoothness;
    }
  }

}

THREEx.VideoObject.prototype = Object.create( THREE.Mesh.prototype );

THREEx.VideoObject.prototype.clone = function(object, recursive) {
  if (object === undefined) {
    object = new THREEx.VideoObject(this.video_type);
    object.setPlaceholder(this.video_type);
  }
  object.fileID = this.fileID;
  object.fileName = this.fileName
  THREE.Mesh.prototype.copy.call(object, this, recursive);
  object.geometry.parameters.width = this.geometry.parameters.width;
  object.geometry.parameters.height = this.geometry.parameters.height;
  object.load(this.video.src, false);
  return object;
};
