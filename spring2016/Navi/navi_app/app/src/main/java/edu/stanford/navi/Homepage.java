package edu.stanford.navi;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

public class Homepage extends BaseActivity implements View.OnClickListener {

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

        // Onclick listener: Transition to menupage
//        Button select = (Button) findViewById(R.id.select_shopper_button);

        select_shpr_btn.setOnClickListener(this);
        select_str_ownr_btn.setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        // Get intent pass from ALStarActivity
        Intent intent = getIntent();
        boolean mIsConstantSpaceRelocalize = intent.getBooleanExtra(ALStartActivity.LOAD_ADF, false);
        String mSelectedUUID = intent.getStringExtra(ALStartActivity.ADF_UUID);
        String mSelectedADFName = intent.getStringExtra(ALStartActivity.ADF_NAME);

        // Pass intent to AreaLearning
        Intent passADIntent2AreaLearning = new Intent(this, AreaLearningActivity.class);
//        startADIntent.putExtra(LOAD_ADF, mIsLoadADF);
        passADIntent2AreaLearning.putExtra(LOAD_ADF, true);
        passADIntent2AreaLearning.putExtra(ADF_UUID, mSelectedUUID);
        passADIntent2AreaLearning.putExtra(ADF_NAME, mSelectedADFName);
        startActivity(passADIntent2AreaLearning);
    }
}
