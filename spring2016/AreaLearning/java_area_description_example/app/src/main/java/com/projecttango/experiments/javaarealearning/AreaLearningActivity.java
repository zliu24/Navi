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

package com.projecttango.experiments.javaarealearning;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.Tango.OnTangoUpdateListener;
import com.google.atap.tangoservice.TangoCameraIntrinsics;
import com.google.atap.tangoservice.TangoCameraPreview;
import com.google.atap.tangoservice.TangoConfig;
import com.google.atap.tangoservice.TangoCoordinateFramePair;
import com.google.atap.tangoservice.TangoErrorException;
import com.google.atap.tangoservice.TangoEvent;
import com.google.atap.tangoservice.TangoInvalidException;
import com.google.atap.tangoservice.TangoOutOfDateException;
import com.google.atap.tangoservice.TangoPoseData;
import com.google.atap.tangoservice.TangoXyzIjData;
import com.projecttango.rajawali.ar.TangoRajawaliView;

import android.app.Activity;
import android.app.FragmentManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.AdapterView.OnItemSelectedListener;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;
import org.rajawali3d.surface.IRajawaliSurface;
import org.rajawali3d.surface.RajawaliSurfaceView;
import org.w3c.dom.Text;

import java.text.DecimalFormat;
import java.util.ArrayList;

import com.projecttango.experiments.javaarealearning.map.Map2D;

/**
 * Main Activity class for the Area Description example. Handles the connection to the Tango service
 * and propagation of Tango pose data to OpenGL and Layout views. OpenGL rendering logic is
 * delegated to the {@link AreaLearningRajawaliRenderer} class.
 */
public class AreaLearningActivity extends Activity implements View.OnClickListener,
        SetADFNameDialog.CallbackListener, SaveAdfTask.SaveAdfListener, OnItemSelectedListener {

    private static final String TAG = AreaLearningActivity.class.getSimpleName();
    private static final int SECS_TO_MILLISECS = 1000;
    private Tango mTango;
    private TangoConfig mConfig;
    private TextView mUuidTextView;
    private CharSequence mUuidTextViewCopy;
    private TextView mRelocalizationTextView;

    private Button mSaveAdfButton;
    private Button mFirstPersonButton;
    private Button mThirdPersonButton;
    private Button mTopDownButton;

    private double mPreviousPoseTimeStamp;
    private double mTimeToNextUpdate = UPDATE_INTERVAL_MS;

    private boolean mIsRelocalized;
    private boolean mIsLearningMode;
    private String mSelectedUUID;
    private String mSelectedADFName;

    private boolean mIsConstantSpaceRelocalize;
    private boolean mIsConnected;

    private ImageView imageView;
    private TextView textView;
    private Spinner spinner;

    private AreaLearningRajawaliRenderer mRenderer;

    // Video Overlay
    private TangoCameraPreview tangoCameraPreview;

    // Long-running task to save the ADF.
    private SaveAdfTask mSaveAdfTask;

    private static final double UPDATE_INTERVAL_MS = 100.0;
    private static final DecimalFormat FORMAT_THREE_DECIMAL = new DecimalFormat("00.000");

    private final Object mSharedLock = new Object();

    private Map2D map2D;
    private Point screenSize;
    private int count;
    private float []worldCoor;

    public void onItemSelected(AdapterView<?> parentView, View v, int position, long id) {
        System.out.println("fuc yeah: " + position);

        float []bmpCoor = map2D.map2bmp((float) map2D.points.get(position).x, (float) map2D.points.get(position).y);

        Bitmap curBmp = map2D.imgBmp.copy(Bitmap.Config.ARGB_8888, true);
        Canvas canvas = new Canvas(curBmp);

        Paint paint = new Paint();
        paint.setColor(Color.GREEN);
        paint.setStyle(Paint.Style.FILL);
        canvas.drawCircle(bmpCoor[0], bmpCoor[1], 40, paint);

        if (mIsRelocalized) {
            paint.setColor(Color.BLUE);
            long startTime = System.currentTimeMillis();
            float []curMapCoor = map2D.world2map(worldCoor[0], worldCoor[1]);
            int[][] mapPath = map2D.computePath((int)curMapCoor[0], (int)curMapCoor[1], position);
            long endTime = System.currentTimeMillis();
            System.out.println("That took " + (endTime - startTime) + " milliseconds");
            float[][] bmpPath = map2D.map2bmp(mapPath);
            for (int i = 0; i < mapPath.length-1; i++) {
                canvas.drawLine(bmpPath[i][0], bmpPath[i][1], bmpPath[i+1][0], bmpPath[i+1][1], paint);
            }
        }
        imageView.setImageBitmap(curBmp);
    }

    public void onNothingSelected(AdapterView<?> parentView){
        System.out.println("fuc no!");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        tangoCameraPreview = new TangoCameraPreview(this);
        LinearLayout layout = (LinearLayout) LayoutInflater.from(this).inflate(R.layout.activity_area_learning, null, false);
        layout.addView(tangoCameraPreview);

        setContentView(layout);

        Intent intent = getIntent();
        mIsLearningMode = intent.getBooleanExtra(ALStartActivity.USE_AREA_LEARNING, false);
        mIsConstantSpaceRelocalize = intent.getBooleanExtra(ALStartActivity.LOAD_ADF, false);
        mSelectedUUID = intent.getStringExtra(ALStartActivity.ADF_UUID);
        mSelectedADFName = intent.getStringExtra(ALStartActivity.ADF_NAME);

        // Instantiate the Tango service
        mTango = new Tango(this);
        mIsRelocalized = false;
        mConfig = setTangoConfig(mTango, mIsLearningMode, mIsConstantSpaceRelocalize);
        setupTextViewsAndButtons(mConfig, mTango, mIsLearningMode, mIsConstantSpaceRelocalize);

        // Configure OpenGL renderer
        mRenderer = setupGLViewAndRenderer();

        count = 0;
    }

    /**
     * Implements SetADFNameDialog.CallbackListener.
     */
    @Override
    public void onAdfNameOk(String name, String uuid) {
        saveAdf(name);
    }

    /**
     * Implements SetADFNameDialog.CallbackListener.
     */
    @Override
    public void onAdfNameCancelled() {
        // Continue running.
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            mTango.disconnect();
            if (mIsConnected) {
                tangoCameraPreview.disconnectFromTangoCamera();
                mIsConnected = false;
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
        try {
            tangoCameraPreview.connectToTangoCamera(mTango,
                    TangoCameraIntrinsics.TANGO_CAMERA_COLOR);
            mTango.connect(mConfig);
            if (!mIsConnected) {
                mIsConnected = true;
            }
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

        // OpenCV
        System.out.println("\n\nOn Resume\n\n");
        Display display = getWindowManager().getDefaultDisplay();
        screenSize = new Point();
        display.getSize(screenSize);
        OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_1_0, this, mLoaderCallback);
    }

    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            if (status == LoaderCallbackInterface.SUCCESS) {
                helloWorld();
            } else {
                super.onManagerConnected(status);
            }
        }
    };

    private void helloWorld() {
        int start = 0;
        int end = 1;

        map2D = new Map2D(this, screenSize.x, screenSize.y);

        //map2D.computePath(start, end);
        map2D.updateBmp();

        imageView = (ImageView) findViewById(R.id.imageView);
        imageView.setImageBitmap(map2D.imgBmp);

        textView = (TextView) findViewById(R.id.textView);
        textView.setText("Navigation from " + map2D.getLocation(start) + " to " + map2D.getLocation(end));

        spinner = (Spinner) findViewById(R.id.spinner);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, map2D.getLocations());
        spinner.setAdapter(adapter);
        spinner.setOnItemSelectedListener(this);
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
            case R.id.first_person_button:
                mRenderer.setFirstPersonView();
                break;
            case R.id.top_down_button:
                mRenderer.setTopDownView();
                break;
            case R.id.third_person_button:
                mRenderer.setThirdPersonView();
                break;
            case R.id.save_adf_button:
                // Query the user for an ADF name and save if OK was clicked.
                showSetADFNameDialog();
                break;
            default:
                Log.w(TAG, "Unknown button click");
                return;
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        mRenderer.onTouchEvent(event);
        return true;
    }

    /**
     * Sets Rajawalisurface view and its renderer. This is ideally called only once in onCreate.
     */
    private AreaLearningRajawaliRenderer setupGLViewAndRenderer() {
        // Configure OpenGL renderer
        AreaLearningRajawaliRenderer renderer = new AreaLearningRajawaliRenderer(this);
        // OpenGL view where all of the graphics are drawn
        RajawaliSurfaceView glView = (RajawaliSurfaceView) findViewById(R.id.gl_surface_view);
        glView.setEGLContextClientVersion(2);
        glView.setRenderMode(IRajawaliSurface.RENDERMODE_CONTINUOUSLY);
        glView.setSurfaceRenderer(renderer);
        return renderer;
    }

    /**
     * Sets Texts views to display statistics of Poses being received. This also sets the buttons
     * used in the UI. Please note that this needs to be called after TangoService and Config
     * objects are initialized since we use them for the SDK related stuff like version number
     * etc.
     */
    private void setupTextViewsAndButtons(TangoConfig config, Tango tango, boolean
            isLearningMode, boolean isLoadAdf) {

        mFirstPersonButton = (Button) findViewById(R.id.first_person_button);
        mThirdPersonButton = (Button) findViewById(R.id.third_person_button);
        mTopDownButton = (Button) findViewById(R.id.top_down_button);

        mSaveAdfButton = (Button) findViewById(R.id.save_adf_button);
        mUuidTextView = (TextView) findViewById(R.id.adf_uuid_textview);
        mRelocalizationTextView = (TextView) findViewById(R.id.relocalization_textview);

        // Set up button click listeners and button state.
        mFirstPersonButton.setOnClickListener(this);
        mThirdPersonButton.setOnClickListener(this);
        mTopDownButton.setOnClickListener(this);

        if (isLearningMode) {
            // Disable save ADF button until Tango relocalizes to the current ADF.
            mSaveAdfButton.setEnabled(false);
            mSaveAdfButton.setOnClickListener(this);
        } else {
            // Hide to save ADF button if leanring mode is off.
            mSaveAdfButton.setVisibility(View.GONE);
        }

        if (isLoadAdf) {
            ArrayList<String> fullUUIDList = new ArrayList<String>();
            // Returns a list of ADFs with their UUIDs
            fullUUIDList = tango.listAreaDescriptions();
            if (fullUUIDList.size() == 0) {
                mUuidTextView.setText(R.string.no_uuid);
            } else {
//                mUuidTextView.setText(getString(R.string.number_of_adfs) + fullUUIDList.size()
//                        + getString(R.string.latest_adf_is)
//                        + fullUUIDList.get(fullUUIDList.size() - 1));
                if (mSelectedUUID != null) {
                    mUuidTextView.setText(getString(R.string.selected_adf) + ": " + mSelectedADFName);
                }
                mUuidTextViewCopy = mUuidTextView.getText();
            }
        }
    }

    /**
     * Sets up the tango configuration object. Make sure mTango object is initialized before
     * making this call.
     */
    private TangoConfig setTangoConfig(Tango tango, boolean isLearningMode, boolean isLoadAdf) {
        TangoConfig config = new TangoConfig();
        config = tango.getConfig(TangoConfig.CONFIG_TYPE_DEFAULT);
        // Check if learning mode
        if (isLearningMode) {
            // Set learning mode to config.
            config.putBoolean(TangoConfig.KEY_BOOLEAN_LEARNINGMODE, true);

        }
        // Check for Load ADF/Constant Space relocalization mode
        if (isLoadAdf) {
//            ArrayList<String> fullUUIDList = new ArrayList<String>();
//            // Returns a list of ADFs with their UUIDs
//            fullUUIDList = tango.listAreaDescriptions();
//            // Load the latest ADF if ADFs are found.
//            if (fullUUIDList.size() > 0) {
//                config.putString(TangoConfig.KEY_STRING_AREADESCRIPTION,
//                        fullUUIDList.get(fullUUIDList.size() - 1));
//            }
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
            }

            // Listen to Tango Events
            @Override
            public void onTangoEvent(final TangoEvent event) {
            }

            @Override
            public void onPoseAvailable(final TangoPoseData pose) {
                boolean updateRenderer = false;
                // Make sure to have atomic access to Tango Data so that
                // UI loop doesn't interfere while Pose call back is updating
                // the data.

                if (mIsConstantSpaceRelocalize) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            // Display pose data on screen in TextViews
                            mUuidTextView.setText(mUuidTextViewCopy.toString() + "\n" + pose.toString());
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

                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            synchronized (mSharedLock) {
                                mSaveAdfButton.setEnabled(mIsRelocalized);
                                mRelocalizationTextView.setText(mIsRelocalized ?
                                        getString(R.string.localized) :
                                        getString(R.string.not_localized));
                            }
                        }
                    });
                }

                if (updateRenderer) {
                    mRenderer.updateDevicePose(pose, mIsRelocalized);

                    count++;
                    if (count > 50) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                //System.out.println("update!");
                                worldCoor = pose.getTranslationAsFloats();
                                //System.out.println(worldCoor[0] + "," + worldCoor[1]);
                                //System.out.println(bmpCoor[0] + "," + bmpCoor[1]);


                                if (mIsRelocalized) {
                                    //System.out.println("localized!");
                                    float []bmpCoor = map2D.world2bmp(worldCoor[0], worldCoor[1]);
                                    Bitmap curBmp = map2D.imgBmp.copy(Bitmap.Config.ARGB_8888, true);
                                    Canvas canvas = new Canvas(curBmp);

                                    Paint paint = new Paint();
                                    paint.setColor(Color.RED);
                                    paint.setStyle(Paint.Style.FILL);
                                    canvas.drawCircle(bmpCoor[0], bmpCoor[1], 40, paint);

                                    imageView.setImageBitmap(curBmp);
                                }
                            }
                        });
                        count = 0;
                    }
                }
            }

            @Override
            public void onFrameAvailable(int cameraId) {
                // We are not using onFrameAvailable for this application.
                if (cameraId == TangoCameraIntrinsics.TANGO_CAMERA_COLOR) {
                    tangoCameraPreview.onFrameAvailable();
                }

            }
        });
    }

    /**
     * Save the current Area Description File.
     * Performs saving on a background thread and displays a progress dialog.
     */
    private void saveAdf(String adfName) {
        mSaveAdfTask = new SaveAdfTask(this, this, mTango, adfName);
        mSaveAdfTask.execute();
    }

    /**
     * Handles failed save from mSaveAdfTask.
     */
    @Override
    public void onSaveAdfFailed(String adfName) {
        String toastMessage = String.format(
                getResources().getString(R.string.save_adf_failed_toast_format),
                adfName);
        Toast.makeText(this, toastMessage, Toast.LENGTH_LONG).show();
        mSaveAdfTask = null;
    }

    /**
     * Handles successful save from mSaveAdfTask.
     */
    @Override
    public void onSaveAdfSuccess(String adfName, String adfUuid) {
        String toastMessage = String.format(
                getResources().getString(R.string.save_adf_success_toast_format),
                adfName, adfUuid);
        Toast.makeText(this, toastMessage, Toast.LENGTH_LONG).show();
        mSaveAdfTask = null;
        finish();
    }

    /**
     * Shows a dialog for setting the ADF name.
     */
    private void showSetADFNameDialog() {
        Bundle bundle = new Bundle();
        bundle.putString("name", "New ADF");
        bundle.putString("id", ""); // UUID is generated after the ADF is saved.

        FragmentManager manager = getFragmentManager();
        SetADFNameDialog setADFNameDialog = new SetADFNameDialog();
        setADFNameDialog.setArguments(bundle);
        setADFNameDialog.show(manager, "ADFNameDialog");
    }
}
