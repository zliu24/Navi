var THREEx  = THREEx  || {}


THREEx.AudioObject  = function ( name, experienceID ) {

  THREE.Object3D.call( this );

  this.name = name;
  this.experienceID = experienceID;
  this.serialisable = true; // should not be written to scene file, because it is saved as an experience

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

  var object = this;
  this.initAudioElement = function() {
    // build audio element
    var audio = document.createElement('audio');

    // export audio element
    audio.autoplay   = false
    audio.autoReplay = false

    //add an listener on loaded metadata
    audio.addEventListener('loadstart', function(){
      delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)

      //object.geometry.dispose();

      object.status = 'loaded';
      if (object.onLoadedCallback) {
        object.onLoadedCallback();
      }

    }.bind(object), false);

    if (object.onErrorCallback) {
      audio.addEventListener('error', object.onErrorCallback);
      audio.addEventListener('abort', object.onErrorCallback);
    }

    this.audio = audio;
  };

  this.initAudioElement();

  this.play = function() {
    this.audio.play();
  }

  this.pause = function() {
    this.audio.pause();
  }

  this.stop = function() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  this.destroy  = function(){
    this.stop();
  }

  this.load = function(url, onLoadedCallback, onErrorCallback){
    this.status   = 'loading'
    this.onLoadedCallback = onLoadedCallback;
    this.onErrorCallback = onErrorCallback;
    this.audio.crossOrigin = 'anonymous';
    this.audio.src   = url;
  }

  this.setOption = function(option, val) {
    switch (option) {
      case "autoplay":
        this.audio.autoplay = val;
        break;
      case "autoReplay":
        this.audio.autoReplay = val;
        break;
      default:
        console.error("Invalid option type: ", option);
    }
  }

  this.getOption = function(option) {
    switch (option) {
      case "autoplay":
        return this.audio.autoplay;
        break;
      case "autoReplay":
        return this.audio.autoReplay;
        break;
      default:
        console.error("Invalid option type: ", option);
    }
  }

  this.toJson = function ( data ) {

    data.url  = this.audio.src;
    data.type = 'AudioObject';
    
    // These are used internally by the Unity audio playback behavior
    data.autoplay = this.audio.autoplay;
    data.autoReplay = this.audio.autoReplay;

    data.startOptions = {
      option: this.startOptions.option
    };

    data.endOptions = {
      option: this.endOptions.option,
      redirectType: this.endOptions.redirectType,
      redirectChapter: this.endOptions.redirectChapter,
      redirectURL: this.endOptions.redirectURL        
    };

  }

  this.fromJson = function ( data ) {
    var obj = this;

    if ( data.startOptions ) {
      this.startOptions.option = data.startOptions.option;
    }

    if ( data.endOptions ) {
      this.endOptions.option = data.endOptions.option;
      this.endOptions.redirectType = data.endOptions.redirectType;
      this.endOptions.redirectChapter = data.endOptions.redirectChapter;
      this.endOptions.redirectURL = data.endOptions.redirectURL;
    }

    this.audio.autoplay = (data.autoplay);
    this.audio.autoReplay = (data.autoReplay);

  }

}

THREEx.AudioObject.prototype = Object.create( THREE.Object3D.prototype );

THREEx.AudioObject.prototype.clone = function(object, recursive) {
  if (object === undefined) {
    object = new THREEx.AudioObject();
  }
  object.experienceID = this.experienceID;
  object.load(this.audio.src);
  THREE.Object3D.prototype.copy.call(object, this, recursive);
  return object;
};

//////////////////////////////////////////////////////////////////////////////////
//    Comment                //
//////////////////////////////////////////////////////////////////////////////////


/**
 * helper for THREEx.AudioObject
 *
 * @class
 * @param {THREEx.AudioObject} object3d   - the object to helper
 * @param {Number} sphereSize - the size of the sphere
 */
THREEx.AudioObjectHelper = function ( object3d, sphereSize ) {
  this.object3d  = object3d;
  this.object3d.updateMatrixWorld();

  var geometry  = new THREE.SphereGeometry( sphereSize, 4, 2 );
  var material  = new THREE.MeshBasicMaterial({
    wireframe  : true,
    fog    : false,
    color    : 'white',
  });
  // material.color.copy( this.object3d.color ).multiplyScalar( this.object3d.intensity );

  THREE.Mesh.call( this, geometry, material );

  this.matrixWorld = this.object3d.matrixWorld;
  this.matrixAutoUpdate = false;
};

THREEx.AudioObjectHelper.prototype = Object.create( THREE.Mesh.prototype );

/**
 * update function 
 */
THREEx.AudioObjectHelper.prototype.update = function () {
};


