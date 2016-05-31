/*
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package edu.stanford.navi;

import android.content.Context;
import android.graphics.Color;
import android.view.MotionEvent;

import com.google.atap.tangoservice.TangoPoseData;
import com.projecttango.rajawali.DeviceExtrinsics;
import com.projecttango.rajawali.Pose;
import com.projecttango.rajawali.ScenePoseCalculator;
import com.projecttango.rajawali.ar.TangoRajawaliRenderer;

import org.apache.commons.math3.complex.Quaternion;
import org.rajawali3d.Object3D;
import org.rajawali3d.lights.DirectionalLight;
import org.rajawali3d.loader.LoaderOBJ;
import org.rajawali3d.loader.ParsingException;
import org.rajawali3d.materials.Material;
import org.rajawali3d.materials.methods.DiffuseMethod;
import org.rajawali3d.math.vector.Vector3;
import org.rajawali3d.primitives.Cube;
import org.rajawali3d.primitives.Line3D;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;
import java.util.Vector;

import java.lang.Math.*;

/**
 * Very simple example augmented reality renderer which displays a cube fixed in place.
 * Whenever the user clicks on the screen, the cube is placed flush with the surface detected
 * with the depth camera in the position clicked.
 * <p/>
 * This follows the same development model than any regular Rajawali application
 * with the following peculiarities:
 * - It extends <code>TangoRajawaliArRenderer</code>.
 * - It calls <code>super.initScene()</code> in the initialization.
 * - When an updated pose for the object is obtained after a user click, the object pose is updated
 * in the render loop
 * - The associated AugmentedRealityActivity is taking care of updating the camera pose to match
 * the displayed RGB camera texture and produce the AR effect through a Scene Frame Callback
 * (@see AugmentedRealityActivity)
 */
public class AugmentedRealityRenderer extends TangoRajawaliRenderer {
    private static final float CUBE_SIDE_LENGTH = 0.1f;
    private static final String TAG = AugmentedRealityRenderer.class.getSimpleName();

    float[][] pathPoints;
    List<Object3D> pathObjects;
    Line3D line;
    private boolean pathObjectUpdated = false;
    Material material;

    public AugmentedRealityRenderer(Context context) {
        super(context);
    }

    @Override
    protected void initScene() {
        // Remember to call super.initScene() to allow TangoRajawaliArRenderer
        // to be set-up.
        super.initScene();

        // Add a directional light in an arbitrary direction.
        DirectionalLight light = new DirectionalLight(1, 0.2, -1);
        light.setColor(1, 1, 1);
        light.setPower(0.8f);
        light.setPosition(3, 2, 4);
        getCurrentScene().addLight(light);

        //Adding a second directional light from top
        DirectionalLight light0 = new DirectionalLight(-1, -1, 0.2);
        light0.setColor(1, 1, 1);
        light0.setPower(0.8f);
        light0.setPosition(3, 2, 4);
        getCurrentScene().addLight(light0);

        // Set-up a material
        material = new Material();
        material.setColor(Color.GREEN); // Purple 0xcc00ff
        material.enableLighting(true);
        material.setDiffuseMethod(new DiffuseMethod.Lambert());

    }

    @Override
    protected void onRender(long elapsedRealTime, double deltaTime) {
        // Update the AR object if necessary
        // Synchronize against concurrent access with the setter below.
        synchronized (this) {
            if (pathObjectUpdated) {
                if(pathObjects != null && line != null) {
                    for(int i = 0; i < pathObjects.size(); i++) {
                        getCurrentScene().removeChild(pathObjects.get(i));
                    }
                    getCurrentScene().removeChild(line);
                }

                pathObjects = new ArrayList<Object3D>();
                Stack<Vector3> stack = new Stack<Vector3>();
                for(int i = 0; i < pathPoints.length; i++) {
                    // Transform to virtual reference system, where y is the altitude
                    Vector3 pose = new Vector3(pathPoints[i][0],-1,-pathPoints[i][1]);

                    Object3D point = new Cube(CUBE_SIDE_LENGTH); // default in case of parsing failure

                    double angle = 0.0;

                    if(i == pathPoints.length - 1) {
                        LoaderOBJ objParser = new LoaderOBJ(mContext.getResources(), mTextureManager, R.raw.destination);
                        try {
                            objParser.parse();
                            point = objParser.getParsedObject();
                        } catch (ParsingException e) {
                            e.printStackTrace();
                        }
                    } else {
                        LoaderOBJ objParser = new LoaderOBJ(mContext.getResources(), mTextureManager, R.raw.arrow);
                        try {
                            objParser.parse();
                            point = objParser.getParsedObject();
                            point.setScale(new Vector3(0.75, 0.75, 0.75));
                        } catch (ParsingException e) {
                            e.printStackTrace();
                        }

                        //Calculate the angle at which to rotate the arrow
                        double side1 = pathPoints[i][0] - pathPoints[i+1][0];
                        double side2 = pathPoints[i][1] - pathPoints[i+1][1];
                        double hypotenuse = Math.sqrt((side1*side1) + (side2*side2));

                        double theta = Math.asin(side1/hypotenuse);

                        angle = Math.toDegrees((Math.PI / 2) - theta) + 180;


                    }


                    point.setMaterial(material);
                    point.setPosition(pose);
                    point.setRotation(Vector3.Axis.Y, angle);

                            System.out.println("Adding checkpoint at " + pose);
                    getCurrentScene().addChild(point);
                    pathObjects.add(point);
                    stack.push(pose);
                }
                addLine(stack);
                pathObjectUpdated = false;

            }
        }

        super.onRender(elapsedRealTime, deltaTime);
    }

    /**
     * Save the updated plane fit pose to update the AR object on the next render pass.
     * This is synchronized against concurrent access in the render loop above.
     */
    public synchronized void updatePathObject(float[][] pathPoints) {
        pathObjectUpdated = true;
        this.pathPoints = pathPoints;
    }

    /**
     * Update the scene camera based on the provided pose in Tango start of service frame.
     * The device pose should match the pose of the device at the time the last rendered RGB
     * frame, which can be retrieved with this.getTimestamp();
     * <p/>
     * NOTE: This must be called from the OpenGL render thread - it is not thread safe.
     */
    public void updateRenderCameraPose(TangoPoseData devicePose, DeviceExtrinsics extrinsics) {
        Pose cameraPose = ScenePoseCalculator.toOpenGlCameraPose(devicePose, extrinsics);
        getCurrentCamera().setRotation(cameraPose.getOrientation());
        getCurrentCamera().setPosition(cameraPose.getPosition());
    }

    private void addLine(Stack<Vector3> stack) {
        Material lineMaterial = new Material();
        lineMaterial.setColor(Color.BLUE);
        line = new Line3D(stack, 500f);
        line.setMaterial(lineMaterial);
        getCurrentScene().addChild(line);
    }

    @Override
    public void onOffsetsChanged(float xOffset, float yOffset,
                                 float xOffsetStep, float yOffsetStep,
                                 int xPixelOffset, int yPixelOffset) {
    }

    @Override
    public void onTouchEvent(MotionEvent event) {

    }
}
