# TODO

* create a basic.html which build its own scene
    - if scene is always loaded from editor storage, it make player harder to tests

## Task include threex.studiobehavior.js in the player
* create a examples/behaviors.html

TODO
====
* add .renderingEnabled and .controlsEnabled in viewport
* plug the player at the end of the editor
    - aka init player variable from editor
    - the player run the scene owned by the editor ?
        + or the opposite ?
        + it seems to me the editor should edit the game
        + not the opposite
* then have a play button
    - when pressed, disabled the viewport
    - disabled undo
    - reset scissor
    - how to handle the camera ?



how to code the play mode
=========================
- it is happening in the editor
- it is happening standalone
- in standalone, it has to run alone
    + is it more than loading the scene and displaying it ?
    + there are no script
    + there are no camera controls
    + it seems to be only displaying it
- in the editor, it is
    + disabled viewport rendering and controls editor
    + enabled viewport rendering and controls in the runner
    + start the runner


Stages
======
1. you read the scene in a standalone applications
2. then you put this standalone application code in the editor
3. add a play/edit toggle button to switch from one to another
4. copy the scene ? not at first
    - make runner and editor to run on the same THREE.Scene and THREE.Renderer
    - and use the same canvas
    - then copy the scene in/out with the exporter/loader
