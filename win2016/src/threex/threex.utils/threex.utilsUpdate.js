var THREEx  = THREEx  || {};

THREEx.UtilsUpdate = {};
THREEx.UtilsUpdate.updateGeometry = {};
//////////////////////
/// threex update function
/////////////////////
THREEx.UtilsUpdate.updateObjectGeometry = function(object) {
        delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)
        object.geometry.dispose();
        if (object.geometry instanceof THREEx.TextGeometry) {
                
                updateGeometryText(object);
                
        }else if(object.geometry instanceof THREE.BoxGeometry){
                
                updateGeometryBox(object);
                
        }else if(object.geometry instanceof THREE.CylinderGeometry){
                
                updateGeometryCylinder(object);
                
        }else if(object.geometry instanceof THREEx.CalloutGeometry){
                
                updateGeometryCallout(object);
                
        }else if(object.geometry instanceof THREE.CircleGeometry){
                
                updateGeometryCircle(object);
                
        }else if(object.geometry instanceof THREE.PlaneGeometry){
                
                updateGeometryPlane(object);
                
        }else if(object.geometry instanceof THREE.SphereGeometry){
                
                updateGeometrySphere(object);
                
        }else{
                console.assert(false)
        }
        
        
        object.geometry.computeBoundingSphere();
        
        
        
        
        return;
        ///////////////////
        ///
        ///////////////////
        function updateGeometryText (object) {
                var parameters = object.geometry.parameters;
                var text = parameters.text;
                var options = parameters;
                object.geometry = new THREEx.TextGeometry(text, options);
        };
        function updateGeometryBox (object) {
                var parameters = object.geometry.parameters;
                object.geometry = new THREE.BoxGeometry(parameters.width, parameters.height, parameters.depth, parameters.widthSegments, parameters.heightSegments, parameters.depthSegments);
        };
        function updateGeometryCylinder (object) {
                var parameters = object.geometry.parameters;
                object.geometry = new THREE.CylinderGeometry(parameters.radiusTop, parameters.radiusBottom, parameters.height, parameters.radialSegments, parameters.heightSegments, parameters.openEnded);
        };
        function updateGeometryCallout (object) {
                var parameters = object.geometry.parameters;
                object.geometry = new THREEx.CalloutGeometry(parameters);
                object.computeDynamicTexture();
        };
        function updateGeometryCircle (object) {
          var parameters = object.geometry.parameters;
          object.geometry = new THREE.CircleGeometry(parameters.radius, parameters.segments);
        };
        function updateGeometryPlane (object) {
          var parameters = object.geometry.parameters;
          object.geometry = new THREE.PlaneGeometry(parameters.width, parameters.height, parameters.widthSegments, parameters.heightSegments);
          // update the 2d texture if it exists
          if(object instanceof THREEx.Text2DObject){
              object.update();
          }
        };
        function updateGeometrySphere (object) {
          var parameters = object.geometry.parameters;
          if( !parameters.radius )  parameters.radius = 0.001;
          object.geometry = new THREE.SphereGeometry(parameters.radius, parameters.widthSegments, parameters.heightSegments, parameters.phiStart, parameters.phiLength, parameters.thetaStart, parameters.thetaLength);
        };
}

THREEx.UtilsUpdate.updateObjectSprite = function(object) {
        delete object.__webglInit; // TODO: Remove hack (WebGLRenderer refactoring)
        object.geometry.dispose();
        object.update();
};

THREEx.UtilsUpdate.updateObjectArrow = function(object) {
        if(object.parent instanceof THREEx.ArrowModelObject){
                object.parent.update();
                // return arrow mesh and not the object3d parent
                return object;
        }else{
                console.assert(object instanceof THREEx.ArrowModelObject === true);
                object.update();
                // return arrow mesh and not the object3d parent
                return object.children[0];
        }
};

THREEx.UtilsUpdate.updateObjectMaterial = function(object, color) {
        object.material.color.setStyle(color)
        object.geometry.buffersNeedUpdate = true;
        object.geometry.colorsNeedUpdate = true;
        object.material.needsUpdate = true;
};