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

import org.rajawali3d.Object3D;
import org.rajawali3d.lights.DirectionalLight;
import org.rajawali3d.loader.LoaderOBJ;
import org.rajawali3d.loader.ParsingException;
import org.rajawali3d.materials.Material;
import org.rajawali3d.math.vector.Vector3;
import org.rajawali3d.primitives.Cube;
import org.rajawali3d.primitives.Line3D;

import java.util.ArrayList;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Stack;

import edu.stanford.navi.domain.Coordinate;
import edu.stanford.navi.domain.Item;

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

    private boolean destination;

    private List<Item> itemList;
    List<Object3D> itemObjects;

    //hardcoded category name to obj file name (cuz freezing the code soon)
    private HashMap<String, String> categoryOBJs;

    public AugmentedRealityRenderer(Context context) {
        super(context);
    }

    @Override
    protected void initScene() {
        // Remember to call super.initScene() to allow TangoRajawaliArRenderer
        // to be set-up.
        super.initScene();

        categoryOBJs = new HashMap<String, String>();

        categoryOBJs.put("On Sale", "sale");
        categoryOBJs.put("Enterprise and public policy", "one");
        categoryOBJs.put("Research", "two");
        categoryOBJs.put("Consumer", "three");
        categoryOBJs.put("Hardware", "four");
        categoryOBJs.put("Mixed reality", "five");
        categoryOBJs.put("Welcome area", "six");
        categoryOBJs.put("Arcade", "seven");
        categoryOBJs.put("Education", "eight");
        categoryOBJs.put("Judges' area", "nine");
        categoryOBJs.put("Health and biotech", "ten");
        categoryOBJs.put("Consumer", "eleven");

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

    }

    @Override
    protected void onRender(long elapsedRealTime, double deltaTime) {
        // Update the AR object if necessary
        // Synchronize against concurrent access with the setter below.
        synchronized (this) {

            //Renderering filter icons

            if(itemObjects == null && itemList != null) {
                itemObjects = new ArrayList<Object3D>();
                for(int i = 0; i < itemList.size(); i++) {
                    Item item = itemList.get(i);

                    if(item.getCategories().size() == 0) {
                        continue;
                    }

                    Object3D icon = new Cube(CUBE_SIDE_LENGTH);

                    Object[] categories = item.getCategories().toArray();
                    String name = categoryOBJs.get(categories[0]) + "_obj";

                    int id = mContext.getResources().getIdentifier(name, "raw", getContext().getPackageName());
                    LoaderOBJ iconObjParser = new LoaderOBJ(mContext.getResources(), mTextureManager, id);

                    try {
                        iconObjParser.parse();
                        icon = iconObjParser.getParsedObject();
                    } catch (ParsingException e) {
                        e.printStackTrace();
                    }

                    icon.setPosition(item.getCoord3D().getX(), 1.0, -item.getCoord3D().getY());
                    itemObjects.add(icon);
                    getCurrentScene().addChild(icon);

                    System.out.println("Added icon at: " + item.getCoord3D().getX() + ", " + item.getCoord3D().getY());

                }
            }

            if(itemObjects != null) {
                for (int i = 0; i < itemObjects.size(); i++) {
                    Object3D icon = itemObjects.get(i);
                    icon.rotate(Vector3.Axis.Y, 1);
                }
            }

            //Renderering path

            if (pathObjectUpdated) {
                if(pathObjects != null) {
                    for(int i = 0; i < pathObjects.size(); i++) {
                        getCurrentScene().removeChild(pathObjects.get(i));
                    }
                    //getCurrentScene().removeChild(line);
                }

                pathObjects = new ArrayList<Object3D>();
                //Stack<Vector3> stack = new Stack<Vector3>();

                for(int i = 0; i < pathPoints.length; i++) {
                    // Transform to virtual reference system, where y is the altitude
                    Vector3 pose = new Vector3(pathPoints[i][0], -1, -pathPoints[i][1]);

                    Object3D point = new Cube(CUBE_SIDE_LENGTH); // default in case of parsing failure

                    double angle = 0.0;

                    if (i == pathPoints.length - 1 && this.destination) {
                        LoaderOBJ objParser = new LoaderOBJ(mContext.getResources(), mTextureManager, R.raw.destination_obj);
                        try {
                            objParser.parse();
                            point = objParser.getParsedObject();
                        } catch (ParsingException e) {
                            e.printStackTrace();
                        }
                    } else if (i < pathPoints.length - 1) {
                        LoaderOBJ objParser = new LoaderOBJ(mContext.getResources(), mTextureManager, R.raw.arrow_obj);
                        try {
                            objParser.parse();
                            point = objParser.getParsedObject();
                            point.setScale(0.5);
                        } catch (ParsingException e) {
                            e.printStackTrace();
                        }

                        // Calculate the angle at which to rotate the arrow
                        double side1 = (double) (pathPoints[i + 1][0] - pathPoints[i][0]);
                        double side2 = (double) (pathPoints[i + 1][1] - pathPoints[i][1]);
                        double hypotenuse = Math.sqrt((side1 * side1) + (side2 * side2));

                        double theta = Math.asin(Math.abs(side2) / hypotenuse); // -pi to pi
                        if (side1 > 0 && side2 < 0) {
                            angle = theta/Math.PI*180;
                        } else if (side1 < 0 && side2 < 0) {
                            angle = 180-theta/Math.PI*180;
                        } else if (side1 < 0 && side2 > 0) {
                            angle = 180+theta/Math.PI*180;
                        } else { // side1 > 0 && side2 > 0)
                            angle = 360-theta/Math.PI*180;
                        }

                        /* In case one of them breaks
                        double side1 = (double)(pathPoints[i+1][0] - pathPoints[i][0]);
                        double side2 = -(double)(pathPoints[i+1][1] - pathPoints[i][1]);
                        double hypotenuse = Math.sqrt((side1 * side1) + (side2 * side2));
                        double theta = Math.asin(side2/hypotenuse); // -pi to pi
                        if(side1 > 0) {
                            angle = theta / Math.PI * 180; // 0 to 360
                        }else {
                            angle = 180 - theta / Math.PI * 180;
                        }
                        */
                    } else {
                        continue;
                    }

                    point.setPosition(pose);
                    point.setRotation(Vector3.Axis.Y, angle);

                    System.out.println("Adding checkpoint at " + pose);
                    getCurrentScene().addChild(point);
                    pathObjects.add(point);
                    //stack.push(pose);
                }

                //addLine(stack);
                pathObjectUpdated = false;

            }
        }

        super.onRender(elapsedRealTime, deltaTime);
    }

    /**
     * Save the updated plane fit pose to update the AR object on the next render pass.
     * This is synchronized against concurrent access in the render loop above.
     */
    public synchronized void updatePathObject(float[][] pathPoints, boolean isDestination) {
        pathObjectUpdated = true;
        this.pathPoints = pathPoints;
        this.destination = isDestination;
    }

    public synchronized void updateFilterIcons(List<Item> itemList) {
        this.itemList = itemList;
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
