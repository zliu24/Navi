package edu.stanford.navi;

import android.graphics.drawable.Drawable;
import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.graphics.Typeface;
import android.widget.Spinner;
import android.widget.TextView;


import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoConfig;
import com.google.atap.tangoservice.TangoPoseData;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import edu.stanford.navi.adf.Utils;

public class OwnerLabelActivity extends BaseActivity {

    private final String CONFIG_FILE = "config.txt";

    private Tango mTango;
    private TangoConfig mConfig;

    private Button mNextButton;
    private ImageView imageView;
    private String selectedADFName;
    private String selectedUUID;
    private ArrayList<String> fullUUIDList;
    private ArrayList<String> fullADFnameList;
    private Map<String, String> name2uuidMap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_owner_label);

        mTango = new Tango(this);
        setUpADF();
        setUpMap();
        setUpUI();
    }

    private void setUpFonts() {
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");

        Typeface faceRegular = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Regular.otf");

        TextView addLocCardHeaderTxt = (TextView) findViewById(R.id.addLocCardHeader);
        addLocCardHeaderTxt.setTypeface(face);

        TextView textFieldLocationItemTxt = (TextView) findViewById(R.id.textFieldLocationItem);
        textFieldLocationItemTxt.setTypeface(faceRegular);


        TextView cancelButtonTxt = (TextView) findViewById(R.id.cancelButton);
        cancelButtonTxt.setTypeface(faceRegular);

        TextView doneButtonTxt = (TextView) findViewById(R.id.doneButton);
        doneButtonTxt.setTypeface(face);


        TextView headerTxt = (TextView) findViewById(R.id.header_text);
        headerTxt.setTypeface(face);
    }

    private void setUpUI() {
        setUpFonts();

//        List<String> filterItemsTemp = new ArrayList<String>();
//        filterItemsTemp.add("Android");
//        filterItemsTemp.add("iOS");
//        filterItemsTemp.add("AR / VR");
//
//        Spinner spinner = (Spinner) findViewById(R.id.filterSpinner);
//        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, filterItemsTemp);
//        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//        spinner.setPrompt("Filter labels");
    }

    public void setUpMap() {
        Drawable img = Utils.getImage(this, selectedADFName);
        imageView = (ImageView) findViewById(R.id.ownerMap);
        imageView.setImageDrawable(img);
    }

    private void setUpADF() {
        fullUUIDList = mTango.listAreaDescriptions();
        fullADFnameList = Utils.getADFNameList(fullUUIDList, mTango);
        name2uuidMap = Utils.getName2uuidMap(fullUUIDList, mTango);
        selectedADFName = Utils.loadADFfromFile(CONFIG_FILE, this);
    }

}

