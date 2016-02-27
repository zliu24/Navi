var THREEx	= THREEx	|| {}

//////////////////////////////////////////////////////////////////////////////////
//		Constructor							//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Class ArrowModelObject
 * 
 * @param  {object} options - options to pass to the constructor
 */
THREEx.ArrowModelObject = function(options){
        this.parameters = options ||  {
                type    : "2D",
                curve   : "straight"
        }

        THREE.Object3D.call( this);
        
        if(THREEx.ArrowModelObject.geometryAssetsToLoad !== 0){
                var geometry = new THREE.BoxGeometry(1,1,1);
                var material = new THREE.MeshPhongMaterial({
                        side : THREE.DoubleSide
                });
        }else{
                var geometry = this._getModel().geometry.clone();
                var material = this._getModel().material.clone();
                material.side = THREE.DoubleSide
        }
        
        this._mesh = new THREE.Mesh(geometry, material);
        
        var _this = this;
        // When attempt to clone child , clone child+parent instead
        this._mesh.clone = function(recursive){
          return _this.clone(recursive);
        }
        
        this.add(this._mesh);
        // TODO Remove dependancy of scope
        // Rename the child with same number as parent if parent as a number
        // get the canvas dom element
        var canvas = document.querySelector('canvas');
        // get the angular scope for this element
        if(window.hasOwnProperty('angular')) {
                var scope = angular.element(canvas).scope();
                if (scope.threejs) {
                        this._mesh.name = scope.threejs.BuildObject3DUniqueName(this.parameters.type + " Arrow Mesh");
                }
        }
        this.update();
};

THREEx.ArrowModelObject.prototype = Object.create( THREE.Object3D.prototype );

/**
 * Update method called when changes are made in the editor
 */
THREEx.ArrowModelObject.prototype.update = function(){
        this._mesh.geometry.dispose();
        if(this._getModel() === null){
                this._mesh.geometry = new THREE.BoxGeometry(1,1,1);
        } else {
                this._mesh.geometry = this._getModel().geometry.clone();
        }
}

/**
 * Method to get the arrows geometry
 * @return {object} - return THREE.geometry
 */
THREEx.ArrowModelObject.prototype._getModel = function(){
        if(this.parameters.curve === "right"){
                if(this.parameters.type === "2D"){
                        return THREEx.ArrowModelObject.arrowModelCurvedRight;
                }else{
                        return THREEx.ArrowModelObject.arrowModel3DCurvedRight;
                }                        
        }else if(this.parameters.curve === "left"){
                if(this.parameters.type === "2D"){
                        return THREEx.ArrowModelObject.arrowModelCurvedLeft;
                }else{
                        return THREEx.ArrowModelObject.arrowModel3DCurvedLeft;
                }
        }else{
                if(this.parameters.type === "2D"){
                        return THREEx.ArrowModelObject.arrowModelStraight;
                }else{
                        return THREEx.ArrowModelObject.arrowModel3DStraight;
                }
        }
}

/**
 * Geometries to load and variables that will store arrows geometry
 */
THREEx.ArrowModelObject.geometryAssetsToLoad = 6;
THREEx.ArrowModelObject.arrowModelStraight = null;
THREEx.ArrowModelObject.arrowModelCurvedRight = null;
THREEx.ArrowModelObject.arrowModelCurvedLeft = null;
THREEx.ArrowModelObject.arrowModel3DStraight = null;
THREEx.ArrowModelObject.arrowModel3DCurvedRight = null;
THREEx.ArrowModelObject.arrowModel3DCurvedLeft = null;
// url to get models
THREEx.ArrowModelObject.modelsUrl = 'models';

THREEx.ArrowModelObject.loadFromAssets = function() {
        try {
                var loader = new THREE.OBJLoader();
                THREEx.ArrowModelObject.arrowModelCurvedLeft = loader.parse(FourJS.Assets["models/threex.arrow2dobject/arrow_curved_leftFlat.obj"]).children[0];
                THREEx.ArrowModelObject.arrowModelCurvedRight = loader.parse(FourJS.Assets["models/threex.arrow2dobject/arrow_curved_rightFlat.obj"]).children[0];
                THREEx.ArrowModelObject.arrowModelStraight = loader.parse(FourJS.Assets["models/threex.arrow2dobject/arrow_flat.obj"]).children[0];
                THREEx.ArrowModelObject.arrowModel3DStraight = loader.parse(FourJS.Assets["models/threex.arrow3dobject/arrow_3D.obj"]).children[0];
                THREEx.ArrowModelObject.arrowModel3DCurvedLeft = loader.parse(FourJS.Assets["models/threex.arrow3dobject/arrow_curved_left3D.obj"]).children[0];
                THREEx.ArrowModelObject.arrowModel3DCurvedRight = loader.parse(FourJS.Assets["models/threex.arrow3dobject/arrow_curved_right3D.obj"]).children[0];
        }
        catch(err) {
                console.error("ERROR: THREEx.ArrowModelObject.loadFromAssets: "+err);
        }
};

THREEx.ArrowModelObject.loadFromAssets();

/**
 * Method that loads the model when called
 * @param {THREE.Scene=} scene - This is the optional scene object. If passed this is iterated through. This is not necessary
 *                in 4dstudio as there is global access to the scene object.
 */

THREEx.ArrowModelObject.loadModels = function(scene){
        var pathUrl = THREEx.ArrowModelObject.modelsUrl;
        var loader = new THREE.OBJLoader();
        loader.load( pathUrl+'/threex.arrow2dobject/arrow_curved_leftFlat.obj', function ( object ) {
                THREEx.ArrowModelObject.arrowModelCurvedLeft = object.children[0];
                THREEx.ArrowModelObject._onLoaded(scene);
        });
        loader.load( pathUrl+'/threex.arrow2dobject/arrow_curved_rightFlat.obj', function ( object ) {
                THREEx.ArrowModelObject.arrowModelCurvedRight = object.children[0];
                THREEx.ArrowModelObject._onLoaded(scene);
        });
        loader.load( pathUrl+'/threex.arrow2dobject/arrow_flat.obj', function ( object ) {
                THREEx.ArrowModelObject.arrowModelStraight = object.children[0];
                THREEx.ArrowModelObject._onLoaded(scene);
        });
        loader.load( pathUrl+'/threex.arrow3dobject/arrow_curved_left3D.obj', function ( object ) {
                THREEx.ArrowModelObject.arrowModel3DCurvedLeft = object.children[0];
                THREEx.ArrowModelObject._onLoaded(scene);
        });
        loader.load( pathUrl+'/threex.arrow3dobject/arrow_curved_right3D.obj', function ( object ) {
                THREEx.ArrowModelObject.arrowModel3DCurvedRight = object.children[0];
                THREEx.ArrowModelObject._onLoaded(scene);
        });
        loader.load( pathUrl+'/threex.arrow3dobject/arrow_3D.obj', function ( object ) {
                THREEx.ArrowModelObject.arrowModel3DStraight = object.children[0];
                THREEx.ArrowModelObject._onLoaded(scene);
        });
}

/**
 * Observer that will make sure that all the geometries are loaded before replacing them all in the scene
 * @param {THREE.Scene=} sceneOptional - If passed this is iterated through. This is not necessary
 *                        in 4dstudio as there is global access to the scene object.
 */
THREEx.ArrowModelObject._onLoaded = function(sceneOptional){
        if(THREEx.ArrowModelObject.geometryAssetsToLoad<=0)return;
        THREEx.ArrowModelObject.geometryAssetsToLoad--;
        if(THREEx.ArrowModelObject.geometryAssetsToLoad === 0){
                // get the angular scope for this element
                // If no sceneOptional is passed then get the scene from the scene from angular.
                var scene = sceneOptional || THREEx.ArrowModelObject.getScene();
                scene.traverse(function (child) {
                        if (child instanceof THREEx.ArrowModelObject) {
                                child.update();
                                if(!sceneOptional && window.hasOwnProperty("angular")) {
                                        var canvas = document.querySelector('canvas');
                                        angular.element(canvas).scope().threejs.editor.signals.objectChanged.dispatch(child);
                                }
                                child._mesh.geometry.computeBoundingSphere();
                        }
                });
        }
}
/**
 * Override the clone function from THREE.object3D 
 * @param  {boolean=} recursive - flag for recursive
 * @return {object}           - return three.js mesh (javascript object)
 */
THREEx.ArrowModelObject.prototype.clone = function(recursive){
        var clonedParameters = {};
        for (var attr in this.parameters) {
                if (this.parameters.hasOwnProperty(attr)) clonedParameters[attr] = this.parameters[attr];
        }
        
        var clone = new THREEx.ArrowModelObject(clonedParameters);
        
        THREE.Object3D.prototype.copy.call( clone, this, false );

        THREE.Object3D.prototype.copy.call( clone.children[0], this.children[0], false );
        
        clone.children[0].material = this.children[0].material.clone();
        
        var canvas = document.querySelector('canvas');
        // get the angular scope for this element
        // TODO Remove dependancy of scope
        if(window.hasOwnProperty("angular")) {
                var scope = angular.element(canvas).scope();
                if(scope) {
                        if (scope.threejs) {
                                clone._mesh.name = scope.threejs.BuildObject3DUniqueName(clone.parameters.type + " Arrow Mesh");
                        }

                        clone.update();

                        return clone;
                }
        }
        return undefined;
}
THREEx.ArrowModelObject.getScene = function(){
        // TODO Remove dependancy of scope
        if(window.hasOwnProperty("angular")) {
          var canvas = document.querySelector('canvas');
          var scene = angular.element(canvas).scope().threejs.editor.scene;
          return scene;
        }else{
          return Daqri.IndustrialApp.getFourJSSceneViewer().getRenderer().getScene();
        }
        
}