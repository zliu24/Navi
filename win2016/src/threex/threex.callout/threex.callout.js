var THREEx = THREEx || {};

/**
 * callout mesh
 *
 * @class
 * @param  {THREE.geometry} geometry - The geometry to use
 * @param  {THREE.material} material - The material to use
 */
THREEx.Callout = function(geometry, material) {
  // call the inherited constructor
  THREE.Mesh.call(this, geometry, material);

  this.text = 'Hello World';
  this.textNeedsUpdate = true;

  this.dynamicTexture = null;

  /**
   * Compute aspect based on geometry parameters
   * Keep the same aspect in dynamicTexture
   */
  this.computeDynamicTexture = function() {

    // remove all children
    this.children.slice(0).forEach(function(child){
      this.remove(child)
    }.bind(this));

    this.dynamicTexture = new THREEx.DynamicTexture(512,512);
    this.dynamicTexture.context.font = "bolder 70px Verdana";

    // FIXME: it goes beyond the callout geometry. check corners
    var planeGeometry = new THREE.PlaneGeometry(geometry.parameters.width,geometry.parameters.height);
    var planeMaterial = new THREE.MeshPhongMaterial({
      map: this.dynamicTexture.texture,
      transparent: true
    });
    var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.position.z = geometry.parameters.amount + geometry.parameters.bevelThickness + 0.1;
    this.add(planeMesh);
    this.textPlaneMesh = planeMesh;

    planeMesh.name = 'text for Callout';
    planeMesh.cannotBeEdited = true;
    planeMesh.userData.selectableUUID = this.uuid;

     // draw the text on the new dynamicTexture
    this.textNeedsUpdate = true;
    this.update();
  }.bind(this);

  this.update = function() {
    if (this.textNeedsUpdate === false) {
      return;
    }
    this.textNeedsUpdate = false;

    this.textPlaneMesh.position.z = this.geometry.parameters.amount + this.geometry.parameters.bevelThickness + 0.1;
    // clear texture
    this.dynamicTexture.clear();
    // update the text
    // TODO make this 0.15 tunable ... how ? in the threex.dynamictexture
    this.dynamicTexture.context.font = "bold " + (0.15 * this.dynamicTexture.canvas.width) + "px Arial";
    this.dynamicTexture.drawTextCooked({
      text: this.text,
      margin: 60,
      lineHeight: 20
    }, 1, 1);
  };

  this.computeDynamicTexture();
  this.update();
};


THREEx.Callout.prototype = Object.create( THREE.Mesh.prototype );

/**
 * Overwrites the default .clone() function 
 * 
 * @param  {THREEx.Callout=} object - The destination object
 * @param  {boolean=} recursive - True if recursive clone, false otherwise. Defaults to false.
 * @return {THREEx.Callout} - The just-cloned callout mesh
 */
THREEx.Callout.prototype.clone = function(object, recursive) {
  if (object === undefined) {
    object = new THREEx.Callout(this.geometry, this.material);
  }

  THREE.Mesh.prototype.copy.call(object, this, recursive);

  return object;
};
