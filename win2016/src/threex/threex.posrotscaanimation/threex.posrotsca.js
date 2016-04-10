var THREEx	= THREEx	|| {}

/**
 * Holds position/rotation/scale data. Used by THREEx.PosrotscaAnimation
 * @class
 * @param {object=} parameters - { position: THREE.Vector3, scale: THREE.Vector3, quaternion: THREE.Quaternion }
 */
THREEx.Posrotsca	= function(parameters){
	parameters	= parameters	|| {}
	this.position	= parameters.position !== undefined ? parameters.position : new THREE.Vector3(0,0,0)
	this.scale	= parameters.scale !== undefined ? parameters.scale : new THREE.Vector3(1,1,1)
	this.quaternion	= parameters.quaternion !== undefined ? parameters.quaternion : new THREE.Quaternion()
}

/**
 * Create new THREEx.Posrotsca with pos/rot/sca information from given mesh
 * @static
 * @param {THREE.Object3D} object3d - Threejs mesh to copy pos/rot/sca information from
 * @return {THREEx.Posrotsca} - A new Posrotsca object
 */
THREEx.Posrotsca.fromObject3d	= function(object3d){
	var parameters	= {
		position	: object3d.position.clone(),	
		quaternion	: object3d.quaternion.clone(),
		scale		: object3d.scale.clone(),
	}
	return new THREEx.Posrotsca(parameters)
}

/**
 * Returns an object containing posrotsca data: { position: [ int, int, int ], quaternion: [ int, int, int ], scale: [ int, int, int ] }
 */
THREEx.Posrotsca.prototype.toJson	= function(){
	var output	= {
		position	: this.position.toArray(),	
		quaternion	: this.quaternion.toArray(),
		scale		: this.scale.toArray(),
	}
	return output
}

/**
 * Create new THREEx.Posrotsca with pos/rot/sca information from json
 * @static
 * @param {object} json - Object containing pos/rot/sca array data, example: { position: [ int, int, int ], quaternion: [ int, int, int ], scale: [ int, int, int ] }
 * @return {THREEx.Posrotsca} - A new Posrotsca object
 */
 THREEx.Posrotsca.fromJson	= function( json ){
	var parameters	= {
		position	: new THREE.Vector3().fromArray(json.position),	
		quaternion	: new THREE.Quaternion().fromArray(json.quaternion),
		scale		: new THREE.Vector3().fromArray(json.scale),
	}
	return new THREEx.Posrotsca(parameters)
}

/**
 * Modify current pos/rot/sca vectors by interpolating with given vector
 *
 * @param {THREEx.Posrotsca} a - other to copy
 * @param {THREEx.Posrotsca} b - other to copy
 * @param {number} alpha - progress
 * 
 */
THREEx.Posrotsca.prototype.lerpVector	= function(a, b, alpha){
	this.position.copy(a.position).lerp(b.position, alpha)
	this.quaternion.copy(a.quaternion).slerp(b.quaternion, alpha)
	this.scale.copy(a.scale).lerp(b.scale, alpha)
}

/**
 * Copy pos/rot/sca from given mesh
 *
 * @param {THREEx.Posrotsca} other - other to copy
 */
THREEx.Posrotsca.prototype.copy	= function(other){
	this.position.copy(other.position)
	this.quaternion.copy(other.quaternion)
	this.scale.copy(other.scale)
}

/**
 * Create clone of this Posrotsca object
 * @return {THREEx.Posrotsca} - Newly cloned Posrotsca
 */
THREEx.Posrotsca.prototype.clone	= function(){
	return new THREEx.Posrotsca({
		position	: this.position.clone(),
		quaternion	: this.quaternion.clone(),
		scale		: this.scale.clone(),
	})
}


