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

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.text.Html;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoConfig;
import com.google.atap.tangoservice.TangoCoordinateFramePair;
import com.google.atap.tangoservice.TangoErrorException;
import com.google.atap.tangoservice.TangoEvent;
import com.google.atap.tangoservice.TangoInvalidException;
import com.google.atap.tangoservice.TangoOutOfDateException;
import com.google.atap.tangoservice.TangoPoseData;
import com.google.atap.tangoservice.TangoXyzIjData;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;
import org.opencv.core.Size;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import edu.stanford.navi.adf.Utils;
import edu.stanford.navi.domain.Coordinate;
import edu.stanford.navi.map.Map2D;

public class OwnerMapActivity extends BaseActivity implements View.OnClickListener {

    public static final String MAPPING_SUFFIX = "_mapping.txt";
    private final int STEP1 = 1;
    private final int STEP2 = 2;
    private final int STEP3 = 3;

    private final int NUM_CALIBRATION_POINTS = 4;

    private Tango mTango;
    private TangoConfig mConfig;
    private boolean mIsRelocalized = false;
    private AtomicBoolean mIsConnected = new AtomicBoolean(false);
    private final Object mSharedLock = new Object();
    private TangoPoseData mPose;

    private Button mNextButton;
    private ImageView imageView;
    private String selectedADFName;
    private String selectedUUID;

    private Map2D map;
    private Bitmap mapBitmap;
    private List<Coordinate> imageCoords;
    private List<Coordinate> worldCoords;
    private Coordinate selectedCoord;
    private Paint selectedPaint;
    private Paint disabledPaint;
    private Paint locationPaint;
    private int count=0;

    // UI
    private boolean mAllowMapClicks;
    private TextView mStepHeader;
    private TextView mStepInstructions;
    private TextView mCalibrationProgress;
    private Button mDoneButtonStep2;

    private int numPointsCalibrated;

    private int mStep = STEP1;


    private static final String TAG = OwnerMapActivity.class.getSimpleName();

    // Instructions
    private TextView localize;
    private int localizeState = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.owner_map_activity);

        setupTango();
        setUpButtons();
        setUpFonts();
        setupPaint();

        imageCoords = new ArrayList<Coordinate>();
        worldCoords = new ArrayList<Coordinate>();
        numPointsCalibrated = 0;
        mAllowMapClicks = true;
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            if (mIsConnected.compareAndSet(true, false)) {
                mTango.disconnect();
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
                mTango.connect(mConfig);

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
        OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_1_0, this, mLoaderCallback);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.next:
                if (numPointsCalibrated == NUM_CALIBRATION_POINTS) {
                    saveMapping();
                }
                startOwnerLabelActivity();

                break;
            case R.id.doneStep2:
                if (mStep == STEP2 && mIsRelocalized) {
                    addMapping();
                    setUpStep3();
                } else if(mStep == STEP3) {
                    setUpStep1();
                }
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return true;
    }

    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            if (status == LoaderCallbackInterface.SUCCESS) {
                setUpMap();
            } else {
                super.onManagerConnected(status);
            }
        }
    };


    private void setupTango () {
        Intent intent = getIntent();
        selectedUUID = intent.getStringExtra(ADF_UUID);
        selectedADFName = intent.getStringExtra(ADF_NAME);

        mTango = new Tango(this);
        mConfig = setTangoConfig(mTango);
    }

    private TangoConfig setTangoConfig(Tango tango) {
        TangoConfig config = tango.getConfig(TangoConfig.CONFIG_TYPE_DEFAULT);
        config.putBoolean(TangoConfig.KEY_BOOLEAN_DEPTH, true);
        config.putBoolean(TangoConfig.KEY_BOOLEAN_COLORCAMERA, true);

        if (selectedUUID != null) {
            config.putString(TangoConfig.KEY_STRING_AREADESCRIPTION, selectedUUID);
        }
        return config;
    }

    private void setUpButtons() {
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");

        mNextButton = (Button) findViewById(R.id.next);
        mNextButton.setTypeface(face);
        mNextButton.setOnClickListener(this);

        mDoneButtonStep2 = (Button)findViewById(R.id.doneStep2);
        mDoneButtonStep2.setOnClickListener(this);
        mDoneButtonStep2.setTypeface(face);
    }

    private void setUpFonts() {
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        Typeface faceRegular = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Regular.otf");

        mStepHeader = (TextView) findViewById(R.id.stepHeader);
        mStepInstructions = (TextView) findViewById(R.id.stepInstructions);

        TextView calibrationProgressHeader = (TextView) findViewById(R.id.calibrationProgressHeader);
        mCalibrationProgress = (TextView) findViewById(R.id.calibrationProgress);
        TextView headerTxt = (TextView) findViewById(R.id.header_text);

        calibrationProgressHeader.setTypeface(face);
        mCalibrationProgress.setTypeface(faceRegular);

        mStepHeader.setTypeface(face);
        mStepInstructions.setTypeface(faceRegular);

        headerTxt.setTypeface(face);
    }

    private void setUpStep1() {
        mStep = STEP1;
        mDoneButtonStep2.setText("");
        mStepHeader.setText("STEP 1");
        mStepInstructions.setText("Click on a map location that you can navigate to");
        mAllowMapClicks = true;
    }

    private void setUpStep3() {
        mStep = STEP3;
        Log.d("BOO","Step: " + mStep);
        numPointsCalibrated++;

        if(numPointsCalibrated == NUM_CALIBRATION_POINTS) {
            mDoneButtonStep2.setText("");
            Drawable custom_button = getResources().getDrawable(
                    getResources().getIdentifier("custom_button", "drawable", getPackageName()));
            mNextButton.setText("Next");
            mNextButton.setBackground(custom_button);

        } else {
            mDoneButtonStep2.setText("Continue");
        }

        String progressStr = "<font color=#FF6155>" + numPointsCalibrated + "</font> " +
                "out of " + NUM_CALIBRATION_POINTS;
        mCalibrationProgress.setText(Html.fromHtml(progressStr));
        mStepHeader.setText("Well done!");
        String instruction = "<font color=#9B9B9B>You have set</font> <br> <font color=#FF6155>" + numPointsCalibrated + "</font> " +
                "<font color=#9B9B9B> out of " + NUM_CALIBRATION_POINTS + " location mappings.</font>";
        mStepInstructions.setText(Html.fromHtml(instruction));

        mAllowMapClicks = false;
    }

    private void setUpStep2() {
        mStep = STEP2;
        Log.d("BOO","Step should be 2 but: " + mStep);
        mStepHeader.setText("STEP 2");
        mStepInstructions.setText("Go to the real world location that you marked on the map");
        mDoneButtonStep2.setText("Done");
    }

    public void setUpMap() {
        android.graphics.Point screenSize = new android.graphics.Point();
        getWindowManager().getDefaultDisplay().getSize(screenSize);
        map = new Map2D(this, screenSize.x, screenSize.y);
        mapBitmap = map.imgBmp.copy(Bitmap.Config.ARGB_8888, true);
        imageView = (ImageView) findViewById(R.id.ownerMap);
        imageView.setImageBitmap(mapBitmap);

        imageView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {

                if(mAllowMapClicks) {
                    selectedCoord = Utils.screen2img(event.getX(), event.getY(), new Size(v.getWidth(), v.getHeight()), map.getImgSize());
                    Log.i(TAG, "Screen size: " + map.getScreenSize().width + "," + map.getScreenSize().height + "\n");
                    Log.i(TAG, "Screen Coords: " + event.getX() + "," + event.getY() + "\n");
                    Log.i(TAG, "Image size: " + map.getImgSize().width + "," + map.getImgSize().height + "\n");
                    Log.i(TAG, "Image Coords: " + selectedCoord.getXInt() + "," + selectedCoord.getYInt() + "\n");
                    setUpStep2();
                }

                return true;
            }
        });
    }

    private void setupPaint() {
        selectedPaint = new Paint();
        selectedPaint.setColor(Color.RED);
        selectedPaint.setStyle(Paint.Style.FILL);
        selectedPaint.setTextSize(30);

        disabledPaint = new Paint();
        disabledPaint.setColor(Color.GRAY);
        disabledPaint.setStyle(Paint.Style.FILL);
        disabledPaint.setTextSize(30);

        locationPaint = new Paint();
        locationPaint.setColor(Color.GREEN);
        locationPaint.setStyle(Paint.Style.FILL);
        locationPaint.setTextSize(30);
    }
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

        mTango.connectListener(framePairs, new Tango.OnTangoUpdateListener() {
            @Override
            public void onXyzIjAvailable(TangoXyzIjData xyzij) {

            }

            // Listen to Tango Events
            @Override
            public void onTangoEvent(final TangoEvent event) {

            }

            @Override
            public void onPoseAvailable(final TangoPoseData pose) {
                boolean updateRenderer = true;
                synchronized (mSharedLock) {
                    // Check for Device wrt ADF pose, Device wrt Start of Service pose,
                    // Start of Service wrt ADF pose (This pose determines if the device
                    // is relocalized or not).
                    if (pose.baseFrame == TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION
                            && pose.targetFrame == TangoPoseData.COORDINATE_FRAME_DEVICE) {

                        if (mIsRelocalized) {
                            mPose = pose;
                        }
                    } else if (pose.baseFrame == TangoPoseData.COORDINATE_FRAME_AREA_DESCRIPTION
                            && pose.targetFrame == TangoPoseData
                            .COORDINATE_FRAME_START_OF_SERVICE) {
                        if (pose.statusCode == TangoPoseData.POSE_VALID) {
                            mIsRelocalized = true;
                        } else {
                            mIsRelocalized = false;
                        }
                    }
                }
                if (updateRenderer) {
                    count++;
                    if (count > 50) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                localize = (TextView) findViewById(R.id.localize_owner);
                                Bitmap curBitmap = mapBitmap.copy(Bitmap.Config.ARGB_8888, true);
                                if(selectedCoord != null)
                                    Utils.drawLocation(curBitmap, selectedCoord.getXInt(), selectedCoord.getYInt(), selectedPaint);
                                if (mIsRelocalized) {
                                    localize.setVisibility(View.INVISIBLE);
                                } else {
                                    if (localizeState % 3 == 0) {
                                        localize.setText(R.string.localize_state1);
                                    } else if (localizeState % 3 == 1) {
                                        localize.setText(R.string.localize_state2);
                                    } else {
                                        localize.setText(R.string.localize_state3);
                                    }
                                    localize.setVisibility(View.VISIBLE);
                                    localizeState++;
                                }
                                for (Coordinate coords : imageCoords) {
                                    Utils.drawLocation(curBitmap, coords.getXInt(), coords.getYInt(), disabledPaint);
                                }
                                imageView.setImageBitmap(curBitmap);
                            }
                        });
                        count = 0;
                    }
                }

            }

            @Override
            public void onFrameAvailable(int cameraId) {
            }
        });
    }

    private void startOwnerLabelActivity() {
        Intent intent = new Intent(this, OwnerLabelActivity.class);
        intent.putExtra(ADF_NAME, selectedADFName);
        startActivity(intent);
    }

    private void addMapping() {
        imageCoords.add(selectedCoord);
        worldCoords.add(new Coordinate((float)mPose.translation[0], (float)mPose.translation[1]));
    }

    private void saveMapping() {
        StringBuilder sb = new StringBuilder();
        Log.i(TAG,"Writing " + imageCoords.size() + " mappings to file.");
        for (int i=0; i<imageCoords.size(); i++) {
            double scale = map.getRaw2ImgScale();
            int rawX = (int) (imageCoords.get(i).getX() / scale);
            int rawY = (int) (imageCoords.get(i).getY() / scale);
            String line = rawX + "," + rawY + "," + worldCoords.get(i).getX() + "," + worldCoords.get(i).getY() + '\n';
            sb.append(line);
        }
        Utils.writeToFile(selectedADFName + MAPPING_SUFFIX, sb.toString(),this);
    }
}

