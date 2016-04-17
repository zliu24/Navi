package com.example.alan.map;

import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.view.Display;
import android.graphics.Point;
import org.opencv.android.OpenCVLoader;
import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;

public class MainActivity extends ActionBarActivity {

    private  Map2D example;
    private Point screenSize;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            if (status == LoaderCallbackInterface.SUCCESS) {
                helloWorld();
            } else {
                super.onManagerConnected(status);
            }
        }
    };

    @Override
    public void onResume() {
        super.onResume();
        Display display = getWindowManager().getDefaultDisplay();
        screenSize = new Point();
        display.getSize(screenSize);
        OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_1_0, this, mLoaderCallback);
    }

    public void helloWorld() {
        int start = 0;
        int end = 1;

        Map2D map2D = new Map2D(this, screenSize.x, screenSize.y);
        map2D.computePath(start, end);

        ImageView imageView = (ImageView) findViewById(R.id.imageView);
        imageView.setImageBitmap(map2D.getBmp());
        TextView textView = (TextView) findViewById(R.id.textView);
        textView.setText("Navigation from "+map2D.getLocation(start)+" to "+map2D.getLocation(end));
    }
}
