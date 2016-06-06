package edu.stanford.navi;

import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import com.google.atap.tangoservice.Tango;

import java.util.ArrayList;
import java.util.Map;

import edu.stanford.navi.adf.Utils;

public class Homepage extends BaseActivity implements View.OnClickListener {

    private Tango mTango;
    private ArrayList<String> fullUUIDList;
    private Map<String, String> name2uuidMap;
    private String mSelectedUUID;
    private String mSelectedADFName;
    private final String CONFIG_FILE = "config.txt";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_homepage);
        setTitle(R.string.app_name);

        // Set homepage buttons font to Avenir
        TextView select_shpr_btn = (TextView) findViewById(R.id.select_visitor_button);
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

    @Override
    protected void onResume() {
        super.onResume();
        setUpADF();
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.select_visitor_button:
                startVisitorActivity();
                break;
            case R.id.select_store_owner_button:
                startOwnerActivity();
                break;
        }
    }

    private void setUpADF() {
        fullUUIDList = mTango.listAreaDescriptions();
        name2uuidMap = Utils.getName2uuidMap(fullUUIDList, mTango);

        mSelectedADFName = Utils.loadFromFile(CONFIG_FILE, this, Utils.DEFAULT_LOC);
        mSelectedUUID = name2uuidMap.get(mSelectedADFName);
        System.out.println("Selected ADF: " + mSelectedADFName);
        System.out.println("Selected ADF UUID: " + mSelectedUUID);
    }

    private void startVisitorActivity() {
        Intent passIntent2Visitor = new Intent(this, MapActivity.class);
        passIntent2Visitor.putExtra(LOAD_ADF, true);
        passIntent2Visitor.putExtra(ADF_UUID, mSelectedUUID);
        passIntent2Visitor.putExtra(ADF_NAME, mSelectedADFName);
        startActivity(passIntent2Visitor);
    }

    private void startOwnerActivity() {
        Intent passIntent2Owner = new Intent(this, OwnerStartActivity.class);
        startActivity(passIntent2Owner);
    }
}