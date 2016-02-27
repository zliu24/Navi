var THREEx = THREEx || {}

/**
 * helper for THREEx.Reticule
 * 
 * @param  {boolean} stereoEnabled
 */
THREEx.ReticuleHelper = function( camera, stereoEnabled ){        
        this.camera = camera
        this.eyeSeparation = 6
        this._stereoEnabled = stereoEnabled
        this.object3d = new THREE.Group()
        
        this._cameraHelpers = []

        if( stereoEnabled === false ){
                var rayObject3d    = new THREEx.ReticuleHelper._buildRayVisual()
                this.object3d.add(rayObject3d)

                var cameraHelper = new THREE.CameraHelper(camera)
                this.object3d.add(cameraHelper)
        }else{
                var rayObject3d    = new THREEx.ReticuleHelper._buildRayVisual()
                this.object3d.add(rayObject3d)

                var rayObject3d    = new THREEx.ReticuleHelper._buildRayVisual()
                this.object3d.add(rayObject3d)

                var rayObject3d    = new THREEx.ReticuleHelper._buildRayVisual()
                this.object3d.add(rayObject3d)
                rayObject3d.scale.set(0.5,0.5,1)
                rayObject3d.material.color.set('red')


                this._cameraL   = camera.clone()
                this._cameraR   = camera.clone()

                var cameraHelper = new THREE.CameraHelper(this._cameraL)
                this.object3d.add(cameraHelper)
                var cameraHelper = new THREE.CameraHelper(this._cameraR)
                this.object3d.add(cameraHelper)
        }
}

THREEx.ReticuleHelper.prototype.update = function(){
        var camera = this.camera;
        
        if( this._stereoEnabled === false ){
                var rayObject3d = this.object3d.children[0]
                THREEx.ReticuleHelper._updateRayVisual(rayObject3d, camera)

                var cameraHelper = this.object3d.children[1]
                cameraHelper.update(camera)
        }else{
                
                this._cameraL.copy( camera )
		this._cameraL.translateX( -this.eyeSeparation/2 );
                this._cameraL.updateMatrixWorld();

                this._cameraR.copy( camera )
		this._cameraR.translateX( +this.eyeSeparation/2 );
                this._cameraR.updateMatrixWorld();


                var rayObject3d = this.object3d.children[0]
                THREEx.ReticuleHelper._updateRayVisual(rayObject3d, this._cameraL)

                var rayObject3d = this.object3d.children[1]
                THREEx.ReticuleHelper._updateRayVisual(rayObject3d, this._cameraR)

                var rayObject3d = this.object3d.children[2]
                THREEx.ReticuleHelper._updateRayVisual(rayObject3d, camera)
        }
}

//////////////////////////////////////////////////////////////////////////////
//              Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ReticuleHelper._updateRayVisual    = function(rayObject3d, camera){
        rayObject3d.position.copy(camera.position)
        rayObject3d.quaternion.copy(camera.quaternion);
}

THREEx.ReticuleHelper._buildRayVisual    = function(){
        var geometry    = new THREE.CylinderGeometry(0.5,0.5,200,8, 1)
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI/2 ) );
        var material    = new THREE.MeshBasicMaterial({
                wireframe : true
        })
        var rayObject3d    = new THREE.Mesh(geometry, material)
        return rayObject3d
}

