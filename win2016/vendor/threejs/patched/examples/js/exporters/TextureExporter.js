/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.TextureExporter = function () {};

THREE.TextureExporter.prototype = {

	constructor: THREE.TextureExporter,

	parse: function ( texture ) {

		var output = {
			metadata: {
				version: 4.2,
				type: 'texture',
				generator: 'TextureExporter'
			}
		};

		output.uuid = texture.uuid;

		if ( texture.name !== "" ) output.name = texture.name;

		if ( texture instanceof THREE.Texture ) {

			if( texture.image instanceof HTMLCanvasElement){
				output.dataURL	= texture.image.toDataURL('image/png')

			}else {

				// put texture.image into a canvas then do .toDataURL
				var canvas	= document.createElement('canvas')
				canvas.width	= texture.image.width
				canvas.height	= texture.image.height
				var context	= canvas.getContext('2d')
				context.drawImage(texture.image, 0, 0)
				output.dataURL	= canvas.toDataURL('image/png')

			}

	
		} else	console.assert(false)

		return output;

	}

};
