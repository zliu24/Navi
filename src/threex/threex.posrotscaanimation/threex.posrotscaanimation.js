var THREEx	= THREEx	|| {}

/**
 * Class PosrotscaAnimation
 * @class
 * @param  {THREE.Object3D} object3d Object 3D to transformation
 */
THREEx.PosrotscaAnimation	= function(object3d){
	this._steps		= []
	this.mode		= 'idle'	// 'playing' 'recording' or 'idle'
	this.stepDuration	= 1
	this.loopMode		= 'repeat'
	this.object3d		= object3d !== undefined ? object3d : null
	this._object3dOriginStored = false;
	this._originPosRotSca = null;
	this._emptyStep = null;
}
 
//////////////////////////////////////////////////////////////////////////////////
//		Comment								//
//////////////////////////////////////////////////////////////////////////////////
/**
 * get step length
 * @return {Number} - return array length
 */
THREEx.PosrotscaAnimation.prototype.nSteps = function() {
	return this._steps.length
};

/**
 * get steps
 * 
 * @return {Array} - return the ._steps array
 */
THREEx.PosrotscaAnimation.prototype.getSteps = function() {
	return this._steps
};


THREEx.PosrotscaAnimation.prototype.isPlayable = function() {
	return this._steps.length >= 2 ? true : false
};

/**
 * reset the object
 */
THREEx.PosrotscaAnimation.prototype.reset = function() {
	this._steps	= []
}

/**
 * calculate relative posrotsca
 * @param  {THREE.Object3D} object3D  - Object3D affected by the transformation
 * @param  {Object} posrotsca - Object containing THREE.position,THREE.quaternion,THREE.scale
 * @return {Object}           - Return new posrotsca object
 */
THREEx.PosrotscaAnimation.prototype._getRelativePosRotSca = function(object3D,posrotsca) {
	var tempVector = new THREEx.Posrotsca();

	// Position relative
	var positionToAdd = new THREE.Vector3();
	
	// Apply quaternion on position to get new position relative to the rotation
	positionToAdd.copy( posrotsca.position ).applyQuaternion( this._originPosRotSca.diffQuaternion );
	// update position
	tempVector.position.x = this._originPosRotSca.position.x + (positionToAdd.x);
	tempVector.position.y = this._originPosRotSca.position.y + (positionToAdd.y);
	tempVector.position.z = this._originPosRotSca.position.z + (positionToAdd.z);
	//  quaternion relative
	tempVector.quaternion.copy(this._originPosRotSca.quaternion).multiply(posrotsca.quaternion);

	// Scale relative
	tempVector.scale.x = this._originPosRotSca.scale.x * posrotsca.scale.x;
	tempVector.scale.y = this._originPosRotSca.scale.y * posrotsca.scale.y;
	tempVector.scale.z = this._originPosRotSca.scale.z * posrotsca.scale.z;
	
	return tempVector;
}

/**
 * called on update, to calculate slerp for position, rotation and scale
 * @param  {THREE.Object3D} object3d Object3D to apply the transformation
 * @param  {Number} progress progress number between 0 & 1
 */
THREEx.PosrotscaAnimation.prototype.set = function(object3d, progress){
	console.assert(progress >= 0 && progress <= 1.0)
	if(object3d.posrotscaAnimation === undefined) return;
	
	// Condition to store the original posrotsca of the object if it's not already stored
	if(this._object3dOriginStored === false){
		var PosRotScaObjectIdle = new THREEx.Posrotsca(object3d);
		this._originPosRotSca = PosRotScaObjectIdle.clone();
		
		// Get diff angle between actual position and position stored when creating posrotsca
		var tempQuaternion = new THREE.Quaternion();
		var tempQuaternion2 = new THREE.Quaternion();
		tempQuaternion.copy(this._steps[0].quaternion)
		tempQuaternion2.copy(this._originPosRotSca.quaternion);
		this._originPosRotSca.diffQuaternion = tempQuaternion2.multiply(tempQuaternion.inverse());

		this._object3dOriginStored = true;
		
		// empty step is a null posrotsca
		this._emptyStep = new THREEx.Posrotsca();
	}
	
	if (this._steps.length < 2) { return false; } // Handle invalid animations gracefully

	// handle special case of progress === 1.0
	if( progress === 1.0 ){
		
		if( (this._steps.length-1) === 0){
			var posrotscaTmp= this._getRelativePosRotSca(object3d, this._emptyStep)
		}else{
			var posrotscaTmp= this._getRelativePosRotSca(object3d, this._steps[this._steps.length-1])
		}
		
		
		var posrotsca	= new THREEx.Posrotsca(object3d)
		posrotsca.lerpVector(posrotscaTmp, posrotscaTmp, 0.0)
		return
	}
	if( progress === 0 ) {
		var posrotscaTmp= this._getRelativePosRotSca(object3d, this._emptyStep)
		var posrotsca	= new THREEx.Posrotsca(object3d)
		posrotsca.lerpVector(posrotscaTmp, posrotscaTmp, 0.0)
		return
	}

	// compute keyIdx and alpha
	var floatIdx	= progress * (this._steps.length-1)
	var keyIdx	= Math.floor(floatIdx)
	console.assert( keyIdx < this._steps.length-1 )
	var alpha	= floatIdx - keyIdx

	// set the object3d position
	var posrotsca	= new THREEx.Posrotsca(object3d)
	
	if( keyIdx === 0){
		var posrotscaSrc= this._getRelativePosRotSca(object3d, this._emptyStep)
	}else{
		var posrotscaSrc= this._getRelativePosRotSca(object3d,this._steps[keyIdx])
	}
	var posrotscaDst= this._getRelativePosRotSca(object3d,this._steps[keyIdx+1])

	posrotsca.lerpVector(posrotscaSrc, posrotscaDst, alpha)
}


//////////////////////////////////////////////////////////////////////////////////
//		Comment								//
//////////////////////////////////////////////////////////////////////////////////

THREEx.PosrotscaAnimation.prototype.toJson = function() {
	var output	= {
		stepDuration	: this.stepDuration,
		loopMode	: this.loopMode,
		steps		: [],
	}
	this._steps.forEach(function(posrotsca){
		output.steps.push(posrotsca.toJson())
	})
	return output
}
/**
 * Set steps from Json
 * @param  {THREE.Object3D} object3d - Object to transformation
 * @param  {Object} json     - json containing transformation steps
 * @return {Object}          - return posrotsca object
 */
THREEx.PosrotscaAnimation.fromJson = function(object3d, json) {
	var posrotscaAnimation	= new THREEx.PosrotscaAnimation(object3d)
	posrotscaAnimation.stepDuration	= json.stepDuration
	posrotscaAnimation.loopMode	= json.loopMode
	posrotscaAnimation.record()
	json.steps.forEach(function(jsonItem){
		var posrotsca	= THREEx.Posrotsca.fromJson(jsonItem)
		posrotscaAnimation.setStep(posrotsca)
	})
	posrotscaAnimation.stopRecording()
	return posrotscaAnimation
}

//////////////////////////////////////////////////////////////////////////////////
//		Comment								//
//////////////////////////////////////////////////////////////////////////////////

THREEx.PosrotscaAnimation.prototype.duration = function() {
	return this._steps.length * this.stepDuration
}

THREEx.PosrotscaAnimation.prototype.isRecording = function() {
	return this.mode === 'recording'
}

THREEx.PosrotscaAnimation.prototype.isPlaying = function() {
	return this.mode === 'playing'
}

THREEx.PosrotscaAnimation.prototype.isIdle = function() {
	return this.mode === 'idle'
}

//////////////////////////////////////////////////////////////////////////////////
//		Recoding							//
//////////////////////////////////////////////////////////////////////////////////

THREEx.PosrotscaAnimation.prototype.record = function() {
	console.assert( this.mode === 'idle' )
	
	this.mode	= 'recording'
	this.reset()
}
/**
 * Create relative posrotsca step
 * @param  {Object} posrotsca - posrotsca object
 */	
THREEx.PosrotscaAnimation.prototype.addRelativeStep = function(posrotsca) {
	console.assert(posrotsca instanceof THREEx.Posrotsca)
	console.assert(this.mode === 'recording')
	// keep the 1st array element as the reference for the original idle posrotsca
	if(this._steps.length>0){
		// Position relative
		posrotsca.position.x = posrotsca.position.x-this._steps[0].position.x;
		posrotsca.position.y = posrotsca.position.y-this._steps[0].position.y;
		posrotsca.position.z = posrotsca.position.z-this._steps[0].position.z;
		
		// quaternion relative
		var tempQuaternion = new THREE.Quaternion();
		tempQuaternion.copy(this._steps[0].quaternion)
		var tempQuaternion2 = new THREE.Quaternion();
		tempQuaternion2.copy(posrotsca.quaternion);
		posrotsca.quaternion = tempQuaternion.inverse().multiply(tempQuaternion2)

		//scale relative
		posrotsca.scale.x = posrotsca.scale.x/this._steps[0].scale.x;
		posrotsca.scale.y = posrotsca.scale.y/this._steps[0].scale.y;
		posrotsca.scale.z = posrotsca.scale.z/this._steps[0].scale.z;
	}

	this._steps.push(posrotsca)
};
/**
 * set object back to his orignal position
 * @param  {THREE.Object3D} object3d - Object 3d THREE.js
 */
THREEx.PosrotscaAnimation.prototype.setOriginPosition = function(object3d) {
	// set the object3d position to its origin if we have more than 1 step (1st step being its original posrotsca)
	if( this._steps.length > 1 ){

		var posrotsca	= new THREEx.Posrotsca(object3d)
		var posrotscaSrc= this._steps[this._steps.length-1]
		var posrotscaDst= this._steps[0]
		// reset pos
		posrotsca.lerpVector(posrotscaSrc, posrotscaDst, 1)
	}
};
/**
 * Set step that is already relative
 * @param  {Object} posrotsca - PosrotSca Object
 */
THREEx.PosrotscaAnimation.prototype.setStep = function(posrotsca) {
	// Rebuild the array from the Json
	console.assert(posrotsca instanceof THREEx.Posrotsca)
	console.assert(this.mode === 'recording')
	this._steps.push(posrotsca)
};
/**
 * Remove step
 * @param  {Object} posrotsca - PosrotSca Object
 */
THREEx.PosrotscaAnimation.prototype.removeStep = function(posrotsca) {
	console.assert(posrotsca instanceof THREEx.Posrotsca)
	console.assert(this.mode === 'recording')

	this._steps.splice(this._steps.indexOf(posrotsca), 1);
};

THREEx.PosrotscaAnimation.prototype.stopRecording = function() {
	console.assert(this.mode === 'recording')

	this.mode	= 'idle'
};


//////////////////////////////////////////////////////////////////////////////////
//		Playing								//
//////////////////////////////////////////////////////////////////////////////////

THREEx.PosrotscaAnimation.prototype.play = function() {
	console.assert( this.mode === 'idle' )
	console.assert( this.isPlayable() === true )
	this.mode	= 'playing'
	this.startTime	= Date.now()/1000
};

THREEx.PosrotscaAnimation.prototype.stopPlaying = function() {
	console.assert(this.mode === 'playing')
	this._object3dOriginStored = false;
	this.mode	= 'idle'
};

THREEx.PosrotscaAnimation.prototype.update = function() {
	if( this.mode !== 'playing' )	return

	// compute time since playing
	var currentTime	= Date.now()/1000
	var deltaTime	= currentTime - this.startTime

	// compute animation progress based on deltaTime
	var progress	= deltaTime / this.duration()
	if( progress > 1.0 ){
		if( this.loopMode === 'none' ){
			var progress	= 1.0
		}else if( this.loopMode === 'repeat' ){
			var progress	= progress % 1.0	
		}else if( this.loopMode === 'pingpong' ){
			// handle the loop+pingpong case
			if( Math.floor(progress) % 2 === 1 ){
				progress	= 1 - (progress % 1.0)
			}else{
				var progress	= progress % 1.0
			}
		}else	console.assert(false)
	}

	// apply animation to the object itself
	this.set(this.object3d, progress)
};