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

FourJS.Renderer = function() {

  var self = {};
  var updateCallbacks = [];
  var debugCount = 0;
  var wglCamera, isDesktop, isInstantOn, containerElement;
  var wglRenderer, wglScene, wglPosePivot, wglScenePivot;
  var htmlMixerContext;
  var wglProjector;
  var wglChapterScene;
  var panAndRotateControl;
  var gridHelper;
  var scripts;
  var sceneGui;
  var config = {
    stereoEnabled   : false
  }
  var eventSink;
  var contextInfo;
  var log, trace;
  var viewPortSize;
  var trackerScale = 1.0;
  var trackerSpriteRotation = 0.0;
  var sceneShowing = false;
  var stereoEffect;

  /***
  *
  * @method initialize
  * @param {Object} configuration - Configuration object with the following
  * @param {Object} configuration.domElement - The container div for holding the canvas.
  * @param {Object} configuration.htmlDomElement - The container div for holding the html UI associated with a scene.
  * @param {Object} configuration.htmlDomElementRight - The container div for holding the html UI mirrored on the right when .stereoEnabled == true.
  * @param {boolean} configuration.initiallyHideScene - Mostly for debugging purposes, initially hides the content. Default false.
  * @param {string} configuration.trackerType - The tracker type, 'vuforia', 'instant-on'...
  * @param {boolean} configuration.stereoEnabled - true if the scene should be renderer in stereo, false otherwise. default to false
  */
  var initialize = function (configuration) {
    log = FourJS.Utils.log;
    trace = FourJS.Utils.trace;
    $.extend(config, configuration);

    if(config.trackerType === "arttracker") {
      trackerScale = 0.0133;
    }
    isDesktop = FourJS.Utils.platform === 'desktop' ? true : false;
    isInstantOn = config.trackerType ? config.trackerType === 'instant-on' : false;
    config.domElement = $(config.domElement);
    config.htmlDomElement = $(config.htmlDomElement);
    config.htmlDomElementRight = $(config.htmlDomElementRight);

    //////////////////////////////////////////////////////////////////////////////////
    //		init stereo for htmltemplate
    //////////////////////////////////////////////////////////////////////////////////

    ;(function(){
      if( config.stereoEnabled !== true ) return

      var srcElement  = config.htmlDomElement.get(0)
      var dstElement  = config.htmlDomElementRight.get(0)

      THREEx.DomMirror.copyDomByInnerHTML(srcElement, dstElement)

      THREEx.DomMirror.onChange(srcElement, function() {
        THREEx.DomMirror.copyDomByInnerHTML(srcElement, dstElement)
      });
    })()


    trace("FourJS.Utils.isDesktop = "+isDesktop);
    trace("FourJS.Utils.isInstantOn = "+isInstantOn);

    var _this = this;
    if (isDesktop) {
      // wglCamera = new THREE.PerspectiveCamera(20, config.domElement.innerWidth() / config.domElement.innerHeight(), 1, 1000);
      wglCamera = new THREE.PerspectiveCamera(45, config.domElement.innerWidth() / config.domElement.innerHeight(), 10, 1000);
      wglCamera.rotateZ(THREE.Math.degToRad(180.0));
      wglCamera.translateZ(-80.0);
      wglCamera.translateY(-40.0);
      wglCamera.updateMatrix();
      wglCamera.updateMatrixWorld();
      if(!configuration.initiallyHideScene) {
        sceneShowing = true;
      }
    } else {
      wglCamera = new THREE.Camera();
      wglCamera.matrixAutoUpdate = false;
    }

    wglCamera.name = "camera";

    wglScene = new THREE.Scene();
    wglScene.name = "top-level-scene";

    wglRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    trace('FourJS.Renderer: width/height: '+config.domElement.innerWidth() +'/'+config.domElement.innerHeight());
    wglRenderer.setSize(config.domElement.innerWidth(), config.domElement.innerHeight());
    wglRenderer.setClearColor(0x000000, 0.0);

    if( config.stereoEnabled === true ){
      stereoEffect = new THREE.StereoEffect( wglRenderer );
      stereoEffect.eyeSeparation = 6;
      stereoEffect.focalLength = 5000
      stereoEffect.setSize( window.innerWidth, window.innerHeight );
    }

    config.domElement.append(wglRenderer.domElement);

    // NOTE: The matrixAutoUpdate flag can be read as "when updating the world matrix
    //       first recreate the local matrix from the position vector and rotation quaternion".
    //       We are setting the matrix directly so want to have this to be false, i.e. just
    //       use our matrix directly.
    wglPosePivot = new THREE.Object3D();
    wglPosePivot.name = "pose-pivot";

    wglScenePivot = new THREE.Object3D();
    wglScenePivot.name = "scene-pivot";

    wglScene.add(wglPosePivot);

    var scenePivotMat = new THREE.Matrix4();
    if (isDesktop) {
      wglPosePivot.rotateY(Math.PI);
      wglPosePivot.updateMatrix();
      wglPosePivot.updateMatrixWorld();

      scenePivotMat.elements = new Float32Array([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
      scenePivotMat.makeRotationY(THREE.Math.degToRad(90.0));
      applyPoseToObject3d(scenePivotMat, "scene-pivot");
    } else {
      wglPosePivot.matrixAutoUpdate = false;
      wglScenePivot.matrixAutoUpdate = false;

      scenePivotMat.elements = new Float32Array([1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
      //scenePivotMat.makeRotationZ(THREE.Math.degToRad(90.0));
      scenePivotMat.makeRotationX(THREE.Math.degToRad(90.0));
      applyPoseToObject3d(scenePivotMat, "scene-pivot");

      if(config.trackerType === "arttracker") {
        wglScenePivot.scale.set(trackerScale, trackerScale, trackerScale);
        wglScenePivot.rotateOnAxis(new THREE.Vector3(1.0, 0.0, 0.0), -0.5*Math.PI);
        wglScenePivot.updateMatrix();
        wglScenePivot.updateMatrixWorld();

        trackerSpriteRotation = THREE.Math.degToRad(0.0);
      }
    }


    wglPosePivot.add(wglScenePivot); // Root -> wglPosePivot -> wglScenePivot

    addDefaultLighting(wglScene);
    addMouseHandlers();

    if (isDesktop) {
      var vec = wglScenePivot.matrixWorld.getPosition();
      wglCamera.lookAt(vec);
    }
  };

  var onWindowResize = function () {
    if(config.domElement == false ) return
    var width       = config.domElement.innerWidth()
    var height      = config.domElement.innerHeight()

    wglCamera.aspect = width / height;
    wglCamera.updateProjectionMatrix();

    wglRenderer.setSize(width, height);
    if( stereoEffect ){
      stereoEffect.setSize(width, height);
    }

    render();
  };

  var count = 0;
  var applyPoseToObject3d = function (pose, target) {
    var obj3d;
    switch(target) {
      case "pose-pivot": obj3d = wglPosePivot; break;
      case "scene-pivot": obj3d = wglScenePivot; break;
    }
    if(obj3d) {
      obj3d.matrix.copy(pose);
      obj3d.updateMatrixWorld(true);
    }

    //count++;
    //if(count === 200) {
    //  dumpScene();
    //}
  };

  /***
  * This is called via use of the requestAnimationFrame() function.
  * This calls any update callbacks and renders the scene.
  * @method render
  */
  var catches = 0;
  var render = function () {
    try {
      for (var i = 0; i < updateCallbacks.length; i++) {
        updateCallbacks[i].update();
      }

      if(sceneShowing) {
        updateAnimations();
      }

      if (htmlMixerContext) {
        htmlMixerContext.update();
      }

      if (scripts) {
        scripts.update();
      }
      if( stereoEffect ){
        stereoEffect.render(wglScene, wglCamera);
      }else{
        wglRenderer.render(wglScene, wglCamera);
      }

      // Uncomment to debug scene tree matrices. The number is frame renderings between dumps.
      //dumpSceneTree(wglScene, 500);
    } catch(err) {
      if(catches === 0) {
        catches++;
        FourJS.Utils.log("ERROR: CATCH: FourJS.Renderer.render: "+err.description);
        FourJS.Utils.log("STACK: "+err.stack);

      }
    }
  };

  var addUpdateCallback = function (callbackObject) {
    updateCallbacks.push(callbackObject);
  };

  var removeUpdateCallback = function (callbackObject) {
    updateCallbacks = _.without(updateCallbacks, callbackObject);
  };

  var setEventSink = function(sink) {
    eventSink = sink;
  };

  var setContextInfo = function(info) {
    contextInfo = info;
  };

  var updateAnimations = function() {
    if(wglChapterScene) {
      wglChapterScene.traverse(function (object) {
        if (object instanceof THREEx.VideoObject) {
          object.update();
        }
        var posAnimation = object.posrotscaAnimation;
        if (posAnimation && posAnimation.mode === "playing") {
          posAnimation.update();
        }
      });
    }
  };

  //**** Callbacks from the tracker *****************************************

  /***
  * Set the renderer's viewport.
  * @method setViewport
  * @param {float} x
  * @param {float} y
  * @param {float} width
  * @param {float} height
  */
  var setViewport = function(x, y, width, height) {
    viewPortSize = { x: x , y: y, width: width, height: height };
    wglRenderer.setViewport(x, y, width, height);
    render();
  };

  /***
  * Update the viewport. This is done to set up initial display and after any change of viewport/canvas size.
  * @method updateViewport
  * @param nearFrustrum This is the closest distance for an object we want to render, typically 0.001 or similar.
  * @param farFrustrum The farthest object. Typically this is 1000.0 or so.
  * @param verticalViewAngleDegrees The view angle, usually between 30 and 75 degrees. Note that the apparent distance increases as angle decreases.
  */
  var updateViewport = function (nearFrustrum, farFrustrum, verticalViewAngleDegrees) {
    var canvas = $(wglRenderer.domElement);
    wglRenderer.setSize(canvas.innerWidth(), canvas.innerHeight());

    var gl = wglRenderer.context;
    var width = gl.drawingBufferWidth;    // width in pixels
    var height = gl.drawingBufferHeight;   // height in pixels

    var verticalViewAngleRadians = verticalViewAngleDegrees * Math.PI / 180.0;
    var yHalf = nearFrustrum * Math.tan(verticalViewAngleRadians);
    var xHalf = yHalf * width / height;

    wglRenderer.setViewport(0, 0, canvas.innerWidth(), canvas.innerHeight());
    if (isDesktop) {
      wglCamera.updateProjectionMatrix();
    }

    // TODO: Figure out way this is used. It messes things up.
    // wglCamera.matrixAutoUpdate = false;
    wglCamera.projectionMatrix.makePerspective(verticalViewAngleDegrees, width / height, nearFrustrum, farFrustrum);
  };

  var updateCameraPosition = function (x, y, z) {
    wglCamera.setPosition();
  };

  var updateProjection = function (projection) {
    wglCamera.matrixAutoUpdate = false;
    wglCamera.projectionMatrix.copy(projection);
    wglPosePivot.matrixWorldNeedsUpdate = true;
  };

  /***
  * Set the
  * @method onCameraPose
  * @param modelview
  */
  var onCameraPose = function (modelview) {
    wglPosePivot.matrix.copy(modelview);
    wglPosePivot.updateMatrixWorld(true);
  };

  //**** Add/show/hide Scenes *****************************************

  var addScene = function (scene, threeJsScene) {
    scene.name = "ar-scene";
    if(wglChapterScene) {
      clearScene();
    }

    wglScenePivot.add(scene);
    scene.matrixWorldNeedsUpdate = true;

    wglChapterScene = scene;

    // There is an issue with sprites where the sprite bitmap/texturemap size is initialized
    // on first display. The size of it depends on the scaling when this is done, and this is done
    // after load and prior to first render. As a result, we need to scale the sprite prior to
    // first render, but after the JSON scale value is set, hence the code that follows.
    // See MSDK-120.
    if (wglChapterScene) {
      wglChapterScene.traverse(function(object3d) {
        if (object3d instanceof THREEx.Sprite2DObject) {
          object3d.material.rotation = trackerSpriteRotation;
        }
      });
    }

    // TODO: DELETE THIS WHEN OBJ'S ARE ASSETS!!! Lawrence 2015-09-08
    // The following code initiates loading of the arrow OBJ files.
    // When loaded the arrow objects in the scene sglChapterScene will be updated.
    //    THREEx.ArrowModelObject.loadModels(wglChapterScene);

    if(threeJsScene.gui) {
      sceneGui = new THREEx.Gui();
      sceneGui.init(scene, config.htmlDomElement);
      sceneGui.start();
      sceneGui.compileScripts();
    }

    // Create and configure the scripts.
    scripts = new THREEx.Scripts();
    scripts.init(scene, wglCamera, wglRenderer.domElement, config.htmlDomElement.get(0), FourJS.sceneSignals);

    if(config.eventSink) {
      scripts.setEventSink(config.eventSink);
    }

    if(config.contextInfo) {
      for(var key in config.contextInfo) {
        if(config.contextInfo.hasOwnProperty(key)) {
          scripts.addContextInfo(key, config.contextInfo[key]);
        }
      }
    }

    scripts.setEventSink(eventSink);
    scripts.addContextInfo(contextInfo);
    scripts.start();
    scripts.execute();
    scripts.onSceneLoad();

    if(sceneShowing) {
      showScene();
    }
  };

  var showScene = function () {
    sceneShowing = true;

    if (wglChapterScene) {
      wglChapterScene.visible = true;
      wglChapterScene.traverse(function(object3d) {
        object3d.visible = true;

        // Deal with VideoObject options as necessary
        if (object3d instanceof THREEx.VideoObject) {
          if (object3d.endOptions.option === 'Replay') {
            object3d.video.loop = true;
          }

          if (object3d.startOptions.option === 'AutoPlay') {
            object3d.video.play();
          }
        }

        if (object3d instanceof THREEx.AudioObject) {
          if (object3d.getOption("autoReplay")) {
            object3d.audio.loop = true;
          }

          if (object3d.getOption("autoplay")) {
            object3d.audio.play();
          }
        }

        // Auto-start galleries
        if (object3d instanceof THREEx.GalleryObject) {
          object3d.play();
        }

        // Auto-start animations
        var posAnimation = object3d.posrotscaAnimation;
        if(posAnimation && posAnimation.mode === 'idle') {
          posAnimation.play();
        }
      });
      scripts.onTargetAcquired();
    }
  };

  var hideScene = function () {
    sceneShowing = false;
    if (wglChapterScene) {
      wglChapterScene.visible = false;
      wglChapterScene.traverse(function(object3d) {
        object3d.visible = false;

        // Deal with VideoObject options as necessary
        if (object3d instanceof THREEx.VideoObject && object3d.video ) {
          object3d.video.pause();
        }

        if (object3d instanceof THREEx.AudioObject) {
          object3d.audio.pause();
        }

        // Auto-start galleries
        if (object3d instanceof THREEx.GalleryObject) {
          object3d.pause();
        }

        // Done update posrotsca animiations. They do not have a 'pause' concept so
        // just don't update them.
      });

      if(scripts) {
        scripts.onTargetLost();
      }
    }
  };

  var clearScene = function () {
    if (wglChapterScene) {
      wglChapterScene.traverse(function(object3d, parentObj3d) {
        // Deal with VideoObject options as necessary
        if (object3d instanceof THREEx.VideoObject) {
          object3d.video.pause();
        }

        if (object3d instanceof THREEx.AudioObject) {
          object3d.audio.pause();
        }

      });

      wglChapterScene.traverse(function(obj3d) {
        if (obj3d.geometry) { obj3d.geometry.dispose(); }
        if (obj3d.material) { obj3d.material.dispose(); }
        if (obj3d.texture) { obj3d.texture.dispose(); }
      });

      wglScenePivot.remove(wglChapterScene);
      wglChapterScene = undefined;
    }

    if (scripts) {
      scripts.onSceneUnLoad();
    }
    if(sceneGui) {
      sceneGui.stop();
    }
    updateCallbacks = [];
  };

  //**** Utility functions *****************************************

  var showGrid = function(show) {
    if(show) {
      if (!gridHelper) {
        var gridHelperWidth = 1024*trackerScale;
        gridHelper = new THREE.GridHelper(Math.floor(gridHelperWidth / (25*trackerScale)) * 25*trackerScale, 25*trackerScale);
        gridHelper.setColors(0x3662B2, 0x7b99c4);
        wglScenePivot.add(gridHelper);
      }
      gridHelper.visible = true;
    } else if(gridHelper) {
      gridHelper.visible = false;
    }
  };

  var enablePanAndRotate = function(enable) {
    if(enable) {
      if(!panAndRotateControl) {
        if (window.orientation !== undefined) {
          // hack to support DeviceOrientationControls
          panAndRotateControl = new THREE.DeviceOrientationControls(wglCamera)
          window.addEventListener('deviceorientation', function(){
                  panAndRotateControl.update()
          })
        }else {
          panAndRotateControl = new THREE.OrbitControls(wglCamera, wglRenderer.domElement);
          panAndRotateControl.damping = 0.2;
          panAndRotateControl.target.z = 0.0;
          panAndRotateControl.addEventListener('change', function () {
            render();
          });
        }
      }
      panAndRotateControl.enabled = true;
    } else {
      if(panAndRotateControl) {
        panAndRotateControl.enabled = false;
      }
    }
  };

  var addDefaultLighting = function (object3D) {
    // Add default ambient light.
    //var light = new THREE.AmbientLight(0xffffff);
    var light = new THREE.AmbientLight(isDesktop ? 0x106060 : 0x606060);
    light.name = "default-ambientLight";
    light.serialisable = false;
    light.cannotBeEdited = true;
    object3D.add(light);

    // Add a directional light.
    light = new THREE.DirectionalLight(isDesktop ? 0xffffff : 0xffffff, 1.0);
    light.target.name = 'default-directional-light-target';
    light.target.serialisable = false;
    light.target.cannotBeEdited = true;
    object3D.add(light.target);

    var s = trackerScale;
    var xDirection = (config.trackerType === "arttracker" ? -1.0 : 1.0);

    // Add (another) directional light.
    light.name = 'default-directional-light';
    if (isInstantOn) {
      light.position.set(1.0*s, -1.0*s, 1.5*s);
    } else if (isDesktop) {
      light.position.set(-1.0*s, -1.0*s, -1.5*s);
    } else if(config.trackerType === "arttracker") {
      light.position.set(1.0*s, 1.0*s, 2.0*s); // Z is reversed for ART Tracker
    } else {
      light.position.set(1.0*s, 1.0*s, -2.0*s);
    }

    light.serialisable = false;
    light.cannotBeEdited = true;
    object3D.add(light);
  };

  // Debugging...
  var createObjectCloud = function() {
    var s = 1.0; //trackerScale;
    var geometry = new THREE.CylinderGeometry(0*s, 10*s, 30*s, 4, 1);
    var material = new THREE.MeshLambertMaterial({color: 0xffffff, shading: THREE.FlatShading});

    var spread = 2000.0*s;

    for (var i = 0; i < 200; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = ( Math.random() - 0.5 ) * spread;
      mesh.position.y = ( Math.random() - 0.5 ) * spread;
      mesh.position.z = ( Math.random() - 0.5 ) * spread;
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      wglScenePivot.add(mesh);
    }
  };


  var shutdown = function() {
    wglCamera = undefined;
    wglRenderer = undefined;
    wglScene = undefined;
    wglPosePivot = undefined;
    wglScenePivot = undefined;
    htmlMixerContext = undefined;
    wglProjector = undefined;
    wglChapterScene = undefined;
    panAndRotateControl = undefined;
    gridHelper = undefined;
  };

  //**** Event handlers *****************************************

  var addMouseHandlers = function () {
    wglProjector = new THREE.Projector();

    var _this = this;
    $(wglRenderer.domElement).on('click', function (e) {
      // TODO to add Element.getBoundingClientRect instead
      var clientX = typeof e.offsetX !== "undefined" ? e.clientX - $(e.target).offset().left : e.offsetX;
      var clientY = typeof e.offsetY !== "undefined" ? e.clientY - $(e.target).offset().top : e.offsetY;
      var mouse3D = new THREE.Vector3(
        (clientX / e.target.clientWidth ) * 2.0 - 1.0,    //x
        -( clientY / e.target.clientHeight ) * 2.0 + 1.0,  //y
        0.5);                                         //z

        mouse3D.unproject(wglCamera);
        mouse3D.sub(wglCamera.position);
        mouse3D.normalize();

        var rayCaster = new THREE.Raycaster(wglCamera.position, mouse3D);
        var intersects = rayCaster.intersectObjects(wglChapterScene.children, true);

        if (intersects.length > 0) {
          var object3D = intersects[0].object;
          if (object3D.behaviors) {
            object3D.behaviors.onMouseEvent(e);
          }
        }
      });
    };

    //**** Debug dump of 3D object tree *****************************************
    // TODO to be put in a threex.rendererDebug.js thus everybody can benefit
    var dumpSceneTree = function (topLevelObject, n) {
      if (debugCount < n) {
        debugCount++;
      } else {
        debugCount = 0;
        var str = dumpObject(topLevelObject, "");
        log(str);
        str = dumpObject(wglCamera, "", true);
        log(str);
      }
    };

    var dumpScene = function () {
      var str = dumpObject(wglScene, "");
      log(str);
      str = dumpObject(wglCamera, "", true);
      log(str);
    };

    var dumpObject = function (object3D, indent, andPerspective) {
      var str = indent + "*** " + object3D.name + "\n";
      str += indent + "    visible: "+object3D.visible+"\n";
      str += indent + "    matrix\n";
      str += dumpTransform(object3D.matrix.elements, indent + "    ");
      str += indent + "    matrixWorld\n";
      str += dumpTransform(object3D.matrixWorld.elements, indent + "    ");
      str += "\n";
      if(andPerspective) {
        str += indent + "    projectionMatrix\n";
        str += dumpTransform(object3D.projectionMatrix.elements, indent + "    ");
        str += "\n";
      }
      for (var i = 0; i < object3D.children.length; i++) {
        str += dumpObject(object3D.children[i], indent + "    ");
      }
      return str;
    };

    /***
    * Return a string with a transform
    * @method printTransform
    * @param t {Float32Array} transform of length 16
    * @param indent
    * @returns {string}
    */
    var dumpTransform = function (t, indent) {
      var str = "";
      for (var r = 0; r < 4; r++) {
        str += indent;
        for (var c = 0; c < 4; c++) {
          str += t[c * 4 + r];
          if (c !== 3) {
            str += "   ";
          }
        }
        str += "\n";
      }
      return str;
    };

    return {
      initialize: initialize,
      onWindowResize: onWindowResize,
      render: render,
      applyPoseToObject3d: applyPoseToObject3d,
      addUpdateCallback: addUpdateCallback,
      removeUpdateCallback: removeUpdateCallback,
      setEventSink: setEventSink,
      setContextInfo: setContextInfo,
      updateViewport: updateViewport,
      updateCameraPosition: updateCameraPosition,
      updateProjection: updateProjection,
      onCameraPose: onCameraPose,
      addScene: addScene,
      showScene: showScene,
      hideScene: hideScene,
      clearScene: clearScene,
      getViewPortSize: function() { return viewPortSize; },
      getCamera: function() { return wglCamera; },
      getScene: function() { return wglScene; },
      getDomElement: function() { return wglRenderer.domElement; },
      getOverlayElement: function() { return config.htmlDomElement; },
      getScripts: function() { return scripts; },
      enablePanAndRotate: enablePanAndRotate,
      addDefaultLighting: addDefaultLighting,
      setViewport: setViewport,
      showGrid: showGrid,
      shutdown: shutdown,
      dumpScene: dumpScene,
      createObjectCloud: createObjectCloud,

      // Debugging and testing hooks
      $$getConfig: function() { return config; }
    };

  };
