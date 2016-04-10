var THREEx  = THREEx  || {}

/**
 * THREEx.Gui
 */
THREEx.Gui = function(){
  this.scene = null;
  this.style = null;
  this.html = null;
}

/**
 * Add various listeners for user interaction
 *
 * @param {THREE.Scene} scene - the scene to init
 * @param {String} hostElement - css selector for a dom element
 */
THREEx.Gui.prototype.init = function(scene, hostElement) {
  this.scene = scene;

  this.html = $(hostElement || '#viewport-overlay');

  // sanity check
  console.assert(this.scene !== null);
};

THREEx.Gui.prototype.start = function() {
  var gui = this.scene.gui;

  // Populate html
  this.html.show();
  this.html.html(gui.html);

  // Create and populate style sheet
  this.style = $("<style type='text/css'>" + (gui.css ? gui.css : "") + '</style>')
  this.style.appendTo(this.html);
}

THREEx.Gui.prototype.stop = function() {
  // Remove custom created <style> from the dom
  if (this.style) {
    this.style.prop('disabled', true);
    this.style.remove();
  }

  if (this.html) {
    this.html.html("");
    this.html.hide();
  }
}

/**
 * Compile all behaviors (created via behaviors modal) into javascripts, which can then be executed via eval or anonymous functions
 */
THREEx.Gui.prototype.compileScripts = function() {
  // for each behavior, compile into a scene.script, save: false
  var gui = this.scene.gui;
  if (!gui) { return; }
  var scripts = this.clearScripts();

  var scene_uuid = this.scene.uuid;
  if (gui.js && gui.js != '') {
    if (!scripts[scene_uuid]) { scripts[scene_uuid] = [] }
    scripts[scene_uuid].push({
      origin: "gui",
      source: gui.js
    });
  }

  this.scene.scripts = scripts;
}

/**
 * Remove all behavior javascripts from scene.scripts, then recompile and add them back
 */
THREEx.Gui.prototype.clearScripts = function() {
  var scripts = this.scene.scripts;
  // Strip out scripts with origin == 'behavior'
  var new_scripts = {};
  for (var uuid in scripts) {
    var arr_scripts = scripts[uuid];
    if (arr_scripts.length > 0) {
      new_scripts[uuid] = [];
    } else {
      continue
    }
    for (var i = 0; i < arr_scripts.length; i++) {
      var script = arr_scripts[i];
      if (script.origin != 'gui') {
        new_scripts[uuid].push(script);
      }
    }
  }
  this.scene.scripts = new_scripts;
  return this.scene.scripts;
}
