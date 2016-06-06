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

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Point;
import android.graphics.Typeface;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.FrameLayout.LayoutParams;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import com.google.atap.tango.ux.TangoUx;
import com.google.atap.tango.ux.TangoUx.StartParams;
import com.google.atap.tango.ux.TangoUxLayout;
import com.google.atap.tango.ux.UxExceptionEvent;
import com.google.atap.tango.ux.UxExceptionEventListener;
import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.Tango.OnTangoUpdateListener;
import com.google.atap.tangoservice.TangoCameraIntrinsics;
import com.google.atap.tangoservice.TangoConfig;
import com.google.atap.tangoservice.TangoCoordinateFramePair;
import com.google.atap.tangoservice.TangoErrorException;
import com.google.atap.tangoservice.TangoEvent;
import com.google.atap.tangoservice.TangoInvalidException;
import com.google.atap.tangoservice.TangoOutOfDateException;
import com.google.atap.tangoservice.TangoPoseData;
import com.google.atap.tangoservice.TangoXyzIjData;

import com.projecttango.rajawali.DeviceExtrinsics;
import com.projecttango.rajawali.ar.TangoRajawaliView;
import org.rajawali3d.scene.ASceneFrameCallback;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import edu.stanford.navi.map.Map2D;

public class MapActivity extends BaseActivity implements View.OnClickListener, OnItemClickListener {

    private static final String TAG = MapActivity.class.getSimpleName();
    private static final int SECS_TO_MILLISECS = 1000;
    private static final double UPDATE_INTERVAL_MS = 100.0;

    private Tango mTango;
    private TangoConfig mConfig;
    private boolean mIsRelocalized = false;
    private AtomicBoolean mIsConnected = new AtomicBoolean(false);

    private final Object mSharedLock = new Object();
    private double mPreviousPoseTimeStamp;
    private double mTimeToNextUpdate = UPDATE_INTERVAL_MS;

    private String mSelectedUUID;
    private boolean mIsConstantSpaceRelocalize;
    private ImageView imageView;
    private TextView textView;
    private ListView listOfRooms;
    private TextView localize_text;
    private RelativeLayout arView;
    private boolean isNavigation = false;

    // UX
    TangoUx mTangoUx;
    TangoUxLayout mTangoUxLayout;

    //2D Map
    private Map2D map2D;
    private Point screenSize;
    private int count;
    private int countDots;
    private float []worldCoor = {0, 0};
    float []imgCoorDestimation;
    float []imgCoorCurrent;
    FrameLayout.LayoutParams params_localizing;
    FrameLayout.LayoutParams params_localized;

    // AR & camera
    private TangoRajawaliView mARView;
    private AugmentedRealityRenderer mARRenderer;
    private DeviceExtrinsics mExtrinsics;
    private double mCameraPoseTimestamp = 0;

    private int position;
    TextView navigateBtn;

    // Instruction
    private boolean hasShownInstruction = false;
    AlertDialog.Builder builder;
    AlertDialog alert;

    public void setUpDialog() {
        System.out.println("SetupDialog!");
        builder = new AlertDialog.Builder(this);
        builder.setTitle(R.string.dialog_title)
                .setMessage(R.string.instruction)
                .setCancelable(false)
                .setPositiveButton("Got it!", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        // fire an intent go to your next activity
                        dialog.cancel();
                    }
                });
        alert = builder.create();
    }

    public void onItemClick(AdapterView<?> parentView, View v, int pos, long id) {
        Log.d(TAG, "Item selected with position: " + position);
        position = pos;
        if (navigateBtn.isEnabled() == false) {
            navigateBtn.setEnabled(true);
            navigateBtn.setAlpha(1.0f);
        }

        imgCoorDestimation = map2D.getKeypoint(position);

        if (!mIsRelocalized) {
            imgCoorCurrent = new float[] {100, 100};
        }

        long startTime = System.currentTimeMillis();
        map2D.computeAndDrawPath((int) imgCoorCurrent[0], (int) imgCoorCurrent[1], position);
        long endTime = System.currentTimeMillis();
        System.out.println("That took " + (endTime - startTime) + " milliseconds");
        map2D.drawCurLoc((int) imgCoorCurrent[0], (int) imgCoorCurrent[1], position);

        imageView = (ImageView) findViewById(R.id.imageView);
        imageView.setImageBitmap(map2D.imgBmp);

        textView = (TextView) findViewById(R.id.textView);
        textView.setText("Navigating to " + map2D.getKeypointName(position));
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        textView.setTypeface(face);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mSelectedUUID = getIntent().getStringExtra(OwnerStartActivity.ADF_UUID);

        setContentView(R.layout.map);
        setupTangoUX();
        setupTango();
        setUpDialog();

        // Set instruction font to Avenir
        TextView selectRoomInstruction = (TextView) findViewById(R.id.selectRoomInstruction);

        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        selectRoomInstruction.setTypeface(face);

        setupARViewAndRenderer(R.id.ar_view);

        final Context context = this;
        navigateBtn = (TextView) findViewById(R.id.navigate);
        navigateBtn.setTypeface(face);
        navigateBtn.setEnabled(false);
        navigateBtn.setAlpha(.5f);
        navigateBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                arView = (RelativeLayout) findViewById(R.id.ar_view);
                imageView = (ImageView) findViewById(R.id.imageView);
                FrameLayout.LayoutParams params1 = (FrameLayout.LayoutParams) arView.getLayoutParams();
                FrameLayout.LayoutParams params2 = (FrameLayout.LayoutParams) imageView.getLayoutParams();
                final float scale = getResources().getDisplayMetrics().density;

                if (!isNavigation) {
                    isNavigation = true;

                    params1.height = (int)(400*scale + 0.5f);
                    params1.width = (int)(610*scale + 0.5f);
                    params1.topMargin = (int)(100*scale + 0.5f);
                    params1.leftMargin = (int)(340*scale + 0.5f);

                    params2.height = (int)(80*scale + 0.5f);
                    params2.width = (int)(80*scale + 0.5f);
                    params2.topMargin = (int)(470*scale + 0.5f);
                    params2.leftMargin = (int)(10*scale + 0.5f);

                    alert.show();
                } else {
                    isNavigation = false;
                    params1.height = (int)(80*scale + 0.5f);
                    params1.width = (int)(80*scale + 0.5f);
                    params1.topMargin = (int)(470*scale + 0.5f);
                    params1.leftMargin = (int)(10*scale + 0.5f);

                    params2.height = FrameLayout.LayoutParams.MATCH_PARENT;
                    params2.width = FrameLayout.LayoutParams.MATCH_PARENT;
                    params2.topMargin = (int)(40*scale + 0.5f);
                    params2.leftMargin = (int)(360*scale + 0.5f);
                }
                arView.setLayoutParams(params1);
                imageView.setLayoutParams(params2);
            }
        });

        count = 0;
        countDots = 0;

        params_localizing = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        params_localizing.gravity = Gravity.CENTER_VERTICAL;
        params_localized = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        params_localized.gravity = Gravity.BOTTOM;
    }

    @Override
    /**
     * Bug found in some when toolbar is half-way collapsed and a touch is made on image (some phones only)
     */
    public boolean dispatchTouchEvent(MotionEvent ev) {
        try {
            return super.dispatchTouchEvent(ev);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            if (mIsConnected.compareAndSet(true, false)) {
                mARRenderer.getCurrentScene().clearFrameCallbacks();
                mARView.disconnectCamera();
                mTango.disconnect();
                mTangoUx.stop();
            }
        } catch (TangoErrorException e) {
            Toast.makeText(getApplicationContext(), R.string.tango_error, Toast.LENGTH_SHORT)
                    .show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        // Clear the relocalization state: we don't know where the device has been since our app
        // was paused.
        mIsRelocalized = false;

        // Re-attach listeners.
        try {
            setUpTangoListeners();
        } catch (TangoErrorException e) {
            Toast.makeText(getApplicationContext(), R.string.tango_error, Toast.LENGTH_SHORT)
                    .show();
        } catch (SecurityException e) {
            Toast.makeText(getApplicationContext(), R.string.no_permissions, Toast.LENGTH_SHORT)
                    .show();
        }

        // Connect to the tango service (start receiving pose updates).
        if (mIsConnected.compareAndSet(false, true)) {
            try {
                mTangoUx.start(new StartParams());
                mTango.connect(mConfig);
                mExtrinsics = setupExtrinsics(mTango);
                connectARRenderer();
            } catch (TangoOutOfDateException e) {
                Toast.makeText(getApplicationContext(), R.string.tango_out_of_date_exception, Toast
                        .LENGTH_SHORT).show();
            } catch (TangoErrorException e) {
                Toast.makeText(getApplicationContext(), R.string.tango_error, Toast.LENGTH_SHORT)
                        .show();
            } catch (TangoInvalidException e) {
                Toast.makeText(getApplicationContext(), R.string.tango_invalid, Toast.LENGTH_SHORT)
                        .show();
            }
        }

        // OpenCV
        System.out.println("\n\nOn Resume\n\n");
        Display display = getWindowManager().getDefaultDisplay();
        screenSize = new Point();
        display.getSize(screenSize);
        OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_1_0, this, mLoaderCallback);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    /**
     * Listens for click events from any button in the view.
     */
    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            default:
                Log.w(TAG, "Unknown button click");
                return;
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return true;
    }

    private void setupARViewAndRenderer(int id) {
        mARView = new TangoRajawaliView(this);
        mARRenderer = new AugmentedRealityRenderer(this);
        mARView.setSurfaceRenderer(mARRenderer);

        RelativeLayout layout = (RelativeLayout) findViewById(id);
        layout.addView(mARView);
    }

    private void setupTangoUX () {
        mTangoUx = new TangoUx(this);
        mTangoUxLayout = (TangoUxLayout) findViewById(R.id.layout_tango);
        mTangoUx.setLayout(mTangoUxLayout);
        mTangoUx.setUxExceptionEventListener(new UxExceptionEventListener() {
            @Override
            public void onUxExceptionEvent(UxExceptionEvent uxExceptionEvent) {
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_LYING_ON_SURFACE) {
                    Log.i(TAG, "Device lying on surface ");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_FEW_DEPTH_POINTS) {
                    Log.i(TAG, "Very few depth points in mPoint cloud ");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_FEW_FEATURES) {
                    Log.i(TAG, "Invalid poses in MotionTracking ");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_INCOMPATIBLE_VM) {
                    Log.i(TAG, "Device not running on ART");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_MOTION_TRACK_INVALID) {
                    Log.i(TAG, "Invalid poses in MotionTracking ");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_MOVING_TOO_FAST) {
                    Log.i(TAG, "Invalid poses in MotionTracking ");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_OVER_EXPOSED) {
                    Log.i(TAG, "Camera Over Exposed");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_TANGO_SERVICE_NOT_RESPONDING) {
                    Log.i(TAG, "TangoService is not responding ");
                }
                if (uxExceptionEvent.getType() == UxExceptionEvent.TYPE_UNDER_EXPOSED) {
                    Log.i(TAG, "Camera Under Exposed ");
                }

            }
        });
    }

    private void setupTango () {
        Intent intent = getIntent();
        mIsConstantSpaceRelocalize = intent.getBooleanExtra(Homepage.LOAD_ADF, false);
        mSelectedUUID = intent.getStringExtra(ADF_UUID);

        mTango = new Tango(this);
        mConfig = setTangoConfig(mTango, mIsConstantSpaceRelocalize);
        setupTextViewsAndButtons(mConfig, mTango, mIsConstantSpaceRelocalize);
    }

    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            if (status == LoaderCallbackInterface.SUCCESS) {
                initNaviPanel();
            } else {
                super.onManagerConnected(status);
            }
        }
    };

    private void initNaviPanel() {
        map2D = new Map2D(this, screenSize.x, screenSize.y);
        map2D.drawKeyPoints();
        imageView = (ImageView) findViewById(R.id.imageView);
        imageView.setImageBitmap(map2D.imgBmp);

        listOfRooms = (ListView) findViewById(R.id.listOfRoomNames);
        listOfRooms.setChoiceMode(ListView.CHOICE_MODE_SINGLE);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, map2D.getKeypointsNames());
        listOfRooms.setAdapter(adapter);
        listOfRooms.setOnItemClickListener(this);
    }

    /**
     * Sets Texts views to display statistics of Poses being received. This also sets the buttons
     * used in the UI. Please note that this needs to be called after TangoService and Config
     * objects are initialized since we use them for the SDK related stuff like version number
     * etc.
     */
    private void setupTextViewsAndButtons(TangoConfig config, Tango tango, boolean isLoadAdf) {

    }

    /**
     * Sets up the tango configuration object. Make sure mTango object is initialized before
     * making this call.
     */
    private TangoConfig setTangoConfig(Tango tango, boolean isLoadAdf) {
        TangoConfig config = new TangoConfig();
        config = tango.getConfig(TangoConfig.CONFIG_TYPE_DEFAULT);
        // NOTE: Low latency integration is necessary to achieve a precise alignment of
        // virtual objects with the RBG image and produce a good AR effect.
        config.putBoolean(TangoConfig.KEY_BOOLEAN_LOWLATENCYIMUINTEGRATION, true);
        config.putBoolean(TangoConfig.KEY_BOOLEAN_DEPTH, true);
        config.putBoolean(TangoConfig.KEY_BOOLEAN_COLORCAMERA, true);
        config.putString(TangoConfig.KEY_STRING_AREADESCRIPTION, mSelectedUUID);

        // Check for Load ADF/Constant Space relocalization mode
        if (isLoadAdf) {
            if (mSelectedUUID != null) {
                config.putString(TangoConfig.KEY_STRING_AREADESCRIPTION, mSelectedUUID);
            }
        }
        return config;
    }

    /**
     * Set up the callback listeners for the Tango service, then begin using the Motion
     * Tracking API. This is called in response to the user clicking the 'Start' Button.
     */
    private void setUpTangoListeners() {

        // Set Tango Listeners for Poses Device wrt Start of Service, Device wrt
        // ADF and Start of Service wrt ADF
        ArrayList<TangoCoordinateFramePair> framePairs = new ArrayList<TangoCoordinateFramePair>();
        framePairs.add(new TangoCoordinateFramePair(
                TangoPoseData.COORDINATE_FRAME_START_OF_SERVICE,
                TangoPoseData.COORDINATE_FRAME_DEVICE));
        framePairs.add(new TangoCoordinateFramePair(
                TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION,
                TangoPoseData.COORDINATE_FRAME_DEVICE));
        framePairs.add(new TangoCoordinateFramePair(
                TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION,
                TangoPoseData.COORDINATE_FRAME_START_OF_SERVICE));

        mTango.connectListener(framePairs, new OnTangoUpdateListener() {
            @Override
            public void onXyzIjAvailable(TangoXyzIjData xyzij) {
                // Not using XyzIj data for this sample
                if (mTangoUx != null) {
                    mTangoUx.updateXyzCount(xyzij.xyzCount);
                }
            }

            // Listen to Tango Events
            @Override
            public void onTangoEvent(final TangoEvent event) {
                if (mTangoUx != null) {
                    mTangoUx.updateTangoEvent(event);
                }
            }

            @Override
            public void onPoseAvailable(final TangoPoseData pose) {
                boolean updateRenderer = false;
                // Make sure to have atomic access to Tango Data so that
                // UI loop doesn't interfere while Pose call back is updating
                // the data.

                if (mTangoUx != null) {
                    mTangoUx.updatePoseStatus(pose.statusCode);
//                    System.out.println("coor0: " + pose.toString());
                }

                if (mIsConstantSpaceRelocalize) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            // Display pose data on screen in TextViews
                            if (mIsRelocalized && pose.baseFrame == TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION
                                    && pose.targetFrame == TangoPoseData.COORDINATE_FRAME_DEVICE) {
                            }
                            //System.out.println("coor0: " + pose.toString());
                        }
                    });
                }

                synchronized (mSharedLock) {
                    // Check for Device wrt ADF pose, Device wrt Start of Service pose,
                    // Start of Service wrt ADF pose (This pose determines if the device
                    // is relocalized or not).

                    if (pose.baseFrame == TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION
                            && pose.targetFrame == TangoPoseData.COORDINATE_FRAME_DEVICE) {

                        if (mIsRelocalized) {
                            updateRenderer = true;
                            worldCoor[0] = (float)pose.translation[0];
                            worldCoor[1] = (float)pose.translation[1];
                            imgCoorCurrent = map2D.world2img(worldCoor[0], worldCoor[1]);
                        }
                    } else if (pose.baseFrame == TangoPoseData.COORDINATE_FRAME_START_OF_SERVICE
                            && pose.targetFrame == TangoPoseData.COORDINATE_FRAME_DEVICE) {
                        if (!mIsRelocalized) {
                            updateRenderer = true;
                        }

                    } else if (pose.baseFrame == TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION
                            && pose.targetFrame == TangoPoseData
                            .COORDINATE_FRAME_START_OF_SERVICE) {
                        if (pose.statusCode == TangoPoseData.POSE_VALID) {
                            mIsRelocalized = true;
                            // Set the color to green
                        } else {
                            mIsRelocalized = false;
                            // Set the color blue
                        }
                    }
                }

                final double deltaTime = (pose.timestamp - mPreviousPoseTimeStamp) *
                        SECS_TO_MILLISECS;
                mPreviousPoseTimeStamp = pose.timestamp;
                mTimeToNextUpdate -= deltaTime;

                if (mTimeToNextUpdate < 0.0) {
                    mTimeToNextUpdate = UPDATE_INTERVAL_MS;
                }

                if (updateRenderer) {
                    count++;
                    if (count > 50) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (mIsRelocalized) {
                                    float minDist = map2D.drawCurLoc((int) imgCoorCurrent[0], (int) imgCoorCurrent[1], position);
                                    imageView.setImageBitmap(map2D.imgBmp);
                                    localize_text = (TextView) findViewById(R.id.localize_text);
                                    localize_text.setTextSize(20.0f);
                                    localize_text.setPadding(5, 5, 5, 5);
                                    localize_text.setLayoutParams(params_localized);
                                    localize_text.setText("[" + String.format("%.2f", worldCoor[0]) +
                                            ", " + String.format("%.2f", worldCoor[1]) + "], minDist: " +
                                            String.format("%.2f", minDist) + "/" + String.format("%.2f", map2D.minDistThres));
                                } else {
                                    countDots++;
                                    localize_text = (TextView) findViewById(R.id.localize_text);
                                    localize_text.setTextSize(60.0f);
                                    localize_text.setPadding(20, 20, 20, 20);
                                    localize_text.setLayoutParams(params_localizing);

                                    if (countDots%3 == 0) {
                                        localize_text.setText("Localizing.");
                                    } else if (countDots%3 == 1) {
                                        localize_text.setText("Localizing..");
                                    } else if (countDots%3 == 2) {
                                        localize_text.setText("Localizing...");
                                    }
                                }
                            }
                        });
                        count = 0;
                    }
                }
            }

            @Override
            public void onFrameAvailable(int cameraId) {
                if (cameraId == TangoCameraIntrinsics.TANGO_CAMERA_COLOR) {
                    mARView.onFrameAvailable();
                }
            }
        });
    }

    /**
     * Calculates and stores the fixed transformations between the device and
     * the various sensors to be used later for transformations between frames.
     */
    private static DeviceExtrinsics setupExtrinsics(Tango tango) {
        // Create camera to IMU transform.
        TangoCoordinateFramePair framePair = new TangoCoordinateFramePair();
        framePair.baseFrame = TangoPoseData.COORDINATE_FRAME_IMU;
        framePair.targetFrame = TangoPoseData.COORDINATE_FRAME_CAMERA_COLOR;
        TangoPoseData imuTrgbPose = tango.getPoseAtTime(0.0, framePair);

        // Create device to IMU transform.
        framePair.targetFrame = TangoPoseData.COORDINATE_FRAME_DEVICE;
        TangoPoseData imuTdevicePose = tango.getPoseAtTime(0.0, framePair);

        // Create depth camera to IMU transform.
        framePair.targetFrame = TangoPoseData.COORDINATE_FRAME_CAMERA_DEPTH;
        TangoPoseData imuTdepthPose = tango.getPoseAtTime(0.0, framePair);

        return new DeviceExtrinsics(imuTdevicePose, imuTrgbPose, imuTdepthPose);
    }

    /**
     * Connects the view and renderer to the color camara and callbacks.
     */
    private void connectARRenderer() {
        // Connect to color camera.
        mARView.connectToTangoCamera(mTango, TangoCameraIntrinsics.TANGO_CAMERA_COLOR);

        // Register a Rajawali Scene Frame Callback to update the scene camera pose whenever a new
        // RGB frame is rendered.
        // (@see https://github.com/Rajawali/Rajawali/wiki/Scene-Frame-Callbacks)
        mARRenderer.getCurrentScene().registerFrameCallback(new ASceneFrameCallback() {
            @Override
            public void onPreFrame(long sceneTime, double deltaTime) {
                if (!mIsConnected.get()) {
                    return;
                }
                // NOTE: This is called from the OpenGL render thread, after all the renderer
                // onRender callbacks had a chance to run and before scene objects are rendered
                // into the scene.

                // Note that the TangoRajwaliRenderer will update the RGB frame to the background
                // texture and update the RGB timestamp before this callback is executed.

                // If a new RGB frame has been rendered, update the camera pose to match.
                // NOTE: This doesn't need to be synchronized since the renderer provided timestamp
                // is also set in this same OpenGL thread.
                double rgbTimestamp = mARRenderer.getTimestamp();
                if (rgbTimestamp > mCameraPoseTimestamp) {
                    // Calculate the device pose at the camera frame update time.
                    TangoPoseData lastFramePose = mTango.getPoseAtTime(rgbTimestamp, new TangoCoordinateFramePair(
                            TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION,
                            TangoPoseData.COORDINATE_FRAME_DEVICE));
                    if (lastFramePose.statusCode == TangoPoseData.POSE_VALID) {
                        if (mIsRelocalized == false) {
                            Log.d(TAG, "Navigation view has localized. ");
                            // mARRenderer.updatePathObject(path);
                            mIsRelocalized = true;
                        }
                        // Update the camera pose from the renderer
                        mARRenderer.updateRenderCameraPose(lastFramePose, mExtrinsics);
                        mCameraPoseTimestamp = lastFramePose.timestamp;
                    }
                }
            }

            @Override
            public void onPreDraw(long sceneTime, double deltaTime) {

            }

            @Override
            public void onPostFrame(long sceneTime, double deltaTime) {

            }

            @Override
            public boolean callPreFrame() {
                return true;
            }
        });

    }
}
