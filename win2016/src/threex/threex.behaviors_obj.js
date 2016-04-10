var THREEx  = THREEx  || {}

/**
 * THREEx.BehaviorsObj
 * Contains the scene, camera and domElement upon which the behaviors act
 * Populated from the StudioPlayer or the i4ds library
 * This context is shared between the various BehaviorObject3d instances
 */
THREEx.BehaviorsObj = function(){
  this.scene = null;
}

/**
 * Add various listeners for user interaction
 *
 * @param {THREE.Scene} scene - the scene to init
 */
THREEx.BehaviorsObj.prototype.init = function(scene) {
  var context = this;

  this.scene = scene;

  // sanity check
  console.assert(this.scene !== null);
};

/**
 * Compile all behaviors (created via behaviors modal) into javascripts, which can then be executed via eval or anonymous functions
 */
THREEx.BehaviorsObj.prototype.compileScripts = function() {
  // for each behavior, compile into a scene.script, save: false
  var behaviors = this.scene.behaviors_obj;
  var scripts = this.clearScripts();

  var keys = [];
  var behaviors_new = {};
  for (var object_uuid in behaviors) {
    if (behaviors.hasOwnProperty(object_uuid) && behaviors[object_uuid].length > 0) {
      behaviors_new[object_uuid] = [];
      for (var i = 0; i < behaviors[object_uuid].length; i++) {
        var behavior = behaviors[object_uuid][i];
        var target_uuid = behavior.target_uuid || behavior.object_uuid;

        /**
         * Filter out behaviors whose target has been deleted
         */
        var found;
        found = false;
        this.scene.traverse(function(object3d) {
          if (object3d.uuid !== target_uuid) {
            return;
          }
          found = true;
        });
        if (found) {
          behaviors_new[object_uuid].push(behavior);
        } else {
          continue
        }

        if (!scripts[object_uuid]) { scripts[object_uuid] = []; }
        scripts[object_uuid].push(this.compileScript(behavior));
      }
    }
  }
  this.scene.behaviors_obj = behaviors_new;
  this.scene.scripts = scripts;
};

/**
 * Remove all behavior javascripts from scene.scripts, then recompile and add them back
 */
THREEx.BehaviorsObj.prototype.clearScripts = function() {
  var scripts = this.scene.scripts;

  // Strip out scripts with origin == 'behavior'
  var newScripts = {};
  for (var uuid in scripts) {
    var arr = scripts[uuid];
    if (arr.length > 0) {
      newScripts[uuid] = [];
      for (var i = 0; i < arr.length; i++) {
        var script = arr[i];
        if (script.origin != 'behavior_obj') {
          newScripts[uuid].push(script);
        }
      }
    }
  }
  this.scene.scripts = newScripts;
  return this.scene.scripts;
}

/**
 * Add various listeners for user interaction
 *
 * @param {object} behavior - the behavior object to compile
 */
 THREEx.BehaviorsObj.prototype.compileScript = function(behavior) {
  var script = {};
  script.origin = 'behavior_obj';  // mainly used so we can remove behavior scripts before 'recompiling' them

  var utils = ""

  console.log("behavior", JSON.stringify(behavior));

  var str = "";
  // Object {uuid: "8A8B6B47-958D-4982-8E7A-916323DC7CD5", object: "195A8FC9-C4E4-4796-A3D5-F3CF9F4CCEC6", behavior: "object", trigger: "touch", target: "195A8FC9-C4E4-4796-A3D5-F3CF9F4CCEC6"} index 8A8B6B47-958D-4982-8E7A-916323DC7CD5
  // Compile behavior into general script
  switch (behavior.trigger) {
    case 'touch':
      // Creates general script which waits for a 'touch' signal on behaviors. If the touched object3d is the one selected in the behavior modal as the 'object', then execute the action
      str += "var ignoreMouse = false;\n";
      str += "function mouseup(event) {\n";
      str += "  if (!ignoreMouse && daqri.util.mouseIntersects(this, event.clientX, event.clientY)) {\n";
      str += compileAction(behavior);
      str += "  };\n";
      str += "  ignoreMouse = false;\n";
      str += "};";
      str += "function touchend(event) {\n";
      str += "  if (daqri.util.mouseIntersects(this, event.changedTouches[0].clientX, event.changedTouches[0].clientY)) {\n";
      str += "    ignoreMouse = true;\n";
      str += compileAction(behavior);
      str += "  };\n";
      str += "};";
      break;
    case 'timer':
      str += "function sceneload(event) {\n";
      str += "  daqri.setInterval(function() {\n";
      str += compileAction(behavior);
      str += "  }, " + behavior.interval + ");\n";
      str += "};";
      break;
  }
  script.source = str;

  /**
   * Compiles the 'action' portion of a behavior into javascript
   */
  function compileAction(behavior) {
    var action = behavior.behavior;
    var target_uuid = behavior.target_uuid || behavior.object_uuid;

    var get_object3d = "var object3d = daqri.util.getObject3dByUUID('" + target_uuid + "');\n";

    var str = "";
    switch (action) {
      case 'showhide':
        str += get_object3d;
        str += "object3d.traverse( function ( object ) { object.visible = !object.visible; } );\n";
        break;
      case 'script':
        str += behavior.script + ";\n";
        break;
      case 'transform':
        str += get_object3d;
        str += "object3d.position.x += " + behavior.position.x + ";\n";
        str += "object3d.position.y += " + behavior.position.y + ";\n";
        str += "object3d.position.z += " + behavior.position.z + ";\n";
        // rotation unit in UI is degrees, convert to radians here
        str += "object3d.rotation.x += " + (behavior.rotation.x * Math.PI / 180) + ";\n";
        str += "object3d.rotation.y += " + (behavior.rotation.y * Math.PI / 180) + ";\n";
        str += "object3d.rotation.z += " + (behavior.rotation.z * Math.PI / 180) + ";\n";
        str += "object3d.scale.x *= " + behavior.scale.x + ";\n";
        str += "object3d.scale.y *= " + behavior.scale.y + ";\n";
        str += "object3d.scale.z *= " + behavior.scale.z + ";\n";
        break;
    }
    return str;
  }

  return script;
};