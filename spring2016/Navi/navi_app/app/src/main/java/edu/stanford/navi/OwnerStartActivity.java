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

import com.google.atap.tangoservice.Tango;

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
import java.util.ArrayList;
import java.util.HashMap;

import edu.stanford.navi.adf.Utils;

/**
 * Start Activity for Area Description example. Gives the ability to choose a particular
 * configuration and also Manage Area Description Files (ADF).
 */
public class OwnerStartActivity extends Activity implements View.OnClickListener, OnItemSelectedListener {

    public static final String LOAD_ADF = "com.projecttango.areadescriptionjava.loadadf";
    public static final String ADF_UUID = "com.projecttango.areadescriptionjava.uuid";
    public static final String ADF_NAME = "com.projecttango.areadescriptionjava.adfName";
    private final String ADF_FILE = "adfList.txt";
    private Button mStartButton;
    private Button mManageButton;
    private String selectedUUID;
    private String selectedADFName;
    private Spinner spinner;
    private Tango mTango;
    private ArrayList<String> fullUUIDList;
    private ArrayList<String> fullADFnameList;
    private HashMap<String, String> name2uuidMap;

    private static final String TAG = OwnerStartActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.owner_start_activity);
        startActivityForResult(
                Tango.getRequestPermissionIntent(Tango.PERMISSIONTYPE_ADF_LOAD_SAVE), 0);

        mTango = new Tango(this);
        setUpButtons();
        setUpADF();
        setUpSpinner();
    }

    private void setUpButtons() {
        mStartButton = (Button) findViewById(R.id.start);
        mManageButton = (Button) findViewById(R.id.manageADF);
        mManageButton.setOnClickListener(this);
        mStartButton.setOnClickListener(this);
    }

    private void setUpADF() {
        fullUUIDList = mTango.listAreaDescriptions();
        fullADFnameList = Utils.getADFNameList(fullUUIDList, mTango);
        name2uuidMap = Utils.getName2uuidMap(fullUUIDList, mTango);
    }

    private void setUpSpinner() {
        spinner = (Spinner) findViewById(R.id.selectAdf);
        spinner.setOnItemSelectedListener(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, fullADFnameList);
        spinner.setAdapter(adapter);
    }

    public void onItemSelected(AdapterView<?> parent, View v, int position, long id) {
        selectedADFName = parent.getItemAtPosition(position).toString();
        selectedUUID = name2uuidMap.get(selectedADFName);

        Utils.writeADFtoFile(ADF_FILE, selectedADFName, this);
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
            case R.id.manageADF:
                startADFListView();
                break;
        }
    }

    private void startAreaDescriptionActivity() {

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
