/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.TextureLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.TextureLoader.prototype = {

	constructor: THREE.TextureLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.XHRLoader();
		loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( JSON.parse( text ) ) );

		} );

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	parse: function (json, objFiles) {
		// Load texture from object files
		var textureFile = objFiles.filter(function(file) {
			return file.uuid === json.uuid;
		})[0];
		var url = textureFile && textureFile.url;

		THREE.ImageUtils.crossOrigin = '';
		return THREE.ImageUtils.loadTexture(url);
	}
};
