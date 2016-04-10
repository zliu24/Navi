var THREEx  = THREEx  || {};


THREEx.GalleryObject  = function( height ){

  this.galleryParams = {
    slideTextures: [],
    border_color_hex: '#006ccc',
    endOptions: {
      option: 'None',
      redirectType: '',
      redirectChapter: -1,
      redirectURL: ''
    },
    time: 1,
    allowSwipe: false
  };

  this.slideIndex = 0;
  this.lastSlideAt = 0;
  this.isPlaying = true;
  this.isSlideLoaded = false;

  // build image element with placeholder
  var image = document.createElement('img');
  image.crossOrigin = "Anonymous";
  this.image  = image;
  this.image.src = '/png/i4ds/placeholders/gallery.png';

  // create the texture
  var texture = new THREE.Texture( image );

  var geometry  = new THREE.PlaneGeometry(height, height);
  var material  = new THREE.MeshBasicMaterial({
    side  : THREE.DoubleSide,
    map : texture
  });

  // call the inehrited contructor
  THREE.Mesh.call(this, geometry, material);


  this.getTimePerSlide = function() {
    var time = Number(this.galleryParams.time);

    if (!isNaN(time) && time > 0.1) {
      return time;
    }
    return 0.1;
  };

  this.isLooping = function() {
    if (this.galleryParams.endOptions.option == 'Replay') {
      return true;
    }
    return false;
  };

  this.getNumSlides = function() {
    return this.galleryParams.slideTextures.length;
  };

  //////////////////////////////////////////////////////////////////////////////////
  // Add a listener on loaded metadata
  //////////////////////////////////////////////////////////////////////////////////

  image.addEventListener('load', function(){
    
    var object  = this;

    delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)

    object.geometry.dispose();

    // compute aspect 
    var aspect  = image.width / image.height;
    var height = this.geometry.parameters.height;
    var geometry  = new THREE.PlaneGeometry(aspect * height, height);
    object.geometry = geometry;

    object.material.map.needsUpdate = true;

    object.isSlideLoaded = true;
    object.lastSlideAt = Date.now()/1000;

  }.bind(this), false);


  //////////////////////////////////////////////////////////////////////////////////
  //    Set Slide
  //////////////////////////////////////////////////////////////////////////////////

  this.setIndex = function ( newIndex ) {
    var numSlides = this.getNumSlides();
    if (numSlides <= 0) {
      this.slideIndex = 0;
      return;
    }

    if (newIndex < 0) newIndex = 0;
    else if (newIndex > numSlides-1) newIndex = numSlides-1;

    var newURL = this.galleryParams.slideTextures[ newIndex ].sourceURL;
    var isNewURL = (this.image.src != newURL);

    if (isNewURL) {
      this.slideIndex  = newIndex;
      this.isSlideLoaded = false;
      this.image.src = newURL;
    }
    else if (this.slideIndex != newIndex) {
      this.slideIndex  = newIndex;
      this.lastSlideAt = Date.now()/1000;
    }
  };

  this.next = function ( ) {
    var numSlides = this.getNumSlides();
    if (numSlides <= 0) {
      this.slideIndex = 0;
      return;
    }
    // honor isLooping
    if( !this.isLooping() && this.slideIndex >= numSlides-1 )  return;

    // update slideIndex
    var newIndex  = (this.slideIndex+1) % numSlides;
    this.setIndex(newIndex);
  };

  this.previous = function ( ) {
    var numSlides = this.getNumSlides();
    if (numSlides <= 0) {
      this.slideIndex = 0;
      return;
    }

    // honor isLooping
    if( !this.isLooping() && this.slideIndex <= 0 ) {
      return;
    }
    // update slideIndex
    var newIndex  = (this.slideIndex-1+numSlides) % numSlides;
    this.setIndex(newIndex);
  };

  //////////////////////////////////////////////////////////////////////////////////
  //    Player
  //////////////////////////////////////////////////////////////////////////////////
  this.play = function ( ) {

    if (this.slideIndex >= this.getNumSlides()-1)
    {
      this.setIndex( 0 );
    }
    else
    {
      this.setIndex( this.slideIndex );
    }

    this.isPlaying = true;
  };

  this.pause = function ( ) {

    this.isPlaying = false;

  };

  this.updatePlayer = function ( ) {

    // if we are playing, test if we need the next slides
    if( this.isPlaying === true && this.isSlideLoaded === true ) {

      var now = Date.now()/1000;
      if( now >= this.lastSlideAt + this.getTimePerSlide()) {

        var numSlides = this.getNumSlides();
        // honor isLooping - and stop at the end of the slides
        if( !this.isLooping() && this.slideIndex >= numSlides-1 ) {
          this.pause();
        }
        else {
          // goto next slide
          this.next();
        }
      }
    }
  };


  //////////////////////////////////////////////////////////////////////////////////
  //    Save/Load
  //////////////////////////////////////////////////////////////////////////////////

  this.toJson = function ( data ) {

    data.height = this.geometry.parameters.height;

    data.galleryParams = {

      slideTextureUUIDs: [],
      border_color_hex: this.galleryParams.border_color_hex,

      endOptions: {
        option: this.galleryParams.endOptions.option,
        redirectType: this.galleryParams.endOptions.redirectType,
        redirectChapter: this.galleryParams.endOptions.redirectChapter,
        redirectURL: this.galleryParams.endOptions.redirectURL
      },

      time: this.getTimePerSlide(),

      allowSwipe: this.galleryParams.allowSwipe
    };

    // save UUID for each slide texture
    var slideTextures = this.galleryParams.slideTextures;
    var slideTextureUUIDs = data.galleryParams.slideTextureUUIDs;
    for (var i = 0; i < slideTextures.length; ++i) {
      slideTextureUUIDs.push( slideTextures[i].uuid );
    }

  };

  this.fromJson = function ( data, textures ) {

    if ( data.galleryParams ) {

      this.galleryParams = {
        slideTextures: [],
        border_color_hex: data.galleryParams.border_color_hex,
        endOptions: {
          option: data.galleryParams.endOptions.option,
          redirectType: data.galleryParams.endOptions.redirectType,
          redirectChapter: data.galleryParams.endOptions.redirectChapter,
          redirectURL: data.galleryParams.endOptions.redirectURL
        },
        time: data.galleryParams.time,
        allowSwipe: data.galleryParams.allowSwipe
      };

      // keep a reference to the loaded texture for each slide
      var slideTextures = this.galleryParams.slideTextures;
      var slideTextureUUIDs = data.galleryParams.slideTextureUUIDs;
      for (var i = 0; i < slideTextureUUIDs.length; ++i) {

        var textureUUID = slideTextureUUIDs[i];
        var texture = textures[ textureUUID ];
        if ( texture ) {
          slideTextures.push( texture );
        }
        else {
          console.log("error! gallery references texture " + textureUUID + " which failed to download");
        }
      }
    }
  };

};


THREEx.GalleryObject.prototype = Object.create( THREE.Mesh.prototype );

