function createCoverflow(){
        
        //////////////////////////////////////////////////////////////////////////////////
        //		For Object animation
        //////////////////////////////////////////////////////////////////////////////////
        var positionTween
        var positionTarget = new THREE.Vector3;
        var scaleTween
        var scaleTarget = new THREE.Vector3(1,1,1);
        
        
        onRenderFcts.push(function(){
                if( positionTween !== undefined )       positionTween.update(window.performance.now())
                if( scaleTween !== undefined )       scaleTween.update(window.performance.now())
        })
        
        function reinitObjectTweening(){
                var scene = sceneViewer.getRenderer().getScene()
                scene = scene.children[0].children[0].children[1]
                window.scene = scene
                
                var mesh = scene.getObjectByName('Sphere')
                // var mesh = scene.getObjectByName('mWheel')
                
                if( positionTween !== undefined )       positionTween.stop()
                positionTween = new TWEEN.Tween( mesh.position )
                .to( {
                        x: positionTarget.x,
                        y: positionTarget.y,
                        z: positionTarget.z
                },1500 )
                .easing( TWEEN.Easing.Elastic.InOut )
                .start();                        
                
                if( scaleTween !== undefined )       scaleTween.stop()
                scaleTween = new TWEEN.Tween( mesh.scale )
                .to( {
                        x: scaleTarget.x,
                        y: scaleTarget.y,
                        z: scaleTarget.z
                },500 )
                .easing( TWEEN.Easing.Elastic.InOut )
                .start();                        
        }
        
        //////////////////////////////////////////////////////////////////////////////////
        //		to process actions
        //////////////////////////////////////////////////////////////////////////////////
        
        function doAction(action){
                if( action === 'alert' ){
                        alert('This is a font-awesome icon')
                }else if( action === 'shapeSquare' ){
                        coverflow.computeTargetCallback = computeTargetSquare
                        coverflow.positionEasing  = coverflow.rotationEasing  = TWEEN.Easing.Cubic.Out
                        coverflow.select( coverflow.selectedIndex )
                }else if( action === 'shapeCircle' ){
                        coverflow.computeTargetCallback = computeTargetCircle
                        coverflow.positionEasing  = coverflow.rotationEasing  = TWEEN.Easing.Quintic.InOut
                        coverflow.select( coverflow.selectedIndex )
                }else if( action === 'shapeRing' ){
                        coverflow.computeTargetCallback = computeTargetRing
                        coverflow.positionEasing  = coverflow.rotationEasing  = TWEEN.Easing.Quintic.InOut
                        coverflow.select( coverflow.selectedIndex )
                }else if( action === 'shapeCoverflow' ){
                        coverflow.computeTargetCallback = computeTargetCoverflow
                        coverflow.positionEasing  = coverflow.rotationEasing  = TWEEN.Easing.Cubic.Out
                        coverflow.select( coverflow.selectedIndex )
                }else if( action === 'goRight' ){
                        positionTarget.add(new THREE.Vector3(+40,0,0))
                        reinitObjectTweening()
                }else if( action === 'goLeft' ){
                        positionTarget.add(new THREE.Vector3(-40,0,0))
                        reinitObjectTweening()
                }else if( action === 'goCenter' ){
                        positionTarget.set(0,0,0)
                        reinitObjectTweening()
                }else if( action === 'bigger' ){
                        scaleTarget.multiplyScalar(1.2)
                        reinitObjectTweening()
                }else if( action === 'smaller' ){
                        scaleTarget.multiplyScalar(0.8)
                        reinitObjectTweening()
                }else{
                        console.assert(false, 'Unknown action :'+action)
                }
        }
        
        //////////////////////////////////////////////////////////////////////////////////
        //		For coverflow creation
        //////////////////////////////////////////////////////////////////////////////////
        
        var domElements	= []
        window.domElements = domElements        // to debug
        
        function addButtonElement(text){
                var domElement = document.createElement('div')
                domElement.style.pointerEvents  = 'auto'
                
                var btnElement = document.createElement('div')
                btnElement.classList.add("button")
                btnElement.innerHTML = text
                
                domElement.appendChild( btnElement )
                
                var index = domElements.length
                btnElement.addEventListener('click', function(){
                        // console.log('click on', index)
                        coverflow.select(index)
                })
                
                return domElement
        }
        
        var actions = {
                'shapeSquare'   : 'Square menu',
                'shapeCircle'   : 'Circle menu',
                'shapeRing'     : 'Ring menu',
                'shapeCoverflow': 'Coverflow menu',
                'goLeft'        : 'Object Left',
                'goRight'       : 'Object Right',
                'goCenter'      : 'Object Center',
                'bigger'        : 'Make it bigger',
                'smaller'       : 'Make it smaller',
        }
        Object.keys(actions).forEach(function(actionName){
                var actionLabel       = actions[actionName]
                var domElement  = addButtonElement(actionLabel)
                domElement.querySelector('div.button').addEventListener('click', function(){
                        doAction(actionName)
                })
                domElements.push( domElement )                        
        })
        
        //////////////////////////////////////////////////////////////////////////////////
        //		to createa coverflow object
        //////////////////////////////////////////////////////////////////////////////////
        
        var coverflow	= new THREEx.CoverflowCss3d(domElements)
        coverflow.computeTargetCallback = computeTargetCoverflow
        coverflow.reset();
        coverflow.object3d.rotation.y = Math.PI;
        coverflow.object3d.position.z = -11;
        // coverflow.rotation.y = Math.PI
        sceneCss.add(coverflow.object3d)
        onRenderFcts.push(function(){
                coverflow.update()
        })
        coverflow.object3d.scale.set(1,1,1).multiplyScalar(1/12);                
        doAction('shapeCircle')
        
        //  Mirror the class for each THREE.CSS3DObject thus we see the hovering effect FIXME
        if(stereoEnabled === true){
                //////////////////////////////////////////////////////////////////////////////
                //              mirror classname for coverflow domElements
                //////////////////////////////////////////////////////////////////////////////
                onRenderFcts.push(function(){
                        coverflow.object3d.traverse(function(object3d){
                                if(object3d instanceof THREE.CSS3DObject === false) return;
                                if(object3d.elementR.className !== object3d.elementL.className){
                                        
                                        object3d.elementR.className = object3d.elementL.className;
                                }
                        })
                })

                //////////////////////////////////////////////////////////////////////////////
                //              mirror classname in THREEx.Reticule domElements
                //////////////////////////////////////////////////////////////////////////////
                onRenderFcts.push(function(){
                        if(reticule instanceof THREEx.Reticule){
                                if(reticule.object3d.elementR.className !== reticule.object3d.elementL.className){
                                        reticule.object3d.elementR.className = reticule.object3d.elementL.className
                                }
                        }
                })
        }
        
        //////////////////////////////////////////////////////////////////////////////////
        //		compute target for various shape
        //////////////////////////////////////////////////////////////////////////////////
        
        function computeTargetCircle(object3d, index, selectedIndex){
                // Formula for circle
                var deltaAngle  = 2*Math.PI / domElements.length
                var angle       = - (index - selectedIndex) * deltaAngle + Math.PI/2
                var radius      = 500;
                object3d.position.x     = Math.cos(angle)*radius
                object3d.position.z     = Math.sin(angle)*radius -100                                 
        }
        function computeTargetRing(object3d, index, selectedIndex){
                // Formula for circle
                var deltaAngle  = 2*Math.PI / domElements.length
                var angle       = - (index - selectedIndex) * deltaAngle + Math.PI/2
                var radius      = 500
                object3d.position.x     = Math.cos(angle)*radius
                object3d.position.y     = -Math.sin(angle)*radius + 500                                
                if( index !== selectedIndex ){
                        object3d.position.z     = -300                                
                }
        }
        
        function computeTargetSquare(object3d, index, selectedIndex){
                
                var width       = Math.floor(domElements.length / 3)
                var domElementW = 550
                var domElementH = 150
                
                var col = Math.floor(index / width)
                var row = Math.floor(index % width)
                
                object3d.position.x     =   row * domElementW
                object3d.position.y     = - col * domElementH
                
                var col = Math.floor(4 / width)
                var row = Math.floor(4 % width)
                object3d.position.x     -=   row * domElementW
                object3d.position.y     -= - col * domElementH
                
                object3d.position.y+=170;
                if( index !== selectedIndex ){
                        object3d.position.z     = -100                                
                }
        }
        
        function computeTargetCoverflow(object3d, index, selectedIndex){
                // Formula for coverflow
                if( index === selectedIndex ){
                        object3d.position.x     = 0                        
                        object3d.position.z     = 0
                }else{
                        var delta       = index - selectedIndex;
                        object3d.position.x     = delta * 250
                        object3d.position.z     = -300
                        object3d.lookAt(new THREE.Vector3(-delta*500,0,300))
                }                                                
        }
        
        //////////////////////////////////////////////////////////////////////////////////
        //		to honor .selected and domElement focus
        //////////////////////////////////////////////////////////////////////////////////
        
        coverflow.signals.selected.add(function(selectedIndex){
                domElements.forEach(function(domElement, index){
                        // var child = domElement.children[0]
                        if( index === selectedIndex ){
                                domElement.classList.add('selected')   
                                domElement.children[0].focus()                                     
                        }else{
                                domElement.classList.remove('selected')
                        }
                })
        })
        
        
        //////////////////////////////////////////////////////////////////////////////////
        //		to honor keyboard navigation
        //////////////////////////////////////////////////////////////////////////////////
        
        // handle keyboard to select coverflow item
        document.body.addEventListener('keydown', function(event){
                if( event.keyCode === 37 ){
                        coverflow.select( coverflow.selectedIndex - 1 )
                        event.stopPropagation()
                }else if( event.keyCode === 40 ){
                        coverflow.select( coverflow.selectedIndex + 3)
                        event.stopPropagation()
                }else if( event.keyCode === 38 ){
                        coverflow.select( coverflow.selectedIndex - 3)
                        event.stopPropagation()
                }else if( event.keyCode === 39 ){
                        coverflow.select( coverflow.selectedIndex + 1 )
                        event.stopPropagation()
                }else if( event.keyCode === " ".charCodeAt(0) || event.keyCode === "\r".charCodeAt(0) ){
                        console.log(coverflow.domElements[coverflow.selectedIndex])
                        var domElement = coverflow.domElements[coverflow.selectedIndex];
                        domElement = domElement.querySelector(".button");
                        domElement.click();
                        event.stopPropagation()
                }
        })
        
        console.log('coverload CREATED')
}