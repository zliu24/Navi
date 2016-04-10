var THREEx	= THREEx	|| {}

/**
 * Geometry object for the Callout mesh
 *
 * @class
 * @param {Object=} parameters - Callout geometry parameters: { width: int, height: int, radius: float, arrowHeight: float, arrowXRight: float, arrowXCenter: float, arrowXLeft: float, amount: float, bevelThickness: float, bevelSize: float }
 */
THREEx.CalloutGeometry	= function(parameters){
	// get the parameters
	parameters	= parameters	|| {}
	this.parameters = {
		// main shape parameters
		width		: parameters.width !== undefined ? parameters.width : 19,
		height		: parameters.height !== undefined ? parameters.height : 19,
		radius		: parameters.radius !== undefined ? parameters.radius : 0.2,

		// arrow parameters
		arrowHeight	: parameters.arrowHeight !== undefined ? parameters.arrowHeight : 0.2,
		arrowXRight	: parameters.arrowXRight !== undefined ? parameters.arrowXRight : 0.3,
		arrowXCenter	: parameters.arrowXCenter !== undefined ? parameters.arrowXCenter : 0.2,
		arrowXLeft	: parameters.arrowXLeft !== undefined ? parameters.arrowXLeft : 0.1,

		// extrude parameters
		amount		: parameters.amount !== undefined ? parameters.amount : 0.1,
		bevelThickness	: parameters.bevelThickness !== undefined ? parameters.bevelThickness : 0.05,
		bevelSize	: parameters.bevelSize !== undefined ? parameters.bevelSize : 0.04,
	};
	parameters	= this.parameters

	// build the shape
	var shape = new THREE.Shape();
	(function roundedRect( x, y, width, height, radius ){
		shape.moveTo( x, y + radius );
		shape.lineTo( x, y + height - radius );
		shape.quadraticCurveTo( x, y + height, x + radius, y + height );
		shape.lineTo( x + width - radius, y + height) ;
		shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
		shape.lineTo( x + width, y + radius );
		shape.quadraticCurveTo( x + width, y, x + width - radius, y );

		shape.lineTo( x + radius + parameters.arrowXRight, y );
		shape.lineTo( x + radius + parameters.arrowXCenter, y - parameters.arrowHeight );
		shape.lineTo( x + radius + parameters.arrowXLeft, y );
		shape.lineTo( x + radius, y );
		shape.quadraticCurveTo( x, y, x, y + radius );
	})(-parameters.width/2, -parameters.height/2, parameters.width, parameters.height, parameters.radius );

	// extrude the geometry
	THREE.ExtrudeGeometry.call( this, shape, parameters );
}


THREEx.CalloutGeometry.prototype = Object.create( THREE.ExtrudeGeometry.prototype );
