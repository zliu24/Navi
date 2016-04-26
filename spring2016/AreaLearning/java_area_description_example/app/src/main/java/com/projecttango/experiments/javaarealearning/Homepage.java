package com.projecttango.experiments.javaarealearning;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

public class Homepage extends BaseActivity {

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
        View.OnClickListener spawnMenuPage = new View.OnClickListener() {

            @Override
            public void onClick(View view) {
                Intent intent = new Intent(Homepage.this, MenuPage.class);
                startActivity(intent);
            }
        };
        select_shpr_btn.setOnClickListener(spawnMenuPage);
    }
}
