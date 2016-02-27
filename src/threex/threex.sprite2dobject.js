var THREEx      = THREEx        || {}

/**
 * create a plane on which we map 2d sprite
 *
 * @class
 */
THREEx.Sprite2DObject        = function(){
        var material = new THREE.SpriteMaterial({
                transparent: false
        });

        THREE.Sprite.call( this, material );

        // create the dynamicTexture
        var dynamicTexture      = new THREEx.DynamicTexture(512,512)

        this.dynamicTexture     = dynamicTexture;
        // - TODO take it from the default paramters of the functions
        //   - no need to duplicate here
        this.parameters = {
                shape           : 'circle',
                shapeColor      : '#1054B5',
                text            : 'A',
                fontSize        : 90,
                fontFamily      : "Arial",
                fontWeight      : "bold",
                fontColor       : "#ffffff",
                // Usable in code but not in UI
                align           : "center",
                shadowEnabled   : false,
                margin          : 0
        }

        // set the texture material
        material.map    = this.dynamicTexture.texture;

        this.update();
}

THREEx.Sprite2DObject.prototype = Object.create( THREE.Sprite.prototype );

/**
 * update the object
 */
THREEx.Sprite2DObject.prototype.update = function(){
        var dynamicTexture              = this.dynamicTexture;
        var parameters                  = this.parameters;

        // update the text
        dynamicTexture.clear();

        // actually draw the text
        dynamicTexture.drawTextureSprite(parameters)
}

/**
 * clone the object
 * 
 * @return {THREEx.Sprite2DObject} - the resulting cloned object
 */
THREEx.Sprite2DObject.prototype.clone = function(){
        var clone = new THREEx.Sprite2DObject();
        // clone params and not reference
        for (var attr in this.parameters) {
                if (this.parameters.hasOwnProperty(attr)) clone.parameters[attr] = this.parameters[attr];
        }
        THREE.Sprite.prototype.copy.call( clone, this );
        clone.update();

        return clone;
}
