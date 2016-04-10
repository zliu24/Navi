var THREEx  = THREEx  || {}

/**
 * THREEx.BehaviorsGui
 * Contains the scene, camera and domElement upon which the behaviors act
 * Populated from the StudioPlayer or the i4ds library
 * This context is shared between the various BehaviorObject3d instances
 */
THREEx.BehaviorsGui = function(){
  this.scene = null;
}

/**
 * Add various listeners for user interaction
 *
 * @param {THREE.Scene} scene - the scene to init
 */
THREEx.BehaviorsGui.prototype.init = function(scene) {
  var context = this;

  this.scene = scene;

  // sanity check
  console.assert(this.scene !== null);
};

/**
 * Compile all behaviors (created via behaviors modal) into javascripts, which can then be executed via eval or anonymous functions
 */
THREEx.BehaviorsGui.prototype.compileScripts = function() {
  // for each behavior, compile into a scene.script, save: false
  var behaviors = this.scene.behaviors_gui;
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
  this.scene.behaviors_gui = behaviors_new;
  this.scene.scripts = scripts;
  //console.log("COMPILE behaviors gui", behaviors_new);
};

/**
 * Remove all behavior javascripts from scene.scripts, then recompile and add them back
 */
THREEx.BehaviorsGui.prototype.clearScripts = function() {
  var scripts = this.scene.scripts;

  // Strip out scripts with origin == 'behavior'
  var newScripts = {};
  for (var uuid in scripts) {
    var arr = scripts[uuid];
    if (arr.length > 0) {
      newScripts[uuid] = [];
      for (var i = 0; i < arr.length; i++) {
        var script = arr[i];
        if (script.origin != 'behavior_gui') {
          newScripts[uuid].push(script);
        }
      }
    }
  }
  this.scene.scripts = newScripts;
  return this.scene.scripts;
}

/**
 * Compile an individual behavior into javascript
 */
THREEx.BehaviorsGui.prototype.compileScript = function(behavior) {
  var script = {};
  script.origin = 'behavior_gui';  // mainly used so we can remove behavior scripts before 'recompiling' them

  var utils = ""

  /*
  scene.scripts = {
    "7879DE7E-DB96-44F2-A8A4-1B0DDC6743CD": [{
      source: "function mouseup(event) { console.log(event, this, 'util', util, 'scene', scene); if (util.mouseIntersects(player, this)) { this.visible = !this.visible; } }"
    }]
  }
  */

  var str = "";
  // Object {uuid: "8A8B6B47-958D-4982-8E7A-916323DC7CD5", object: "195A8FC9-C4E4-4796-A3D5-F3CF9F4CCEC6", behavior: "object", trigger: "touch", target: "195A8FC9-C4E4-4796-A3D5-F3CF9F4CCEC6"} index 8A8B6B47-958D-4982-8E7A-916323DC7CD5
  // Compile behavior into general script
  switch (behavior.trigger) {
    case 'touch':
      // Creates general script which waits for a 'touch' signal on behaviors. If the touched object3d is the one selected in the behavior modal as the 'object', then execute the action
      str += "function mouseup(event) {\n";
      str += "  if (daqri.util.mouseIntersects(this)) {\n";
      str +=   compileAction(behavior);
      str += "  };\n";
      str += "};";
      script.source = str;
      break;
  }

  /**
   * Compiles the 'action' portion of a behavior into javascript
   */
  function compileAction(behavior) {
    var action = behavior.behavior;
    var target_uuid = behavior.target_uuid || behavior.object_uuid;

    var str = "";
    switch (action) {
      case 'showhide':
        str += "var object3d = daqri.util.getObject3dByUUID('" + target_uuid + "');\n"
        str += "object3d.visible = !object3d.visible;\n";
        break;
      case 'script':
        str += behavior.script;
        break;
    }
    return str;
  }

  return script;
};
