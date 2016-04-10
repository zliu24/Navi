var THREEx  = THREEx  || {};

THREEx.Utils = {};



//////////////////////
/// threex action function
/////////////////////
THREEx.Utils.BuildObject3DUniqueName = function(scene,name) {
        // get name without number
        var prefixName = name.replace(/\s+\d+\s*$/,"");
        
        var currentName = prefixName
        // META access editor scene global
        for(var i = 1; nameExist(scene, currentName); i++){
                currentName = prefixName + ' ' + i
        }
        
        return currentName
        
        /**
        * return true if the object3d for the same name
        * @param  {THREE.Object3D} root - the root object3d 
        * @param  {string} name - the name to test
        * @return {Boolean} true if it exists, false otherwise
        */
        function nameExist(root, name){
                var exist = false
                root.traverse ( function (object3d) {
                        // test if the built name exist , if it does, increment number and reset function
                        if(object3d.name === name) exist = true
                });       
                return exist;
        }    
};

THREEx.Utils.removeMaterialMap = function(object3d) {
        // Remove texture
        object3d.material.map = null;
        object3d.material.needsUpdate = true;

        if (object3d.geometry !== undefined) {
                  object3d.geometry.buffersNeedUpdate = true;
                  object3d.geometry.uvsNeedUpdate = true;
        }
};

THREEx.Utils.addMaterialMap = function(object3d,texture) {
        if (object3d.geometry !== undefined) {
                object3d.geometry.buffersNeedUpdate = true;
                object3d.geometry.uvsNeedUpdate = true;
        }
        object3d.material.map = texture;
        object3d.material.needsUpdate = true;
};

THREEx.Utils.findObject3dByUuid = function(scene, uuid) {
        var found = null;
        scene.traverse( function ( child ) {
                if (child.uuid == uuid) {
                        found = child;
                }
        });
        return found;
};
THREEx.Utils.canModifySelectionTexture = function(object3d) {
        if(object3d === null) return false;
        // disable texture modification for callout
        if( object3d.geometry instanceof THREEx.CalloutGeometry )  return false

        // disable texture modification for text
        if( object3d.geometry instanceof THREEx.TextGeometry )  return false;

        if(object3d !== null && object3d.geometry !== undefined){
          // check if the object got UV, required to have texture
          var geometry = object3d.geometry
          var objectHasUvs = false;
          if ( object3d instanceof THREE.Sprite ) objectHasUvs = true;
          if ( geometry instanceof THREE.Geometry && geometry.faceVertexUvs[ 0 ].length > 0 ) objectHasUvs = true;
          if ( geometry instanceof THREE.BufferGeometry && geometry.attributes.uv !== undefined ) objectHasUvs = true;
          return objectHasUvs;
        }

        // return true by default
        return true;

};