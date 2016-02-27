var THREEx	= THREEx || {}

/**
 * Build a text geometry
 *
 * @class
 * @param {String} text       - the text to write
 * @param {Object} parameters - parameters for THREE.FontUtils.generateShapes
 */
THREEx.TextGeometry	= function ( text, parameters ) {

	parameters = parameters || {};

	this.parameters	= {};
	this.parameters	= parameters;
	this.parameters.text	= text

	var textShapes = THREE.FontUtils.generateShapes( text, parameters );

	// translate parameters to ExtrudeGeometry API
	parameters.amount = parameters.height !== undefined ? parseFloat(parameters.height) : 50;

	// defaults

	if ( parameters.bevelThickness === undefined ) parameters.bevelThickness = 10;
	if ( parameters.bevelSize === undefined ) parameters.bevelSize = 8;
	if ( parameters.bevelEnabled === undefined ) parameters.bevelEnabled = false;

	THREE.ExtrudeGeometry.call( this, textShapes, parameters );


	// center the geometry
	// - THREE.TextGeometry isnt centered for unknown reasons. all other geometries are centered
	this.computeBoundingBox();
	var center	= new THREE.Vector3();
	center.x	= (this.boundingBox.max.x - this.boundingBox.min.x) / 2
	// center.y	= (this.boundingBox.max.y - this.boundingBox.min.y) / 2
	center.z	= (this.boundingBox.max.z - this.boundingBox.min.z) / 2
	this.vertices.forEach(function(vertex){
		vertex.sub(center)
	})
	// recompute the this
	this.computeBoundingBox();
}

THREEx.TextGeometry.prototype = Object.create( THREE.ExtrudeGeometry.prototype );