# DONE Click stereo without renderer
- implement CSS3DObject.raycast() - it is used by THREE.Raycaster
- thus it is possible to cast a ray without rendering the scene
  - so much better performance
- how to implement CSS3DObject.raycast() ?
  - every domElement is rectangle
  - one can get the size of this rectangle
  - ```var computedStyle = window.getComputedStyle(domElement);```
  - ```computedStyle.height === '128px'```
  - ```computedStyle.width === '512px'```
  - so it is just a matter of computing is a ray is going thru a rectangle
  - it should be rather simple to compute

# Reticule
- DONE review the code of reticule.js
- clean up the css. 
  - be sure it is namespaced

# Misc
- add option to remove coverflow
- DONE option add/remove the reticle in the demo
  - reticle is clumsy when demoing on desktop, one should be able to remove it
  - option in the url and page reload ?

# DONE Add debug for click
- camera left/right must have a camera helper
- later put main camera on a .update function
- do a threex.reticulesDebug.js
  - ```var reticuleHelper = new THREEx.ReticuleHelper(stereoEnabled)```
  - it has an object3d container. you 
  - every time you move the camera, do ```reticuleHelper.update(camera)```
  ```var reticuleHelper = new THREEx.ReticuleHelper(stereoEnabled)```
  ```scene.add(reticuleHelper.object3d)```
  ```reticuleHelper.update(camera)```

