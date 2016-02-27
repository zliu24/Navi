//////////////////////////////////////////////////////////////////////////////////
//		Import render loop
//////////////////////////////////////////////////////////////////////////////////
// array of functions for the rendering loop
var onRenderFcts= [];

// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
        // keep looping
        requestAnimationFrame( animate );
        // measure time
        lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
        var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
        lastTimeMsec	= nowMsec
        // call each update function
        onRenderFcts.forEach(function(onRenderFct){
                onRenderFct(deltaMsec/1000, nowMsec/1000)
        })
})



//////////////////////////////////////////////////////////////////////////////////
//		initialize renderer for css coverflow
//////////////////////////////////////////////////////////////////////////////////

if( stereoEnabled === false ){
        var rendererCss = new THREE.CSS3DRenderer()
}else{
        var rendererCss = new THREE.CSS3DStereoRenderer();
        rendererCss.separation = 3;
        rendererCss.targetDistance = 500;
}
rendererCss.setSize( window.innerWidth, window.innerHeight );
rendererCss.domElement.style.position = 'absolute';
rendererCss.domElement.style.top = '0px';
rendererCss.domElement.style.pointerEvents = 'none';
rendererCss.domElement.classList.add('css3dContainer')
document.body.appendChild( rendererCss.domElement );

var sceneCss = new THREE.Scene()

// render the scene
onRenderFcts.push(function(){
        if( window.sceneViewer === undefined ) return
        // to use four.js camera
        var camera = sceneViewer.getRenderer().getCamera()
        camera.updateMatrixWorld()
        camera.updateProjectionMatrix()
        
        // Update reticule before rendering scene
        if(reticule instanceof THREEx.Reticule){
                reticule.update();
        }
  
        // to actually render the scene   
        rendererCss.render( sceneCss, camera );
})

// to handle resize
window.addEventListener('resize', function(){
        rendererCss.setSize( window.innerWidth, window.innerHeight );
})


//////////////////////////////////////////////////////////////////////////////////
//		createCoverflow
//////////////////////////////////////////////////////////////////////////////////
createCoverflow();

//////////////////////////////////////////////////////////////////////////////////
//		Comments
//////////////////////////////////////////////////////////////////////////////////

// Simulate task (not important)
var fakeTask = { 
        app_id: 2,
        created_at: "2015-11-17T19:51:49.000Z",
        description: null,
        enterprise_id: 3,
        id: 1506,
        input_label: "Capture the Wall",
        input_options: {},
        input_type: "media",
        name: "This is the first task",
        project_id: 891,
        published_at: null,
        step_id: 849,
        threejsScene:{},
        updated_at: "2015-11-18T00:27:51.210Z"
}

var sceneUrl	= 'scenes/coverflow-stereo.json'
loadSceneUrl(sceneUrl);

// Load JSON And parse it
function loadSceneUrl(url){
        var request  = new XMLHttpRequest();
        request.onload  = function(){
                var content   = request.responseText;
                fakeTask.threejsScene  = JSON.parse(content);
                show4DTask(fakeTask);
        };
        request.open("get", url, true);
        request.send();
}

// to handle resize
window.addEventListener('resize', function(){
        var renderer = sceneViewer.getRenderer()
        renderer.onWindowResize()
})

// Display Scene with FourJS
FourJS.Utils.platform = 'desktop';
var reticule;
var show4DTask = function(task) {
        var fourJsSceneViewer  = FourJS.SceneViewer();
        window.sceneViewer = fourJsSceneViewer
        
        // Callback called when scene is loaded
        var viewerConfig ={
                onLoad: function onSceneLoaded(scene) {
                        console.log('onSceneLoaded')
                        
                        //////////////////////////////////////////////////////////////////////////////
                        //              init reticule
                        //////////////////////////////////////////////////////////////////////////////
                        
                        if( reticuleEnabled ){
                                var canvas = window.sceneViewer.getRenderer().getDomElement();
                                var camera = window.sceneViewer.getRenderer().getCamera();
                                var scene = window.sceneViewer.getRenderer().getScene();
                                reticule = new THREEx.Reticule(canvas, camera, scene, sceneCss, stereoEnabled);
                                // Best code ever to look pretty
                                reticule.object3d.scale.set(1,1,1).multiplyScalar(1/24);  
                                sceneCss.add(reticule.object3d);
                                                          
                                // resize event
                                window.addEventListener('resize', function(){
                                        reticule.reticuleAction.resizeEvent();
                                })                                

                                //////////////////////////////////////////////////////////////////////////////
                                //              Handle THREEx.ReticuleHelper
                                //////////////////////////////////////////////////////////////////////////////
                                
                                ;(function(){
                                        var camera = sceneViewer.getRenderer().getCamera().clone()
                                        // create a THREEx.ReticuleHelper
                                        var reticuleHelper = new THREEx.ReticuleHelper(camera, stereoEnabled)
                                        reticuleHelper.object3d.visible = false
                                        scene.add(reticuleHelper.object3d)
                                        reticuleHelper.update()

                                        document.body.addEventListener( 'keydown', function(event){
                                                if( event.keyCode !== "D".charCodeAt(0) )     return
                                                var object3d = reticuleHelper.object3d
                                                object3d.visible = object3d.visible === true ? false : true
                                        }, false)
                                        document.body.addEventListener( 'keydown', function(event){
                                                if( event.keyCode !== "U".charCodeAt(0) )     return
                                                camera.copy(sceneViewer.getRenderer().getCamera())
                                                reticuleHelper.update()
                                        }, false)
                                })()

                        }

                        //////////////////////////////////////////////////////////////////////////////
                        //              init timer update to show html mirroring
                        //////////////////////////////////////////////////////////////////////////////
                        
                        setTimeout(function(){  // FIXME why this setTimeout is needed ???
                                var domElement = document.createElement('span')
                                document.querySelector('.fourjs-html').appendChild(domElement)
                                setInterval(function(){
                                        domElement.innerHTML = 'Timestamp: '+Date.now();
                                }, 100)
                        }, 1)
                }
        };
        
        viewerConfig.domElement = document.querySelectorAll(".fourjs-container");
        viewerConfig.debugLevel = 2;
        viewerConfig.showGrid = true;
        viewerConfig.showTarget = true;
        viewerConfig.showScanningIndicator = false;
        viewerConfig.platform = "desktop";
        
        viewerConfig.stereoEnabled      = stereoEnabled
        
        fourJsSceneViewer.initialize(viewerConfig);
        
        fourJsSceneViewer.load({
                task: task,
                orbitControls: true,
                showGrid: true
        });
        
};