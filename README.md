# daqri-code

### Flowchart: 
------------------
<img src="https://github.com/cs210/daqri-code/blob/master/document/img1.png" width="400">

### Technical Terms:
------------------
* ADF: Area Description File.
* Start-of-service coordinate frame: The coordinate system defined by the starting point of current service.
* Area-description coordinate frame: The coordinate system defined by the ADF origin.
* Device coordinate frame: The coordinate system defined by the current location of the device. 
* Pose: The position and orientation of the user's device.


### Components:
------------------
##### 1. Motion Tracking Component:
* IMU (Inertial Measurement Unit): Calculate relative coordinates (device w.r.t. start-of-service) using sensors.
* [VIO (Visual-Inertial Odometry)](https://developers.google.com/project-tango/overview/area-learning#usability_tips): Remember the key visual features of a physical space using Area Learning.
  * Localization: Orient and position itself within a previously learned area (start-of-service coordinate w.r.t area-description coordinate) using the ADF.
  * Drift correction: Improve the accuracy of the trajectory created by IMU.
* We use Project Tango Explorer to scan the building and save the information into an ADF file.
* The file is then loaded by our program and the absolute coordinates are retrieved (in the Area-description coordinate frame).
  
##### 2. Map Component:
* Given a 2D floor plan, process the image with noise reduction and binary thresholding. The floor plan is now a binary image (0: forbidden region; 1: free space).
  * Algorithm: Otsu's method.
* Find the mapping between the 2D floor plan and the 3D world.
  * 2D: 3 DOF (x, y, theta); 3D: 6 DOF (x, y, z, pitch, yaw, roll).
  * Method: Key points mapping + least squares.
* Calculate the optimal path. This problem can be modeled as an [Any-Angle Path Planning](https://en.wikipedia.org/wiki/Motion_planning) problem.
  * Algorithm: [Lazy Theta*](http://aigamedev.com/open/tutorial/lazy-theta-star/).
  
<img src="https://github.com/cs210/daqri-code/blob/master/document/img2.png" width="300">
  
##### 3. AR / UI Compoent:
* AR: Given the direction the user is facing (theta1) and the direction given by the optimal path (theta2), render the arrow in front of the user.
  * Need to make sure the arrow is in sight (The arrow should move with the direction the user is facing).
  * Display on the ground or surface.



