/***
 * Copyright (C) 2016 DAQRI, LLC. - All Rights Reserved.
 *
 * NOTICE:  This is not open source code. All source code and other information contained herein is, and remains the property of DAQRI LLC and/or its suppliers, partners, or
 * affiliates, if any (“DAQRI”) to the greatest extent possible.  The intellectual property, technical concepts, and creative expression contained herein (“code”) are proprietary to
 * DAQRI and may be covered by U.S. and Foreign Patents, patents in process, trade secret, or copyright law. Dissemination, alteration, reproduction, display, and performance
 * of this code is strictly forbidden unless prior written permission is obtained from DAQRI. Any access that DAQRI may grant you to this code is expressly conditioned on your
 * agreement to these terms, and to any other terms that DAQRI may request of you. Do not access this code if you do not agree to these terms.
 *
*/


'use strict';

var FourJS = FourJS || {};

FourJS.SceneViewer = function() {

  var currentChapterIndex = 0;
  var chapters = [];
  var renderer;
  var config = {};
  var loadConfig = {};
  var callback= "javascriptFourJSCallback";
  var targetIsFound = false;
  var sceneIsLoaded = false;
  var neverHideScene = false; // for debugging purposes
  var cancelAnimation = false; // used for renderer loop situations (i.e. desktop)
  var animationFrameId = 0;
  var socketClient;
  var scanningIndicator;
  var loadingIndicator;

  var onLoadProjectionAndViewport;
  var debugLevel = 1; // show errors, major information

  // The signals/SIGNALS hack that we need to deal with.
  if( window.SIGNALS === undefined ){
    window.SIGNALS  = window.signals;
    delete window.signals;
  }

  var sceneSignals = FourJS.sceneSignals = {
    "sceneLoad": new SIGNALS.Signal(),
    "sceneUnload": new SIGNALS.Signal(),
    "targetFound": new SIGNALS.Signal(),
    "targetLost": new SIGNALS.Signal(),
    "loadStatus": new SIGNALS.Signal(),
    "switchTask": new SIGNALS.Signal(),

    "overlayMousedown": new SIGNALS.Signal(),
    "overlayMouseup": new SIGNALS.Signal(),
    "overlayMousemove": new SIGNALS.Signal(),
    "overlayTouchstart": new SIGNALS.Signal(),
    "overlayTouchend": new SIGNALS.Signal(),
    "overlayTouchmove": new SIGNALS.Signal(),

    "canvasMousedown": new SIGNALS.Signal(),
    "canvasMouseup": new SIGNALS.Signal(),
    "canvasMousemove": new SIGNALS.Signal(),
    "canvasTouchstart": new SIGNALS.Signal(),
    "canvasTouchend": new SIGNALS.Signal(),
    "canvasTouchmove": new SIGNALS.Signal()
  };

  /***
  * Initialize the FourJS scene viewer.
  * @method initialize
  * @param {Object} configuration - A JSON object with the items below.
  * @param {Element} configuration.domElement - An empty DOM element, jQuery object, or selector string that will host the canvas. If not provided then the selector ".fourjs-container" will be used.
  * @param {string} configuration.htmlDomElement - An empty DOM element, jQuery object, or selector string that will host the scene HTML. If not provided then the selector ".fourjs-html" will be used.
  * @param {string} configuration.platform - The platform, 'browser', 'android', or 'ios'. Default is 'browser'.
  * @param {string} configuration.callback - Sets the callback string. The default is 'javascriptFourJSCallback'.
  * @param {string} configuration.socketUrl - The socket for
  * @param {boolean} configuration.showTarget - Show the target if one exists. Default false.
  * @param {number}  configuration.loadDelay - The delay for loading. Very useful while debugging in mobile using desktop browser debugger. Default is undefined, so immediate load.
  * @param {number} configuration.debugLevel - Level 0: nothing, level 1: errors, level 2: trace/verbose. Default 1.
  */
  var initialize = function(configuration) {
    try {
      if(configuration.hasOwnProperty("debugLevel")) {
        debugLevel = configuration.debugLevel;
        FourJS.Utils.logLevel = debugLevel;
      }

      trace("FourJS.SceneViewer.initialize enter");

      $.extend(config, configuration);
      FourJS.Utils.platform = config.platform || FourJS.Utils.platform;

      // Get the DOM container element. If it does not exist then use the default selector name.
      if (!config.hasOwnProperty("domElement")) {
        config.domElement = $(".fourjs-container");
      } else {
        config.domElement = $(config.domElement);
      }

      if (!config.hasOwnProperty("htmlDomElement")) {
        config.htmlDomElement = $(".fourjs-html");
      } else {
        config.htmlDomElement = $(config.htmlDomElement);
      }

      if (!config.hasOwnProperty("htmlDomElementRight")) {
        config.htmlDomElementRight = $(".fourjs-html-right");
      } else {
        config.htmlDomElementRight = $(config.htmlDomElementRight);
      }

      if(configuration.callback) {
        callback = configuration.callback;
      }

      if(config.platform === 'desktop') {
        targetIsFound = true;
      }

      if(!loadingIndicator) {
        loadingIndicator = FourJS.LoadingIndicator(this, config);
      }

      var overlay = config.htmlDomElement.get(0);
      overlay.addEventListener( 'mousedown', function(ev) { sceneSignals["overlayMousedown"].dispatch(ev); });
      overlay.addEventListener( 'mouseup', function(ev) { sceneSignals["overlayMouseup"].dispatch(ev); });
      overlay.addEventListener( 'mousemove', function(ev) { sceneSignals["overlayMousemove"].dispatch(ev); });
      overlay.addEventListener( 'touchstart', function(ev) { sceneSignals["overlayTouchstart"].dispatch(ev); });
      overlay.addEventListener( 'touchend', function(ev) { sceneSignals["overlayTouchend"].dispatch(ev); });
      overlay.addEventListener( 'touchmove', function(ev) { sceneSignals["overlayTouchmove"].dispatch(ev); });

      var canvas = config.domElement.get(0);
      canvas.addEventListener( 'mousedown', function(ev) { sceneSignals["canvasMousedown"].dispatch(ev); });
      canvas.addEventListener( 'mouseup', function(ev) { sceneSignals["canvasMouseup"].dispatch(ev); });
      canvas.addEventListener( 'mousemove', function(ev) { sceneSignals["canvasMousemove"].dispatch(ev); });
      canvas.addEventListener( 'touchstart', function(ev) { sceneSignals["canvasTouchstart"].dispatch(ev); });
      canvas.addEventListener( 'touchend', function(ev) { sceneSignals["canvasTouchend"].dispatch(ev); });
      canvas.addEventListener( 'touchmove', function(ev) { sceneSignals["canvasTouchmove"].dispatch(ev); });

      // TODO: Add MutationObserver to view canvas size changes
      //var updateViewport = function () {
      //  $('canvas').width(window.innerWidth).height(window.innerHeight);
      //  window.scope4D.vision4D.updateViewport(0.001, 1000, 75.0);
      //};
      //
      //window.addEventListener('resize', function () {
      //  log("Window resize happened: " + window.innerWidth + "," + window.innerHeight);
      //  updateViewport();
      //}, false);
      trace("FourJS.SceneViewer.initialize exit");
    } catch(err) {
      FourJS.Utils.log("ERROR: FourJS.SceneViewer.initialize: "+err.stack);
    }
  };

  /***
  * Load the 4D scene.
  * @method load
  * @param {Object} loadConfig
  * @param {string | Object} loadConfig.task - The task to be displayed.
  * @param {string | Object} loadConfig.scene - A ThreeJS OBJ JSON scene to be displayed.
  * @param {string} loadConfig.targetImage - The JSON for the target taken from the parent step.
  * @param {boolean} loadConfig.showScanningIndicator - If true UI to indicate that scanning is happening is displayed.
  * @param {string} loadConfig.trackerType - The type of tracker. Can be 'none', 'vurforia', or 'instant-on'. Default is 'none'.
  * @param {object} loadConfig.eventSink - This is an optional event sink for use with the scene.
  * @param {object} loadConfig.contextInfo - This is optional context information for the scene's scripts.
  * @param {number} loadConfig.startChapter - Chapter to load. Default is 0, the first chapter index.
  * @param {boolean} loadConfig.orbitControls - Allow scene orientation to be controlled by mouse/touch. Default is false.
  * @param {boolean} loadConfig.showGrid - Show the background grid. Default false.
  * @param {boolean} loadConfig.debugCloud - Show a lot of randomly distributed objects that are always visible. Wonderful for debugging that case where you just can't see anything.
  * @param {boolean} loadConfig.initiallyHideScene - Mostly for debugging purposes, initially hides the content. Default false.
  * @param {boolean} loadConfig.neverHideScene - Mostly for debugging purposes, always show the content, even if off target. Default false.
  */
  var load = function(loadConfig) {
    var _this = this;
    sceneIsLoaded = false;

    // For debugging, delay the load. If the config does not have a 'loadDelay' then run immediately
    if(config.hasOwnProperty("loadDelay") && _.isNumber(config.loadDelay)) {
      setTimeout(loadFunc, parseInt(config.loadDelay));
    } else {
      loadFunc();
    }

    function loadFunc() {
      try {
        trace("FourJS.SceneViewer.load enter");

        cancelAnimation = false;
        currentChapterIndex = loadConfig.startChapter || 0;
        if(config.platform === 'desktop') {
          targetIsFound = true;
          sceneSignals['targetFound'].dispatch();
        }

        if (!renderer) {
          trace("FourJS.SceneViewer: Creating new renderer");
          renderer = FourJS.Renderer();
          renderer.initialize({
            domElement: config.domElement,
            htmlDomElement: config.htmlDomElement,
            trackerType: loadConfig.trackerType,
            initiallyHideScene: loadConfig.initiallyHideScene,
            log: log,
            stereoEnabled: config.stereoEnabled,
            htmlDomElementRight: config.htmlDomElementRight,
          });
          renderer.updateViewport(0.001, 1000, 75.0);

          if (onLoadProjectionAndViewport) {
            updateProjectionAndViewport(onLoadProjectionAndViewport.projectionMatrix, onLoadProjectionAndViewport.viewport);
          }
          renderer.enablePanAndRotate(loadConfig.orbitControls);
          renderer.showGrid(loadConfig.showGrid);
          if (config.debugCloud) {
            renderer.createObjectCloud();
          }
        }

        var task = loadConfig.task;
        if (typeof task === "string") {
          task = JSON.parse(task);
        }

        trace("Task: " + JSON.stringify(task, function (k, v) {
          if (_.isArray(v) && k === 'matrix') {
            return '[' + v.join(', ') + ']';
          } else {
            return v;
          }
        }, 2));

        socketClient = new FourJS.Sockets();
        socketClient.connect(config.socketUrl);

        // Initialize the scanning indicator.
        if (!scanningIndicator) {
          scanningIndicator = FourJS.ScanningIndicator();
        }
        scanningIndicator.onLoad(_this, config, loadConfig);

        var postAssetLoad = function (scene) {
          try {
            sceneIsLoaded = true;

            if (config.callback) {
              renderer.setEventSink(function (method, data) {
                config.callback(method, data);
              });
            }

            if(config.onLoad){
                    config.onLoad();
            }



            renderer.setContextInfo(loadConfig.contextInfo);

            // Pass the scene from the object loader and from the original unloaded threejsScene - needed for gui.
            if (task.chapters) {
              renderer.addScene(scene, task.chapters[currentChapterIndex].threejsScene);
            } else {
              renderer.addScene(scene, task.threejsScene);
            }

            neverHideScene = !!config.neverHideScene;
            if (neverHideScene) {
              targetFound();
            } else {
              if (config.platform !== 'desktop' || loadConfig.initiallyHideScene) {
                renderer.hideScene();
                renderer.render();
                targetIsFound = false;
              }
              else if (config.trackerType === 'instant-on') {
                if (targetIsFound) {
                  targetFound();
                } else {
                  targetLost();
                }
              }
            }

            if (FourJS.Utils.platform === 'desktop' || config.renderContinuously) {
              if (!loadConfig.initiallyHideScene) {
                targetFound();
              }
              renderContinuously();
            } else {
              // The camera poses update the scene sufficiently often to act as the
              // render loop. No need to request animation frames.
              //renderContinuously();
              renderer.render();
            }

            // Set the target trigger.
            if (window[callback] && task && task.target) {
              window[callback]("addTrackableId", {
                "trackableId": task.target.vws_target_id,
                "userData": "main-task-trigger"
              });
            }

          } catch (err) {
            log("ERROR: FourJS.SceneViewer.load: Loading assets failed: " + err + "\nStack trace:\n" + err.stack);
            if (callback) {
              callback({eventType: "error", description: err.description});
            }
          }
        };

        if (task) {
          trace('TRACE: Loading task');
          var loader = new FourJS.Loader(_this);
          var taskScene = task.chapters ? task.chapters[currentChapterIndex] : task;
          loader.loadSceneAssets(taskScene).then(postAssetLoad, function (err) {
            if (config.callback) {
              log("ERROR: FourJS.SceneViewer.load: Loading assets failed: " + err + "\nStack trace:\n" + err.stack);
              if (callback) {
                callback({eventType: "error", description: err.description});
              }
            }
          });
        } else {

          // Deal with case of a threejs scene but not in the form of a task (chapters, etc).
          var scene = loadConfig.scene || {children: []};
          if (loadConfig.scene) {
            if (typeof loadConfig.scene === "string") {
              scene = JSON.parse(loadConfig.scene);
            }
          }
          postAssetLoad(scene);
        }

        trace("FourJS.SceneViewer.load exit");

      } catch (err) {
        FourJS.Utils.log("ERROR: FourJS.SceneViewer.load: " + err.stack);
      }
    }
  };

  var renderContinuously = function() {
    cancelAnimation = false;

    var update = function() {
      if(!cancelAnimation) {
        renderer.render();
        animationFrameId = requestAnimationFrame(update);
      }
    };
    animationFrameId = requestAnimationFrame(update);
  };

  var targetFound = function() {
    if(!neverHideScene) {
      if (!targetIsFound) {
        if(renderer) {
          renderer.showScene();
          renderer.render();
        }
      }
      targetIsFound = true;
    }
    sceneSignals['targetFound'].dispatch();
  };

  var targetLost = function() {
    if(!neverHideScene) {
      if (targetIsFound) {
        if(renderer) {
          renderer.hideScene();
          renderer.render();
        }
      }
      targetIsFound = false;
    }
    sceneSignals['targetLost'].dispatch();
  };

  var showScene = function() {
    trace("FourJS.showScene");
    targetFound();
  };

  var hideScene = function() {
    trace("FourJS.hideScene");
    targetLost();
  };

  var clearScene = function() {
    sceneIsLoaded = false;
    if(renderer) {
      renderer.clearScene();
    }
  };


  var destroyScene = function() {
    sceneIsLoaded = false;
    if(renderer) {
      renderer.clearScene();
      renderer.shutdown();
      renderer = undefined;
      cancelAnimation = true;
    }
    config.domElement.empty();
  };

  /***
  * Subscribe to a named signal.
  * @param signalName - The name of the signal to be subscribed to.
  * @param signalCallback - A function that is called when the signal is triggered.
  */
  var subscribe = function(signalName, signalCallback) {
    var signal = sceneSignals[signalName];
    if(signal) {
      signal.add(signalCallback);
    } else {
      log("ERROR: FourJS.SceneViewer.subscribe: No signal channel named "+signalName);
    }
  };

  /***
  * Unsubscribe to a named signal.
  * @param signalName - The name of the signal.
  * @param signalCallback - A same function passed to the subscribe() function.
  */
  var unsubscribe = function(signalName, signalCallback) {
    var signal = sceneSignals[signalName];
    if(signal) {
      signal.remove(signalCallback);
    } else {
      log("ERROR: FourJS.SceneViewer.unsubscribe: No signal channel named "+signalName);
    }
  };

  /***
  * Trigger the sending of the data for the named signal.
  * @param signalName - The name of the signal.
  * @param data - Arbitrary data to be sent as part of the signal.
  */
  var dispatch = function(signalName, data) {
    var signal = sceneSignals[signalName];
    if(signal) {
      signal.dispatch(data);
    } else {
      log("ERROR: FourJS.SceneViewer.dispatch: No signal channel named "+signalName);
    }
  };

  /***
  * Return the platform name.
  * @returns {*|FourJS.Utils.platform}
  */
  var getPlatform = function() {
    return FourJS.Utils.platform;
  };

  var updateProjectionAndViewport = function (projectionMatrix, viewport) {
    try {
      trace("updateProjectionAndViewport:" + JSON.stringify(projectionMatrix));
      trace("         viewport:" + JSON.stringify(viewport));

      // If the projection and viewport are set prior to the renderer being created, or
      // if the renderer is recreated, use these values.
      if(!renderer) {
        onLoadProjectionAndViewport = {
          projectionMatrix: projectionMatrix,
          viewport: viewport
        };
      } else {

        if (viewport) {
          trace("Setting viewport { x:" + viewport.x + ", y:" + viewport.y + ", width:" + viewport.width + ", height:" + viewport.height + "}");
          renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
        }

        if (projectionMatrix) {
          var p = projectionMatrix;
          var mat = new THREE.Matrix4();
          mat.set(
            p[0], p[1], p[2], p[3],
            p[4], p[5], p[6], p[7],
            p[8], p[9], p[10], p[11],
            p[12], p[13], p[14], p[15]
          );
          renderer.updateProjection(mat);
        }

        //renderer.render();
      }
    } catch(err) {
      FourJS.Utils.log("ERROR: FourJS.SceneViewer.updateProjectionAndViewport: "+err.description+" : "+err.stack);
    }
  };

  var onCameraPose = function (modelviewMatrix) {
    try {
      // trace("onCameraPose:"+JSON.stringify(modelviewMatrix));
      if(renderer) {
        var p = modelviewMatrix;
        var mat = new THREE.Matrix4();
        mat.set(
          p[0], p[1], p[2], p[3],
          p[4], p[5], p[6], p[7],
          p[8], p[9], p[10], p[11],
          p[12], p[13], p[14], p[15]
        );
        renderer.applyPoseToObject3d(mat, "pose-pivot");
        if (!targetIsFound) {
          targetFound();
        }
        renderer.render();

        if(socketClient) {
          socketClient.send("renderComplete");
        }
      }
      else {
        trace("ERROR: No renderer");
      }
    } catch(err) {
      FourJS.Utils.log("ERROR: FourJS.SceneViewer.onCameraPose: "+err.description+" : "+err.stack);
    }
  };

  /***
  * Log a message to either the system console or, if a real app, to the system log.
  * @method log
  * @param msg
  */
  var log = function(msg) {
    FourJS.Utils.log(msg);
  };

  var trace = function(msg) {
    if(debugLevel > 1) {
      log("TRACE: " + msg);
    }
  };

  //// Guard against this done twice.
  //// TODO: find way around having to do this.
  if(!window.SIGNALS) {
    window.SIGNALS = window.signals;
  }

  log("Loading DAQRI SceneViewer");

  return {
    initialize: initialize,
    load: load,
    updateProjectionAndViewport: updateProjectionAndViewport,
    onCameraPose: onCameraPose,
    showScene: showScene,
    hideScene: hideScene,
    clearScene: clearScene,
    destroyScene: destroyScene,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    dispatch: dispatch,
    getTargetIsFound: function() { return targetIsFound; },
    getSceneIsLoaded: function() { return sceneIsLoaded; },
    getRenderer: function() { return renderer; },
    log: log,
    trace: trace
  };

};

FourJS.Utils = FourJS.Utils || {};

FourJS.Utils.platformFromUserAgent = function() {
  var agent = navigator.userAgent;
  if(agent.search("AppleWebKit") !== -1 && agent.search("Mobile")) {
    return "ios";
  }
  return "desktop";
};

FourJS.Utils.platform = FourJS.Utils.platformFromUserAgent();
FourJS.Utils.logLevel = 1;

FourJS.Utils.trace = function(msg) {
  //  if(FourJS.Utils.logLevel > 1) {
  FourJS.Utils.log("TRACE: "+msg);
  //  }
};

FourJS.Utils.log = function(msg) {
  switch(FourJS.Utils.platform) {
    case 'ios':
    if(window.hasOwnProperty('angular')) {
      console.log("FourJS: " + msg);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', "http://debugger/" + encodeURIComponent("**** FourJS: " + msg));
      xhr.send(null);
    }
    break;
    case "desktop":
    case "android":
    console.log("FourJS: " + msg);
  }
};


FourJS.Utils.isDesktop = function () {
  var getUrlParameter = function(param) {
    var pageUrl = window.location.search.substring(1);
    var urlVariables = pageUrl.split('&');
    for (var i = 0; i < urlVariables.length; i++) {
      var parameterName = urlVariables[i].split('=');
      if (parameterName[0] === param) {
        return parameterName[1];
      }
    }
  };

  if ((FourJS.SceneViewer.getUrlParameter('desktop') === 'true') || !(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))) {
    return true;
  }
  return false;
};
