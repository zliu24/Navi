var THREEx  = THREEx  || {}

/**
* Player for 4dstudio
*
* @class
*/
THREEx.StudioPlayer  = function(){
        var player = this;
        
        player.signals = {
                onInit  : new SIGNALS.Signal(),
                onStart  : new SIGNALS.Signal(),
                onRender: new SIGNALS.Signal(),
                onStop  : new SIGNALS.Signal(),
                clearedScene  : new SIGNALS.Signal(),
                switchTask : new SIGNALS.Signal()
              }

        // Implements programmatic switching of tasks: daqri.switchTask(task_id).  We add this here instead of as part of threex.scripts.js#init(), since the behavior is different between Designer and the various mobile apps
        player.signals.switchTask.add(function(task_id) {
          if (window.hasOwnProperty('angular')) {
            var scope = angular.element(document.querySelector('canvas')).scope();
            if (scope.threejs && scope.threejs.editor && scope.threejs.editor.getMode() == 'play') {
                scope.threejs.switchTask(task_id);
            } else {
              console.log("Skip switching task to " + task_id + ": not in 'play' mode.");
            }
          }
        });

        player.isPaused  = true
        
        if (window.daqri && window.daqri.environment == 'test') {
                player.renderer = new THREE.CanvasRenderer();
        } else {    
                player.renderer  = new THREE.WebGLRenderer({
                        antialias  : true,
                        alpha    : true,
                });
        }
        
        // player.renderer.setClearColor(new THREE.Color('lightgrey'), 1)
        
        player.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
        player.camera.position.z = 100;
        
        player.renderingEnabled  = true;
        
        player.events = {};
        
        player.scene = new THREE.Scene()
        
        player.behaviors_obj = null;
        player.behaviors_gui = null;
        player.gui = null;
        player.scripts = null;
        // controls are handled externally
}

/**
* render the scene
*/
THREEx.StudioPlayer.prototype.render = function() {
        var player  = this;
        var renderer  = player.renderer;
        var scene  = player.scene;
        var camera  = player.camera;
        
        if ( player.renderingEnabled === false ) return
        
        //var request = requestAnimationFrame( animate );
        
        player.signals.onRender.dispatch()
        
        // resize on each frame
        var boundingRect = renderer.domElement.getBoundingClientRect();
        renderer.setSize( boundingRect.width, boundingRect.height )
        camera.aspect = boundingRect.width / boundingRect.height
        camera.updateProjectionMatrix()
        
        // Resize 'html template' overlay to be the same size as the viewport
        // $('#viewport-overlay').width($('.code-editing-renderer').outerWidth(true));
        // $('#viewport-overlay').height($('.code-editing-renderer').outerHeight(true));
        
        // actually render the scene
        player.renderer.render( player.scene, player.camera )
        
        if( player.scripts !== null ){
                player.scripts.update();
        }
}

/**
* clear the scene
*/
THREEx.StudioPlayer.prototype.clearScene = function() {
        var player = this
        while ( player.scene.children.length > 0 ) {
                var firstChild  = player.scene.children[0];
                player.scene.remove(firstChild);
        }
        
        player.signals.clearedScene.dispatch()
}

THREEx.StudioPlayer.prototype.setScene = function(scene) {
        var player  = this;
        scene.children.slice(0).forEach(function(child){
                player.scene.add(child);
        });
}

THREEx.StudioPlayer.prototype.dispatch = function ( array, event ) {
        for ( var i = 0, l = array.length; i < l; i ++ ) {
                array[ i ]( event );
        }
};


/**
* return true if the player is running, false otherwise
* @return {Boolean} - return true if the player is running, false otherwise
*/
THREEx.StudioPlayer.prototype.isRunning = function() {
        return this.isPaused ? false : true
};

/**
* start the player
*/
THREEx.StudioPlayer.prototype.start = function() {
        console.assert(this.isRunning() === false);
        this.isPaused  = false;
        this.signals.onStart.dispatch();
        if( this.gui ) this.gui.start(); // load html and css into div overlay
        if( this.scripts !== null ){
                this.scripts.start();
                this.scripts.execute();
                
                // Tell scripts that scene load and target_acquisition have happened. The mobile app should of course implement these at the appropriate times.
                this.scripts.onSceneLoad();
                this.scripts.onTargetAcquired();                
        }
};

/**
* stop the player
*/
THREEx.StudioPlayer.prototype.stop = function() {
        console.assert(this.isRunning() === true);
        this.isPaused  = true;
        this.signals.onStop.dispatch();
        
        if( this.scripts ){
                this.scripts.onTargetLost();
                this.scripts.onSceneUnLoad();                
        }
        
        if( this.gui )          this.gui.stop(); // clear html/css in overlay
        if( this.scripts )      this.scripts.stop();
};


THREEx.StudioPlayer.prototype.init = function() {
        this.signals.onInit.dispatch();
};

/**
* Enables behaviors within the studio player
*/
THREEx.StudioPlayer.prototype.addBehaviorsComponent  = function() {
        var player = this;
        
        var behaviors_obj = new THREEx.BehaviorsObj;
        behaviors_obj.init(player.scene);
        player.behaviors_obj = behaviors_obj;
        
        var behaviors_gui = new THREEx.BehaviorsGui;
        behaviors_gui.init(player.scene);
        player.behaviors_gui = behaviors_gui;
}

/**
* Enables user-created GUIs within the studio player
*/
THREEx.StudioPlayer.prototype.addGuiComponent  = function() {
        var player = this;
        
        var gui = new THREEx.Gui;
        gui.init(player.scene, '#' + angular.element(document.querySelector('canvas')).scope().getOverlaySelector());
        player.gui = gui;
}

/**
* add the scripts component
*/
THREEx.StudioPlayer.prototype.addScriptsComponent  = function() {
        var player = this;

        var selector = angular.element(document.querySelector('canvas')).scope().getOverlaySelector();

        var scripts = new THREEx.Scripts();
        scripts.init(player.scene, player.camera, player.renderer.domElement, document.getElementById(selector), player.signals);
        
        player.scripts = scripts;
}
