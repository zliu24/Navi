package edu.stanford.navi;

import android.content.Intent;
import android.content.res.AssetManager;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;
import com.google.atap.tangoservice.TangoErrorException;

import java.util.ArrayList;
import java.util.HashMap;

import edu.stanford.navi.adf.Utils;

public class Homepage extends BaseActivity implements View.OnClickListener {

    private Tango mTango;
    private ArrayList<String> fullUUIDList;
    private HashMap<String, String> name2uuidMap;
    private String mSelectedUUID;
    private String mSelectedADFName;
    private final String ADF_FILE = "adfList.txt";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_homepage);
        setTitle(R.string.app_name);

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
        startActivityForResult(Tango.getRequestPermissionIntent(Tango.PERMISSIONTYPE_ADF_LOAD_SAVE), 0);
        setUpADF();
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.select_shopper_button:
                startShopperActivity();
                break;
            case R.id.select_store_owner_button:
                startOwnerActivity();
                break;
        }
    }

    private void setUpADF() {
        fullUUIDList = mTango.listAreaDescriptions();
        name2uuidMap = Utils.getName2uuidMap(fullUUIDList, mTango);

        AssetManager assetManager = this.getAssets();
        mSelectedADFName = Utils.loadADF(ADF_FILE, assetManager);
        mSelectedUUID = name2uuidMap.get(mSelectedADFName);
        System.out.println("Selected ADF: " + mSelectedADFName);
        System.out.println("Selected ADF UUID: " + mSelectedUUID);
    }

    private void startShopperActivity() {
        Intent passIntent2Shopper = new Intent(this, MapActivity.class);
        passIntent2Shopper.putExtra(LOAD_ADF, true);
        passIntent2Shopper.putExtra(ADF_UUID, mSelectedUUID);
        passIntent2Shopper.putExtra(ADF_NAME, mSelectedADFName);
        startActivity(passIntent2Shopper);
    }

    private void startOwnerActivity() {
        Intent passIntent2Owner = new Intent(this, OwnerStartActivity.class);
        startActivity(passIntent2Owner);
    }
}