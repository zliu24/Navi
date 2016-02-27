/**
 * @file provide a class to handle coverflow in three.js css3d
 *
 * - forumula here http://www.coconnut.com/blog/source/jel/CoverflowMenu/
 * - take tweening from http://127.0.0.1:8000/examples/css3d_periodictable.html
 * - how to generate the tweening target ?
 *   - the selected element is at the center. it is front camera, and closer to camera
 *   - the previous elements are facing more on the right
 *   - the next elements are facing more on the left
 * - on each new selection, regenerate the target
 */
var THREEx = THREEx || {}

THREEx.CoverflowCss3d	= function(domElements){
        var coverflow   = this
        
        this.object3d           = new THREE.Object3D
        this.domElements        = domElements
        this.objects            = []
        this._tweens            = []
        this.selectedIndex      = 0
        this.signals    = {
                selected : new signals.Signal(),
        }

        this.positionEasing  = TWEEN.Easing.Cubic.Out
        this.rotationEasing  = TWEEN.Easing.Cubic.Out

        // default function to compute the target - overwrite it to make another shape
        this.computeTargetCallback      = function(object3d, index, selectedIndex){
                if( index === selectedIndex ){
                        object3d.position.x     = 0                        
                        object3d.position.z     = +20
                }else{
                        var delta       = index - selectedIndex;
                        object3d.position.x     = delta * 50
                        object3d.position.z     = 0
                }                
        }

        this.domElements.forEach(function(domElement, index){
                var object3d = new THREE.CSS3DObject( domElement );
                coverflow.objects.push(object3d)
	        coverflow.object3d.add( object3d )
        })
        
        coverflow.reset()
}

THREEx.CoverflowCss3d.prototype.dispose = function(){
        this._disposeTween()
}

THREEx.CoverflowCss3d.prototype._disposeTween = function(){
        while( this._tweens.length > 0 ){
                var tween       = this._tweens.shift()
                tween.stop()
        }
}

/**
 * update coverflow - especially all the tweening
 */
THREEx.CoverflowCss3d.prototype.update = function(){
        this._tweens.forEach(function(tween){
                var now = window.performance.now()
                tween.update(now)
        })
}

THREEx.CoverflowCss3d.prototype.select = function (selectedIndex) {
        // handle limits
        if( selectedIndex < 0 ) selectedIndex   = 0
        if( selectedIndex > this.objects.length-1 ) selectedIndex   = this.objects.length-1

        // regenerate the tween
        this._generateTargetTween(selectedIndex, 800)
        this.selectedIndex      = selectedIndex
        
        this.signals.selected.dispatch(selectedIndex)
}

THREEx.CoverflowCss3d.prototype.reset = function () {
        // dispose of existing tween
        this._disposeTween()
        
        // reinit all the tweening
        var tmpObject3d    = new THREE.Object3D()
	for ( var i = 0; i < this.objects.length; i ++ ) {
                this.computeTargetCallback(tmpObject3d, i, this.selectedIndex)
                var object3d = this.objects[i]
                object3d.position.copy( tmpObject3d.position )
                object3d.rotation.copy( tmpObject3d.rotation )
        }
}

/**
 * generate the target position for the tweening and start tweening
 * @param  {Number} selectedIndex - the selected element
 * @param  {[type]} duration      [description]
 */
THREEx.CoverflowCss3d.prototype._generateTargetTween = function (selectedIndex, duration) {
        var coverflow = this
        
        // generate the target position
        var targetObjects       = []
        for(var index = 0; index < coverflow.objects.length; index++){
                var object3d    = new THREE.Object3D()
                this.computeTargetCallback(object3d, index, selectedIndex)
                targetObjects.push(object3d)
        }
        
        // dispose of existing tween
        coverflow._disposeTween()

        // reinit all the tweening
	for ( var i = 0; i < coverflow.objects.length; i ++ ) {

		var object = coverflow.objects[ i ];
		var target = targetObjects[ i ];

                // tween for position
		var tween = new TWEEN.Tween( object.position )
			.to( { x: target.position.x, y: target.position.y, z: target.position.z },
                                duration )
			.easing( this.positionEasing )
			.start();
                coverflow._tweens.push(tween)
                
                // tween for rotation
		var tween = new TWEEN.Tween( object.rotation )
			.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, 
                                duration )
			.easing( this.rotationEasing )
			.start();
                coverflow._tweens.push(tween)
	}
};

