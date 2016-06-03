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
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;

import com.google.atap.tangoservice.Tango;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import edu.stanford.navi.adf.Utils;

import static java.util.Arrays.asList;

public class OwnerStartActivity extends BaseActivity implements View.OnClickListener, OnItemSelectedListener {

    private final String CONFIG_FILE = "config.txt";
    private Button mStartButton;
    private Button mManageButton;
    private ImageView imageView;
    private String selectedADFName;
    private Spinner spinner;
    private Tango mTango;
    private ArrayList<String> fullUUIDList;
    private ArrayList<String> fullADFnameList;
    private Map<String, String> name2uuidMap;

    private static final String TAG = OwnerStartActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.owner_start_activity);

        mTango = new Tango(this);
        setUpButtons();
        setUpADF();
        setUpSpinner();
        setUpFonts();
        Utils.testReadJson(this);
        Utils.testWriteJson(this);
        Utils.testReadJson(this);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.next:
                startOwnerMapActivity();
                break;
            case R.id.manageADF:
                startADFListView();
                break;
        }
    }

    private void setUpFonts() {
        TextView header_text = (TextView) findViewById(R.id.header_text);
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        header_text.setTypeface(face);
    }

    private void setUpButtons() {
        mStartButton = (Button) findViewById(R.id.next);
        TextView mStartButtonTxt = (TextView) findViewById(R.id.next);

        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        mStartButtonTxt.setTypeface(face);

        mManageButton = (Button) findViewById(R.id.manageADF);
        TextView  mManageButtonTxt = (TextView) findViewById(R.id.manageADF);
        mManageButtonTxt.setTypeface(face);

        mManageButton.setOnClickListener(this);
        mStartButton.setOnClickListener(this);
    }

    private void setUpADF() {
        fullUUIDList = mTango.listAreaDescriptions();
        fullADFnameList = Utils.getADFNameList(fullUUIDList, mTango);
        name2uuidMap = Utils.getName2uuidMap(fullUUIDList, mTango);
        selectedADFName = Utils.loadFromFile(CONFIG_FILE, this, Utils.DEFAULT_LOC);
    }

    private void setUpSpinner() {
        spinner = (Spinner) findViewById(R.id.selectAdf);
        spinner.setOnItemSelectedListener(this);

        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, fullADFnameList);
        spinner.setAdapter(adapter);
        //set the default location
        int curLocation = adapter.getPosition(selectedADFName);
        spinner.setSelection(curLocation);

    }

    public void onItemSelected(AdapterView<?> parent, View v, int position, long id) {
        selectedADFName = parent.getItemAtPosition(position).toString();
        Utils.writeToFile(CONFIG_FILE, selectedADFName, this);
        setUpMap();
    }

    public void setUpMap() {
        Log.i(TAG,"Selected Map: " + selectedADFName);
        Drawable img = Utils.getImage(this, selectedADFName);
        imageView = (ImageView) findViewById(R.id.ownerMap);
        imageView.setImageDrawable(img);
    }

    public void onNothingSelected(AdapterView<?> parentView){
    }

    private void startOwnerMapActivity() {
        Intent intent = new Intent(this, OwnerMapActivity.class);
        intent.putExtra(ADF_NAME, selectedADFName);
        intent.putExtra(ADF_UUID, name2uuidMap.get(selectedADFName));
        startActivity(intent);
    }

    private void startADFListView() {
        Intent startADFListViewIntent = new Intent(this, ADFUUIDListViewActivity.class);
        startActivity(startADFListViewIntent);
    }

}
