var THREEx	= THREEx	|| {}


/**
 * create a 3d text object
 *
 * @param  {String} text    - the text to write
 * @param  {object=} options - the options to setup the text
 * @return {THREE.Mesh} - the newly built mesh
 */
THREEx.Text	= function(text, options){
	options	= options || {
		font		: "droid serif",
		weight		: "bold",
		size		: 1,
		height		: 0.4,
	}

	// create the tGeometry
	var geometry	= new THREE.TextGeometry(text, options)

	// center the geometry
	// - THREE.TextGeometry isnt centered for unknown reasons. all other geometries are centered
	geometry.computeBoundingBox();
	var center	= new THREE.Vector3();
	center.x	= (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2
	// center.y	= (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2
	center.z	= (geometry.boundingBox.max.z - geometry.boundingBox.min.z) / 2
	geometry.vertices.forEach(function(vertex){
		vertex.sub(center)
	})
	// recompute the geometry
	geometry.computeBoundingBox();
	
	// create a mesh with it
	var material	= new THREE.MeshPhongMaterial()
	var mesh	= new THREE.Mesh(geometry, material)
	// return mesh
	return mesh
}
