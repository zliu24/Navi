package edu.stanford.navi;

import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;

import java.util.ArrayList;
import java.util.HashMap;

public class Homepage extends BaseActivity implements View.OnClickListener {

    private Tango mTango;
    private ArrayList<String> fullUUIDList;
    private ArrayList<String> fullADFnameList;
    private HashMap<String, String> name2uuidMap;
    String mSelectedUUID;
    String mSelectedADFName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_homepage);

        // Set homepage buttons font to Avenir
        TextView select_shpr_btn = (TextView) findViewById(R.id.select_shopper_button);
        TextView select_str_ownr_btn = (TextView) findViewById(R.id.select_store_owner_button);

        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        select_shpr_btn.setTypeface(face);
        select_str_ownr_btn.setTypeface(face);

        select_shpr_btn.setOnClickListener(this);
        select_str_ownr_btn.setOnClickListener(this);

        // Set up tango and ADF
        mTango = new Tango(this);
        fullUUIDList = mTango.listAreaDescriptions();
        fullADFnameList = getADFNameList(fullUUIDList, mTango);
        name2uuidMap = getName2uuidMap(fullUUIDList, mTango);

        mSelectedADFName = fullADFnameList.get(0);
        mSelectedUUID = name2uuidMap.get(mSelectedADFName);
        System.out.println("Selected ADF: " + mSelectedADFName);
    }

    @Override
    public void onClick(View view) {
        // Pass intent to AreaLearning
        Intent passADIntent2AreaLearning = new Intent(this, MapActivity.class);
        passADIntent2AreaLearning.putExtra(LOAD_ADF, true);
        passADIntent2AreaLearning.putExtra(ADF_UUID, mSelectedUUID);
        passADIntent2AreaLearning.putExtra(ADF_NAME, mSelectedADFName);
        startActivity(passADIntent2AreaLearning);
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
}
