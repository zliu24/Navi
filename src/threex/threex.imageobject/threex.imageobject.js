var THREEx  = THREEx  || {}

/**
 * Constructor for the Image mesh
 * @class
 */
THREEx.ImageObject  = function(){

  // build image element
  var image  = document.createElement('img');
  var placeholderUrl =  FourJS.Assets['png/i4ds/placeholders/image.png'];

  this.image  = image;
  this.image.src = placeholderUrl;
  this.texture = new THREE.Texture( image );

  // build plane 20x20 square
  var geometry  = new THREE.PlaneGeometry(20, 20);
  var material  = new THREE.MeshBasicMaterial({
    transparent: true,
    side  : THREE.DoubleSide,
    map: this.texture
  });

  // call the inherited contructor
  THREE.Mesh.call(this, geometry, material)

  // We want to auto-resize the plane when adding a new instance (w/ default placeholder), uploading a new image, but NOT when loading from JSON
  this.autoResize = true;

  /**
   * Load image at given URL, optionall resizing to its dimensions
   * @param {string} url - The URL of the image to load
   * @param {boolean=} autoResize - If true, resize current ImageObject mesh to given image's dimensions
   */
  this.load  = function(url, autoResize){
    this.autoResize = autoResize;
    image.crossOrigin = 'anonymous';
    image.src  = url;
  }

  /**
   * Populate given object with this ImageObject's geometry, texture_uuid and URL
   * @param {object} data - data Image
   */
  this.toJson = function(data) {
    data.geometry = {
      width: this.geometry.parameters.width,
      height: this.geometry.parameters.height
    }
    data.texture_uuid = this.texture.uuid;
    data.url = this.image.src;
    if (data.url == placeholderUrl) {
      data.url = null;
    }
  }

  /**
   * @param {object} data - Given a data object, populate this ImageObject. data format: { geometry: { width: int, height: int }, texture_uuid: UUID, url: string }
   */
  this.fromJson = function(data) {
    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(data.geometry.width, data.geometry.height);
    this.texture = new THREE.Texture(this.image, false);
    this.texture.uuid = data.texture_uuid;

    // This bit needs some explaining. When we moved to internal static assets (i.e. placeholder images)
    // we ran were already storing the placeholder image path in the scene JSON, and it was pointed back
    // to a URL on the server (i.e. https://testserver.daqri.com/png/i4ds/placeholders/image.png). The
    // problem was that the static images were not always accessible.
    //
    // The solution was to use static images stored in base64 format. This part is straight forward, just
    // supply a url in data:image/png;base64,A3NC83NC83NCA1..." format.
    //
    // The problem is that older json (and newer?) used the full URL shown above. So the not pretty
    // workaround is to regex for the path of the URL, then find if there is a local static image
    // of the same path.
    //
    var urlParts = data.url.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
    var pathName = urlParts[5].substr(1);
    if(!FourJS.Assets.hasOwnProperty(pathName)) {
      this.load(data.url, false);  // false: do NOT autoResize based on image
    }
  }

  image.addEventListener('load', function(){
    var object  = this

    delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)

    //this.texture = new THREE.Texture( image );

    if (this.autoResize) {
      object.geometry.dispose();

      var aspect = image.width / image.height;
      var height = this.geometry.parameters.height;
      var geometry = new THREE.PlaneGeometry(aspect * height, height);
      object.geometry = geometry;
      object.geometry.needsUpdate = true;
    }

    var material  = new THREE.MeshBasicMaterial({
      transparent: true,
      side  : THREE.DoubleSide,
      map  : this.texture
    });
    object.material = material;

    object.material.map.needsUpdate = true;

  }.bind(this), false);

}


THREEx.ImageObject.prototype = Object.create( THREE.Mesh.prototype )

/**
 * overload three.js .clone() function
 * 
 * @param  {THREE.Object3D=} object    - the destination object, if not provided, one is created for you
 * @param  {boolean=} recursive - recursive 
 * @return {THREEx.ImageObject} - just created cloned object
 */
THREEx.ImageObject.prototype.clone = function(object, recursive) {
  if (object === undefined) {
    object = new THREEx.ImageObject();
  }
  THREE.Mesh.prototype.copy.call(object, this, recursive);
  object.geometry.parameters.width = this.geometry.parameters.width;
  object.geometry.parameters.height = this.geometry.parameters.height;
  object.load(this.image.src, false);
  return object;
};
