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
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.Toast;
import android.widget.ToggleButton;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * Start Activity for Area Description example. Gives the ability to choose a particular
 * configuration and also Manage Area Description Files (ADF).
 */
public class ALStartActivity extends Activity implements View.OnClickListener, OnItemSelectedListener {

    public static final String USE_AREA_LEARNING =
            "com.projecttango.areadescriptionjava.usearealearning";
    public static final String LOAD_ADF = "com.projecttango.areadescriptionjava.loadadf";
    public static final String ADF_UUID = "com.projecttango.areadescriptionjava.uuid";
    public static final String ADF_NAME = "com.projecttango.areadescriptionjava.adfName";
    private ToggleButton mLearningModeToggleButton;
//    private ToggleButton mLoadADFToggleButton;
    private Button mStartButton;
//    private boolean mIsUseAreaLearning;
//    private boolean mIsLoadADF;
    private String selectedUUID;
    private String selectedADFName;
    private Spinner spinner;
    private Tango mTango;
    private ArrayList<String> fullUUIDList;
    private ArrayList<String> fullADFnameList;
    private HashMap<String, String> name2uuidMap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.start_activity);
        setTitle(R.string.app_name);
        mStartButton = (Button) findViewById(R.id.start);
        findViewById(R.id.ADFListView).setOnClickListener(this);
        mStartButton.setOnClickListener(this);
        startActivityForResult(
                Tango.getRequestPermissionIntent(Tango.PERMISSIONTYPE_ADF_LOAD_SAVE), 0);

        mTango = new Tango(this);
        fullUUIDList = mTango.listAreaDescriptions();
        fullADFnameList = getADFNameList(fullUUIDList, mTango);
        name2uuidMap = getName2uuidMap(fullUUIDList, mTango);

        spinner = (Spinner) findViewById(R.id.selectAdf);
        spinner.setOnItemSelectedListener(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, fullADFnameList);
        spinner.setAdapter(adapter);
    }

    private ArrayList<String> getADFNameList(ArrayList<String> uuidList, Tango tango) {
        ArrayList<String> nameList = new ArrayList<String>();
        for (String uuid: uuidList) {
            TangoAreaDescriptionMetaData metadata = mTango.loadAreaDescriptionMetaData(uuid);
            byte[] nameBytes = metadata.get(TangoAreaDescriptionMetaData.KEY_NAME);
            if (nameBytes != null) {
                String name = new String(nameBytes);
                nameList.add(name);
            } // Do something if null
        }
        return nameList;
    }

    private HashMap<String, String> getName2uuidMap(ArrayList<String> uuidList, Tango tango) {
        HashMap<String, String> map = new HashMap<String, String>();
        for (String uuid: uuidList) {
            TangoAreaDescriptionMetaData metadata = mTango.loadAreaDescriptionMetaData(uuid);
            byte[] nameBytes = metadata.get(TangoAreaDescriptionMetaData.KEY_NAME);
            if (nameBytes != null) {
                String name = new String(nameBytes);
                map.put(name, uuid);
            } // Do something if null
        }
        return map;
    }

    public void onItemSelected(AdapterView<?> parent, View v, int position, long id) {
        // On selecting a spinner item
        selectedADFName = parent.getItemAtPosition(position).toString();
        selectedUUID = name2uuidMap.get(selectedADFName);

        // Showing selected spinner item
//        Toast.makeText(parent.getContext(), "Selected: " + item, Toast.LENGTH_LONG).show();
    }

    public void onNothingSelected(AdapterView<?> parentView){
        System.out.println("fuc no!");
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.start:
                startAreaDescriptionActivity();
                break;
            case R.id.ADFListView:
                startADFListView();
                break;
        }
    }

    private void startAreaDescriptionActivity() {
        Intent startADIntent = new Intent(this, Homepage.class);
//        startADIntent.putExtra(LOAD_ADF, mIsLoadADF);
        startADIntent.putExtra(LOAD_ADF, true);
        startADIntent.putExtra(ADF_UUID, selectedUUID);
        startADIntent.putExtra(ADF_NAME, selectedADFName);
        startActivity(startADIntent);
    }

    private void startADFListView() {
        Intent startADFListViewIntent = new Intent(this, ADFUUIDListViewActivity.class);
        startActivity(startADFListViewIntent);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        // Check which request we're responding to
        if (requestCode == 0) {
            // Make sure the request was successful
            if (resultCode == RESULT_CANCELED) {
                Toast.makeText(this, R.string.arealearning_permission, Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

}
