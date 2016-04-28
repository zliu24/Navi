package com.projecttango.experiments.javaarealearning;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

/**
 * Created by catherinemullings on 4/25/16.
 */
public class BaseActivity extends Activity {

    public static final String USE_AREA_LEARNING =
            "com.projecttango.areadescriptionjava.usearealearning";
    public static final String LOAD_ADF = "com.projecttango.areadescriptionjava.loadadf";
    public static final String ADF_UUID = "com.projecttango.areadescriptionjava.uuid";
    public static final String ADF_NAME = "com.projecttango.areadescriptionjava.adfName";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Remove title bar
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Remove notification bar
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }
}
