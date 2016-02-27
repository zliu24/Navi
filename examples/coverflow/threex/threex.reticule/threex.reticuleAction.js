var THREEx = THREEx || {}

THREEx.ReticuleAction = function(reticule){
        this._reticule = reticule;
        
        this.hoverDelay        = 2000;
        
        var boundingRect = this._reticule._canvas.getBoundingClientRect();
        
        this._posScreenX = boundingRect.left + boundingRect.width / 2;
        this._posScreenY = boundingRect.top + boundingRect.height / 2;
        
        this._prevTargetDomElement = null;
        this._prevTargetObject3DUuid = null;
}

THREEx.ReticuleAction.prototype.update = function(){
        // Update position/rotation reticule
        var _this = this;
        updatePositionRotationReticule();
        this.raycastSceneCss(this._posScreenX , this._posScreenY);
        this.raycastScene3d(this._posScreenX , this._posScreenY);
        function updatePositionRotationReticule(){
                var positionReticule = _this._reticule._camera.localToWorld( new THREE.Vector3(0,0,-50) );
                _this._reticule.object3d.position.copy(positionReticule);
                _this._reticule.object3d.quaternion.copy(_this._reticule._camera.quaternion);
        }
}

THREEx.ReticuleAction.prototype.raycastScene3d = function(positionX, positionY){
        var scene = this._reticule._scene.children[0].children[0].children[1];
        var isSceneCss = false;
        this._update3D(positionX, positionY, scene, isSceneCss)
}
THREEx.ReticuleAction.prototype.raycastSceneCss = function(positionX, positionY){
        var scene = this._reticule._sceneCss;
        var isSceneCss = true;
        this._update3D(positionX, positionY, scene, isSceneCss)
}
THREEx.ReticuleAction.prototype._update3D = function( positionX, positionY, scene, isSceneCss ){
        var _this = this;
        
        // gather all the clickable objects in the three.js scene
        var clickableObjects = getClickableObjects(scene);
        
        // check if there is an intersection at position X Y 
        var intersects = computeIntersectsAt(positionX, positionY, clickableObjects);
        var isIntersecting = (intersects.length > 0) ? true : false;
        
        if( isSceneCss === false ){
                if(this._sceneCssIntersect === true) return;
                // If no intersection with 3d objects , go to idle
                if( isIntersecting === false ){
                        this._reticule._domContainer.className = "fourjs-reticule-container reticule-idle";
                        this._canvasHoverStartedAt = null;
                        this._prevTargetObject3DUuid = null;
                        return;
                }
                
                // get the intersected object and scripts
                var intersect = intersects[0].object;
                var object3dUuid = intersect.uuid;
                var behaviorObject = scene.behaviors_obj[object3dUuid];
                
                // if there is no script go to idle
                if( behaviorObject === undefined ){
                        this._reticule._domContainer.className = "fourjs-reticule-container reticule-idle";
                        this._canvasHoverStartedAt = null;
                        this._prevTargetObject3DUuid = object3dUuid;
                        return;
                }
                
                var hoveractivated = false;
                behaviorObject.forEach(function(script){
                        if(script.trigger !== "touch" || script.behavior !== "script") return;
                        if(hoveractivated === true) return;
                        hoveractivated = true;
                        
                        activateHover(intersect, script);
                });
        }else{
                // If no intersection with 3d objects , go to idle
                if( isIntersecting === false ){
                        // Remove the hover class from the former target
                        if(this._prevTargetDomElement !== null ){
                                this._prevTargetDomElement.classList.remove("hover");
                        }
                        this._prevTargetDomElement = null;
                        this._sceneCssIntersect = false;
                        return;
                }
                
                this._sceneCssIntersect = true;
                // get the intersected object and scripts
                var intersect = intersects[0].object;
                var targetDomElement = intersect.element || intersect.elementL;
                activateHover(intersect, null);
        }
        return;
        //  Get clickable objects from the scene
        function getClickableObjects(scene){
                var clickableObjects = [];
                
                scene.traverse(function(object3d){
                        if(object3d !== _this._reticule.object3d){
                                clickableObjects.push(object3d)
                        }
                });
                
                return clickableObjects;
        };
        // Get intersects at x y
        function computeIntersectsAt(positionX, positionY, clickableObjects){
                // change window innerwidth to canvas width
                var boundingRect = _this._reticule._canvas.getBoundingClientRect();
                var mouseVector = new THREE.Vector2(( positionX / (boundingRect.left + boundingRect.width) ) * 2 - 1, - ( positionY / (boundingRect.top + boundingRect.height) ) * 2 + 1);
                // raycaster
                var raycaster = new THREE.Raycaster(); 
                raycaster.setFromCamera( mouseVector , _this._reticule._camera );

                var intersects = raycaster.intersectObjects( clickableObjects );
                
                return intersects;
        }
        function activateHover(object3d, script){                
                // if targetDomElement is different than the previous one domElement, go to idle
                // if cursor enters on a new element
                var object3dUuid = object3d.uuid;
                if( object3dUuid !== _this._prevTargetObject3DUuid ){
                        // Trick to restart svg animation of the reticles
                        // - Clone _domContainer and replace it to restart svg animation
                        var domElement = _this._reticule._reticuleContainer.cloneNode(true);
                        _this._reticule._reticuleContainer.parentNode.replaceChild(domElement, _this._reticule._reticuleContainer);
                        _this._reticule._reticuleContainer = domElement;
                        
                        // change the className
                        _this._reticule._domContainer.className = "fourjs-reticule-container reticule-hover";
                        
                        if(isSceneCss === true){
                                // add the hover class to current target
                                targetDomElement.classList.add("hover")
                                
                                // Remove the hover class from the former target
                                if(_this._prevTargetDomElement !== null ){
                                        _this._prevTargetDomElement.classList.remove("hover");
                                }
                                _this._prevTargetDomElement = targetDomElement;
                        }
                        
                        _this._canvasHoverStartedAt = Date.now();
                        //////////////////////////////////////////////////////////////////////////////
                        //              Detect click (when hover times out)
                        //////////////////////////////////////////////////////////////////////////////
                        // if cursor is on the same element as the previous one , and the _hoverStartedAt is over than the hoverdelay
                }else if( _this._canvasHoverStartedAt !== null && _this._canvasHoverStartedAt + _this.hoverDelay <= Date.now() ){
                        if(isSceneCss === true){
                                // FIXME children 0 to remove
                                targetDomElement.children[0].click();
                                _this._prevTargetDomElement = null;
                        }else{
                                // trigger the click event at the dom element level
                                triggerClick(script);
                        }
                        _this._reticule._domContainer.className = "fourjs-reticule-container reticule-clicked";

                        _this._canvasHoverStartedAt = null;
                        object3dUuid = null;
                }
                
                // store current target in previous target
                _this._prevTargetObject3DUuid = object3dUuid;
        }
        function triggerClick(script){
                // Retrieve context of the script
                var objectScripted;
                _this._reticule._scene.traverse(function(object3d){
                        if(object3d.uuid === script.object_uuid){
                                objectScripted = object3d;
                        }
                })
                // Function which will be given a context via the call
                function evaluateScript(){
                        eval(script.script);
                }
                evaluateScript.call(objectScripted);
                
                _this._reticule._domContainer.className = "fourjs-reticule-container reticule-clicked";
                _this._hoverStartedAt = null;
                _this._prevTargetObject3DUuid = null;
        }
}
THREEx.ReticuleAction.prototype.resizeEvent = function(){
        var boundingRect = this._reticule._canvas.getBoundingClientRect();
        
        this._posScreenX = boundingRect.left + boundingRect.width / 2;
        this._posScreenY = boundingRect.top + boundingRect.height / 2;
}