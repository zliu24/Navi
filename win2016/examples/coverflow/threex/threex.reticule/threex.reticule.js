var THREEx = THREEx || {}

/**
 * handle the reticule for the UI
 * 
 * @param  {[type]} canvas        [description]
 * @param  {[type]} _camera        [description]
 * @param  {[type]} scene         [description]
 * @param  {[type]} stereoEnabled [description]
 * @return {[type]}               [description]
 */
THREEx.Reticule	= function(canvas, camera, scene, sceneCss, stereoEnabled){
        // store the parameters
        this._stereoEnabled = stereoEnabled !== undefined ? stereoEnabled : false;
        this._canvas = canvas || console.assert(false);
        this._camera = camera || console.assert(false);
        this._scene = scene || console.assert(false);
        this._sceneCss = sceneCss || console.assert(false);

        // create the domElement to contain the svg for each reticule (even in stereo)
        this._domContainer = document.createElement('div');
        this._domContainer.className = "fourjs-reticule-container";
        document.body.appendChild(this._domContainer);
        /**
         * hovering delay before click in millisecond
         * @type {Number}
         */
        
        // this._prevTargetObject3DUuid = null;

        // add reticule
        this._buildReticule();
        
        this.reticuleAction = new THREEx.ReticuleAction(this);      
}

//////////////////////////////////////////////////////////////////////////////
//              Code Separator
//////////////////////////////////////////////////////////////////////////////


/**
 * check if something is in the Reticule
 */
THREEx.Reticule.prototype.update = function(){
        this.reticuleAction.update();
}

/**
 * add reticule in Dom
 */
THREEx.Reticule.prototype._buildReticule = function(){
        
        this._reticuleContainer = document.createElement('div');
        this._reticuleContainer.className = "fourjs-reticule";
        this._reticuleContainer.innerHTML = '<svg viewBox="0 0 60 60"><circle class="circle"></circle></svg>';
        var circle = this._reticuleContainer.querySelector('.circle');
        circle.style.animationDuration = this.hoverDelay /1000 + "s";
        
        // FIXME attach that to the same parent as the other reticule ? somewhere else ?
        this._domContainer.appendChild(this._reticuleContainer);

        //  center reticule
        this.object3d = new THREE.CSS3DObject( this._domContainer );
        
        // Code to make the reticule at the same position and always facing the _camera
        // var positionReticule = this._camera.localToWorld( new THREE.Vector3(0,0,-10) );
        // this.object3d.position.copy(positionReticule);
        // this.object3d.quaternion.copy(this._camera.quaternion);
        
}