var THREEx  = THREEx  || {};

THREEx.UtilsClone = {};
// TODO Remove $scope
THREEx.UtilsClone.cloneObject = function(object,editor,$scope) {
        /* clone object */
        var cloned = object.clone();
        
        //TODO find a way to clone parameters linked from geomtry or mesh
        if(object.geometry instanceof THREEx.TextGeometry){
                var clonedParameters = JSON.parse(JSON.stringify(object.geometry.parameters))
                var geometry = new THREEx.TextGeometry(clonedParameters.text, clonedParameters);
                cloned.geometry = geometry;
        }
        
        /* NOTE: Change this if object can be renamed */
        cloned.name = THREEx.Utils.BuildObject3DUniqueName(editor.scene, cloned.name);
        
        /* Mesh.clone uses same geometry and material objects when cloning.
        * Update geometry and clone material */
        // TODO remove dependency
        $scope.threejs.geometry.objectUpdate(object);
        $scope.threejs.geometry.objectUpdate(cloned);


        if (object.material && !(object.material.map instanceof THREE.CanvasTexture)) {
                cloned.material = object.material.clone();
                if (object.material.map && object.material.map.sourceURL && !(object instanceof THREEx.ImageObject)) {
                        // TODO remove dependency
                        sceneFile.downloadTexture(object.material.map.sourceURL, object.material.map.uuid, function(uuid, texture) {
                                if (cloned.geometry) {
                                        cloned.geometry.buffersNeedUpdate = true;
                                        cloned.geometry.uvsNeedUpdate = true;
                                }
                                cloned.material.map = texture;
                                cloned.material.needsUpdate = true;
                                var textureFile = editor.scene.files.filter(function(file) {
                                        return file.uuid == uuid;
                                })[0];
                                if (textureFile) {
                                        editor.scene.files.push(_.extend({}, textureFile, {uuid: texture.uuid}));
                                }
                        }, function(){}, $scope);
                }
        }
        
        // clone object files
        var objectFiles = editor.scene.files.filter(function(file) {
                return (file.uuid === object.uuid) || (file.uuids && file.uuids.indexOf(object.uuid) > -1);
        });
        _.each(objectFiles, function(file) {
                var clonedFile = {};
                _.extend(clonedFile, file);
                if (clonedFile.uuid) {
                        clonedFile.uuid = cloned.uuid;
                } else {
                        clonedFile.uuids = [cloned.uuid];
                }
                editor.scene.files.push(clonedFile);
        });
        
        /* Clone animation */
        if (object.posrotscaAnimation) {
                var data = object.posrotscaAnimation.toJson()
                cloned.posrotscaAnimation = THREEx.PosrotscaAnimation.fromJson(cloned, data);
        }
        
        if (object.cannotBeEdited !== undefined) {
                cloned.cannotBeEdited = object.cannotBeEdited;
        }
        //prevent changes on the cloned children for the arrows (Hack for the hack below)
        if(object instanceof THREEx.ArrowModelObject){
                if (object.children[0].posrotscaAnimation) {
                        var data = object.children[0].posrotscaAnimation.toJson()
                        cloned.children[0].posrotscaAnimation = THREEx.PosrotscaAnimation.fromJson(cloned.children[0], data);
                }
                return cloned;
        }
        
        /* Childern objects also use references for geometry and materual. Clone them also */
        if (object.children.length) {
                cloned.children = [];
                _.each(object.children, function(child) {
                        cloned.add(THREEx.UtilsClone.cloneObject(child,editor,$scope));
                });
        }
        
        return cloned;
}
THREEx.UtilsClone.clone = function(object,editor,$scope) {
        
        var object = object || editor.selected;
        if (object === undefined || object === null) {
                return null;
        }
        if (object.parent === undefined) { // avoid cloning the camera or scene
                return null;
        }
        // Hack to bypass the hack below (if attempt to clone arrow child [arrow mesh])
        if (object.parent instanceof THREEx.ArrowModelObject) { 
                object = object.parent;
                console.assert(object instanceof THREEx.ArrowModelObject === true)
        }
        var cloned = THREEx.UtilsClone.cloneObject(object,editor,$scope);
        
        // hack for clone object transform correction...
        cloned.parent = object.parent;
        cloned.position.x = object.position.x;
        cloned.position.y = object.position.y;
        cloned.position.z = object.position.z;
        cloned.rotation.x = object.rotation.x;
        cloned.rotation.y = object.rotation.y;
        cloned.rotation.z = object.rotation.z;
        cloned.scale.x = object.scale.x;
        cloned.scale.y = object.scale.y;
        cloned.scale.z = object.scale.z;
        THREE.SceneUtils.detach(cloned, object.parent, editor.scene);
        THREE.SceneUtils.attach(cloned, editor.scene, editor.scene);
        
        editor.addObject(cloned);
        editor.select(cloned);
        return cloned;
}