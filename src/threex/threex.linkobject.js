var THREEx  = THREEx  || {}


THREEx.LinkObject  = function(){

  // build image element
  var image = document.createElement('img');
  var placeholderUrl = '/png/i4ds/placeholders/link.png';
  this.image  = image
  this.image.src = placeholderUrl;
  this.texture = new THREE.Texture( image );
  this.htmlUrl = '';

  // build plane 20x20 square
  var geometry  = new THREE.PlaneGeometry(20, 20);
  var material  = new THREE.MeshBasicMaterial({
    side  : THREE.DoubleSide,
    map: this.texture
  });

  // call the inherited contructor
  THREE.Mesh.call(this, geometry, material)

  // We want to auto-resize the plane when adding a new instance (w/ default placeholder), uploading a new image, but NOT when loading from JSON
  this.autoResize = true;
  this.load = function(url, autoResize){
    this.autoResize = autoResize;
    image.crossOrigin = 'anonymous';
    image.src = url;
  }

  this.toJson = function(data) {
    data.geometry = {
      width: this.geometry.parameters.width,
      height: this.geometry.parameters.height
    }

    data.url = this.image.src;
    data.texture_uuid = this.texture.uuid;
    if (data.url == placeholderUrl) {
      data.url = null;
    }
    data.htmlUrl = this.htmlUrl;
  }

  this.fromJson = function(data) {
    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(data.geometry.width, data.geometry.height);

    this.texture = new THREE.Texture(this.image, false);
    this.texture.uuid = data.texture_uuid;

    this.load(data.url, false);  // false: do NOT autoResize based on image
    
    this.htmlUrl = data.htmlUrl;
  }
  
  // Restore placeholder for this LinkObject
  this.setPlaceholder = function() {
    // LinkObject serves as the underlying object for different meshes we have, so figure out the correct placeholder
    this.image.src = '/png/i4ds/placeholders/' + this.userData.type + '.png';
    this.texture = new THREE.Texture( image );
  }

  image.addEventListener('load', function(){
    var object  = this

    delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)

    if (this.autoResize) {
      object.geometry.dispose();

      var aspect = image.width / image.height;
      var height = this.geometry.parameters.height;
      var geometry = new THREE.PlaneGeometry(aspect * height, height);
      object.geometry = geometry;
    }

    var material  = new THREE.MeshBasicMaterial({
      side  : THREE.DoubleSide,
      map : this.texture
    });
    object.material = material;

    object.material.map.needsUpdate = true;

  }.bind(this), false);
}


THREEx.LinkObject.prototype = Object.create( THREE.Mesh.prototype )


