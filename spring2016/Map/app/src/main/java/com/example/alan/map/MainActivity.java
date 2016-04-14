package com.example.alan.map;

import org.opencv.core.*;
import org.opencv.imgcodecs.*;
import org.opencv.android.Utils;

import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.widget.ImageView;
import android.graphics.Bitmap;

import org.opencv.android.OpenCVLoader;
import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;

public class MainActivity extends ActionBarActivity {

    private  Map2D example;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }

    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            if (status == LoaderCallbackInterface.SUCCESS ) {
                helloWorld();
            } else {
                super.onManagerConnected(status);
            }
        }
    };

    @Override
    public void onResume() {
        super.onResume();
        OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_1_0, this, mLoaderCallback);
    }

    public void helloWorld() {
        Mat tmp = new Mat();
        tmp = Utils.loadResource(getContext(), R.drawable.gates);
        displayBitmap(example.img_bmp);
        System.out.println("abc");
    }

    public void displayBitmap(Bitmap img_bmp) {
        ImageView a = (ImageView) findViewById(R.id.imageView);
        a.setImageBitmap(img_bmp);
    }


}
