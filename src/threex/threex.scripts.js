"use strict";
var THREEx  = THREEx  || {}
// TODO Remove dependancies to the studio
/**
 * THREEx.Scripts
 * @class
 */
THREEx.Scripts = function(){
  this.scene = null;
  this.domElement = null;
  this.camera = null;
  this.prevTime = 0;
  this.daqri = {};
  this.addedContextInfo = {};
  this.timeouts = [];
  this.intervals = [];

  // Adapted from: https://github.com/mrdoob/three.js/blob/master/editor/js/libs/app.js
  this.events = {
    keydown: [],
    keyup: [],
    mousedown: [],
    mouseup: [],
    mousemove: [],
    touchstart: [],
    touchend: [],
    touchmove: [],
    update: [],
    sceneload: [],  // custom app events start here
    sceneunload: [],
    targetacquired: [],
    targetlost: []
  };

  var context = this;

  // Given array of anonymous functions (populated from scripts), execute each function, sending in the user event as a parameter
  this.dispatch = function ( array, event ) {
    for ( var i = 0, l = array.length; i < l; i ++ ) {
      array[ i ]( event );
    }
  };

  this.onDocumentKeyDown = function ( event ) {
    context.dispatch( context.events.keydown, event );
  };

  this.onDocumentKeyUp = function ( event ) {
    context.dispatch( context.events.keyup, event );
  };

  this.onDocumentMouseDown = function ( event ) {
    context.dispatch( context.events.mousedown, event );
  };

  this.onDocumentMouseUp = function ( event ) {
    context.dispatch( context.events.mouseup, event );
  };

  this.onDocumentMouseMove = function ( event ) {
    context.dispatch( context.events.mousemove, event );
  };

  this.onDocumentTouchStart = function ( event ) {
    context.dispatch( context.events.touchstart, event );
  };

  this.onDocumentTouchEnd = function ( event ) {
    context.dispatch( context.events.touchend, event );
  };

  this.onDocumentTouchMove = function ( event ) {
    context.dispatch( context.events.touchmove, event );
  };

  this.onSceneLoad = function ( event ) {
    context.dispatch( context.events.sceneload, event );
  };

  this.onSceneUnLoad = function ( event ) {
    context.dispatch( context.events.sceneunload, event );
  };

  this.onTargetAcquired = function ( event ) {
    context.dispatch( context.events.targetacquired, event );
  };

  this.onTargetLost = function ( event ) {
    context.dispatch( context.events.targetlost, event );
  };

}

THREEx.Scripts.prototype.init = function(scene, camera, domElement, overlayDomElement, signals) {
  this.scene = scene;
  this.domElement = domElement;
  this.camera = camera;
  this.overlayDomElement = overlayDomElement;
  this.signals = signals || {};
  this.timeouts = [];
  this.intervals = [];
}

/**
 * Add extra information to be passed to the script. Data can be added repeatedly. Data is
 * later merged into the script's "daqri" variable prior to showing.
 * @method addContextInfo
 * @param {string} name - dummy name
 * @param {object} data - variable or object to be passed into the script.
 */
THREEx.Scripts.prototype.addContextInfo = function(name, data) {
  this.addedContextInfo[name] = data;
};
/**
 * Remove extra information added via the addContextInfo call.
 * @method removeContextInfo
 * @param {string} name - The name of the data to remove. The data does not need to exist.
 */
THREEx.Scripts.prototype.removeContextInfo = function(name) {
  if(this.addedContextInfo.hasOwnProperty(name)) {
    delete this.addedContextInfo[name];
  }
};
/**
 * Adds an event sink. The event sink must, at minimum, have one
 * @method setEventSink
 * @param {object} eventSink - The event sink, or null/undefined to remove one.
 */
THREEx.Scripts.prototype.setEventSink = function(eventSink) {
  this.eventSink = eventSink;
};

// This must be called on each render
THREEx.Scripts.prototype.update = function() {
  var time = this.performance !== undefined && this.performance.now !== undefined ? this.performance.now() : Date.now();
  // Tell scripts an 'update' event happened
  this.dispatch( this.events.update, { time: time, delta: time - this.prevTime } );
  this.prevTime = time;
};

THREEx.Scripts.prototype.start = function() {
  this.prevTime = this.performance !== undefined && this.performance.now !== undefined ? this.performance.now() : Date.now();
  document.addEventListener( 'keydown', this.onDocumentKeyDown );
  document.addEventListener( 'keyup', this.onDocumentKeyUp );

  // Because mouse events will fire on either the GUI (#viewport-overlay) or the canvas itself (usually #viewport-container), we must add handlers to both
  this.overlayDomElement.addEventListener( 'mousedown', this.onDocumentMouseDown );
  this.overlayDomElement.addEventListener( 'mouseup', this.onDocumentMouseUp );
  this.overlayDomElement.addEventListener( 'mousemove', this.onDocumentMouseMove );
  this.overlayDomElement.addEventListener( 'touchstart', this.onDocumentTouchStart );
  this.overlayDomElement.addEventListener( 'touchend', this.onDocumentTouchEnd );
  this.overlayDomElement.addEventListener( 'touchmove', this.onDocumentTouchMove );

  this.domElement.addEventListener( 'mousedown', this.onDocumentMouseDown );
  this.domElement.addEventListener( 'mouseup', this.onDocumentMouseUp );
  this.domElement.addEventListener( 'mousemove', this.onDocumentMouseMove );
  this.domElement.addEventListener( 'touchstart', this.onDocumentTouchStart );
  this.domElement.addEventListener( 'touchend', this.onDocumentTouchEnd );
  this.domElement.addEventListener( 'touchmove', this.onDocumentTouchMove );
};

THREEx.Scripts.prototype.stop = function() {
  document.removeEventListener( 'keydown', this.onDocumentKeyDown );
  document.removeEventListener( 'keyup', this.onDocumentKeyUp );

  this.overlayDomElement.removeEventListener( 'mousedown', this.onDocumentMouseDown );
  this.overlayDomElement.removeEventListener( 'mouseup', this.onDocumentMouseUp );
  this.overlayDomElement.removeEventListener( 'mousemove', this.onDocumentMouseMove );
  this.overlayDomElement.removeEventListener( 'touchstart', this.onDocumentTouchStart );
  this.overlayDomElement.removeEventListener( 'touchend', this.onDocumentTouchEnd );
  this.overlayDomElement.removeEventListener( 'touchmove', this.onDocumentTouchMove );

  this.domElement.removeEventListener( 'mousedown', this.onDocumentMouseDown );
  this.domElement.removeEventListener( 'mouseup', this.onDocumentMouseUp );
  this.domElement.removeEventListener( 'mousemove', this.onDocumentMouseMove );
  this.domElement.removeEventListener( 'touchstart', this.onDocumentTouchStart );
  this.domElement.removeEventListener( 'touchend', this.onDocumentTouchEnd );
  this.domElement.removeEventListener( 'touchmove', this.onDocumentTouchMove );

  // Clear any timeouts or intervals the user's scripts have started
  if (this.daqri.clearAllTimeouts) {
    this.daqri.clearAllTimeouts();
  }
  if (this.daqri.clearAllIntervals) {
    this.daqri.clearAllIntervals();
  }
};

THREEx.Scripts.prototype.execute = function() {
  console.assert(this.scene !== null);
  console.assert(this.domElement !== null);
  console.assert(this.camera !== null);
  console.assert(this.overlayDomElement !== null);

  // These variables will be in scope for the this.daqri calls
  var scene = this.scene;
  var scripts = this;

  // Clear events, so if they change they are not executed more than once
  this.events = {
    keydown: [],
    keyup: [],
    mousedown: [],
    mouseup: [],
    mousemove: [],
    touchstart: [],
    touchend: [],
    touchmove: [],
    update: [],
    sceneload: [],
    sceneunload: [],
    targetacquired: [],
    targetlost: []
  };

  this.daqri = {};
  var daqri = this.daqri;

  this.daqri.setTimeout = function (fn, delay) {
    var timeout = setTimeout(fn, delay);
    scripts.timeouts.push(timeout);
    return timeout;
  };
  this.daqri.setInterval = function (fn, delay) {
    var interval = setInterval(fn, delay);
    scripts.intervals.push(interval);
    return interval;
  };
  this.daqri.clearTimeout = function(timeout) {
    var newTimeouts = [];
    for (var i = 0; i < scripts.timeouts.length; i++) {
      var to = scripts.timeouts[i];
      if (to === timeout) {
        clearTimeout(timeout);
      } else {
        newTimeouts.push(timeout);
      }
    }
    scripts.timeouts = newTimeouts;
  };
  this.daqri.clearInterval = function(interval) {
    var newIntervals = [];
    for (var i = 0; i < scripts.intervals.length; i++) {
      var inv = scripts.intervals[i];
      if (inv === interval) {
        clearInterval(inv);
      } else {
        newIntervals.push(interval);
      }
    }
    scripts.intervals = newIntervals;
  };
  this.daqri.clearAllTimeouts = function() {
    for (var i = 0; i < scripts.timeouts.length; i++) {
      var to = scripts.timeouts[i];
      clearInterval(to);
    }
    scripts.timeouts = [];
  };
  this.daqri.clearAllIntervals = function() {
    for (var i = 0; i < scripts.intervals.length; i++) {
      var inv = scripts.intervals[i];
      clearInterval(inv);
    }
    scripts.intervals = [];
  };
  this.daqri.switchTask = function(task_id) {
    if (scripts.signals && scripts.signals.switchTask) {
      if (scripts.signals.switchTask.getNumListeners() == 0) {
        console.error("Error: No bindings have been added to the 'switchTask' signal.")
      } else {
        scripts.signals.switchTask.dispatch(task_id);
      }
    } else {
      console.error("Error: 'switchTask' signal has not been instantiated")
    }
  }
  this.daqri.hover = function(x, y, callback, interval) {
    var objectsInCenter = {};
    var objectsClicked = {};
    function calcHover() {
      var intersects = daqri.util.computeIntersects(x, y);
      var found = {};
      for (var i = 0; i < intersects.length; i++) {
        var obj = intersects[i].object;
        var uuid = obj.uuid;
        found[uuid] = true;
        if (!objectsInCenter[uuid]) { objectsInCenter[uuid] = 0; }
        objectsInCenter[uuid] += 100;
        if (objectsInCenter[uuid] >= interval && !objectsClicked[uuid] && name != "Target Image Plane") {
          callback(obj);
          objectsClicked[uuid] = true;
        }
      }

      for (var key in objectsInCenter) {
        if (!found[key]) {
          delete objectsInCenter[key];
          delete objectsClicked[key];
        }
      }
    }
    daqri.setInterval(calcHover, 100);  
  }

  // 'util' functions, useful or necessary for client scripts. Has access to the same namespace the scripts do: player, scene, etc
  this.daqri.util = {
    getObjectByProperty: function ( name, value ) {
      var obj = null;
      scene.traverse(function(obj3d) {
        if ( obj3d[ name ] === value ) {
          obj = obj3d;
        }
      });
      return obj;
    },
    getObject3dByUUID: function(uuid) {
      var obj = null;
      scene.traverse(function(object) {
        if (object.uuid === uuid) {
          obj = object;
        }
      });
      return obj;
    },
    mouseIntersects: function(obj, x, y) {
      return this.computeIntersects(x, y).some(function(intersect, index, array) {
        var object3d = intersect.object;
        if (object3d.uuid == obj.uuid) {
          return true;
        } else {
          return false;
        }
      });
    },
    computeIntersects: function(x, y) {
      // Old behavior scripts depend on window.event.
      x = x || event.clientX;
      y = y || event.clientY;

      var camera = daqri.camera;
      var scene = daqri.scene;
      var domElement = daqri.domElement;

      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();

      var rect = domElement.getBoundingClientRect();
      mouse.x = (( x - rect.left)  / rect.width  * 2 -1);
      mouse.y =- (( y - rect.top )  / rect.height * 2 -1);

      var vector  = new THREE.Vector3(mouse.x, mouse.y, 1);
      vector.unproject( camera );

      raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

      return raycaster.intersectObjects( scene.children, true );
    } 
  };

  // Note: we're on threejs 67, this function is on scene by default in 70+
  var getObjectByProperty = function ( obj3d, name, value ) {
    if ( obj3d[ name ] === value ) return obj3d;
    for ( var i = 0, l = obj3d.children.length; i < l; i ++ ) {
      var child = obj3d.children[ i ];
      var object = getObjectByProperty( child, name, value );
      if ( object !== undefined ) {
        return object;
      }
    }
    return undefined;
  }

  /*
  Example script:

  scene.scripts = {
    "7879DE7E-DB96-44F2-A8A4-1B0DDC6743CD": [{
      source: "function mouseup(event) { console.log(event, this, 'util', util, 'scene', scene); if (util.mouseIntersects(player, this)) { this.visible = !this.visible; } }"
    }]
  }
  */

  this.daqri.scene = this.scene;
  this.daqri.domElement = this.domElement;
  this.daqri.camera = this.camera;
  this.daqri.overlayElement = this.overlayDomElement;
  this.daqri.signals = this.signals;

  var _this = this;
  this.daqri.dispatchEvent = function(eventName, eventData) {
    if (_this.eventSink) {
      _this.eventSink.dispatchEvent(eventName, eventData);
    }
  };
  _.extend(this.daqri, this.addedContextInfo);

  for ( var uuid in scene.scripts ) {
    var object = getObjectByProperty( scene, 'uuid', uuid, true );
    var userScripts = scene.scripts[ uuid ];

    for ( var i = 0; i < userScripts.length; i ++ ) {
      var script = userScripts[ i ];

      var functions = (
        new Function(
          'daqri, sceneload, sceneunload, targetacquired, targetlost, keydown, keyup, mousedown, mouseup, mousemove, touchstart, touchend, touchmove, update', // list of parameters available to user source. Only the 'daqri' object matters currently, but keydown/keyup/etc can be specified if default functions are necessary
          script.source + '\nreturn { sceneload: sceneload, sceneunload: sceneunload, targetacquired: targetacquired, targetlost: targetlost, keydown: keydown, keyup: keyup, mousedown: mousedown, mouseup: mouseup, mousemove: mousemove, touchstart: touchstart, touchend: touchend, touchmove: touchmove, update: update };'  // The user's scripts will define functions with the given event names (e.g. update, touchmove etc), the return value is all such functions in an 'events' hash
        ).bind( object )  // So that the object this script is bound to can reference itself with 'this'
      )( this.daqri );  // Call this function, passing in this scripts instance, 'util' and the scene. Return value is an 'events' hash

      // Iterate over the events hash, put populated events into this.events[ eventname ], e.g. this.events[ 'mouseup' ] => [ function(player, util, scene ...) { ... }]
      for ( var name in functions ) {
        if ( functions[ name ] === undefined ) continue;
        if ( this.events[ name ] === undefined ) {
          console.warn( 'APP.Player: event type not supported (', name, ')' );
          continue;
        }

        // events.keydown/keyup/etc are now arrays of functions bound to the object to which they were saved
        this.events[ name ].push( functions[ name ].bind( object ) );
      }
    }
  }
};