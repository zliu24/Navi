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
import android.graphics.drawable.Drawable;
import android.os.Bundle;
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

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import edu.stanford.navi.adf.Utils;

public class OwnerMapActivity extends BaseActivity implements View.OnClickListener {

    private final String CONFIG_FILE = "config.txt";

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

    private static final String TAG = OwnerMapActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.owner_map_activity);

        setupTango();
        setUpButtons();
        setUpMap();
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

    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.next:
                startOwnerLabelActivity();
                break;
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return true;
    }


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
        mNextButton = (Button) findViewById(R.id.next);
        mNextButton.setOnClickListener(this);

    }

    public void setUpMap() {
        Drawable img = Utils.getImage(this, selectedADFName);
        imageView = (ImageView) findViewById(R.id.ownerMap);
        imageView.setImageDrawable(img);

        final TextView textView = (TextView)findViewById(R.id.textView);
        imageView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                textView.setText("Map coordinates : " +
                        String.valueOf(event.getX()) + "x" + String.valueOf(event.getY()));
                return true;
            }
        });
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
                // Make sure to have atomic access to Tango Data so that
                // UI loop doesn't interfere while Pose call back is updating
                // the data.
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

            }

            @Override
            public void onFrameAvailable(int cameraId) {
            }
        });
    }

    private void startOwnerLabelActivity() {

    }

}
