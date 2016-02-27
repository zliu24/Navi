var THREEx	= THREEx	|| {}

/**
 * Create a plane on which we map 2d text
 * @class
 */
THREEx.Text2DObject	= function(){
        var geometry = new THREE.PlaneGeometry(1,1)
        var material = new THREE.MeshBasicMaterial({
                alphaTest:0.001,
                side:THREE.DoubleSide
        })

        THREE.Mesh.call( this, geometry, material )

        // create the dynamicTexture
        console.assert(this.dynamicTexture === undefined)
        var dynamicTexture      = new THREEx.DynamicTexture(512,512)

        this.dynamicTexture     = dynamicTexture
        // same parameters as THREEx.DynamicTexture.drawTextCooked
        // - TODO take it from the default paramters of the functions
        //   - no need to duplicate here
        this.parameters = {
                text            : 'Hello World!',
                margin          : 20,
                lineHeight      : 10,
                align           : 'left',
                fillStyle       : '#ccccff',
                shadowEnabled   : true,
                shadowColor     : "#000000",
                shadowOffsetX   : 2,
                shadowOffsetY   : 2,
                // Font changes
                fontSize        : 90,
                fontFamily      : "Arial",
                fontWeight      : "bold"
        }

        // set the texture material
        material.map    = this.dynamicTexture.texture;

        this.update();
}

THREEx.Text2DObject.prototype = Object.create( THREE.Mesh.prototype );

/**
 * update the object texture based on .parameters
 */
THREEx.Text2DObject.prototype.update = function(){
        var dynamicTexture              = this.dynamicTexture;
        var parameters                  = this.parameters;

        // Get the geometry size to change the canvas size to prevent font deformation
        var geometryWidth = this.geometry.parameters.width !== undefined ? this.geometry.parameters.width : 1;
        var geometryHeight = this.geometry.parameters.height !== undefined ? this.geometry.parameters.height : 1;
	// update the text
	dynamicTexture.clear()

        // actually draw the text
	dynamicTexture.drawTextCooked(parameters, geometryWidth, geometryHeight);
}

/**
 * clone the object
 * 
 * @return {THREEx.Text2DObject} - the resulting cloned object
 */
THREEx.Text2DObject.prototype.clone = function(){
        var clone = new THREEx.Text2DObject();
        // clone params and not reference
        for (var attr in this.parameters) {
                if (this.parameters.hasOwnProperty(attr)) clone.parameters[attr] = this.parameters[attr];
        }
        THREE.Mesh.prototype.copy.call( clone, this );
        clone.geometry.parameters = JSON.parse(JSON.stringify(this.geometry.parameters));
        return clone;
}
