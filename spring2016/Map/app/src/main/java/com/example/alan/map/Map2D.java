package com.example.alan.map;

/**
 * Created by alan on 4/14/16.
 */

import org.opencv.core.*;
import org.opencv.imgcodecs.*;
import org.opencv.android.Utils;


import android.graphics.Bitmap;
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import java.io.File;

public class Map2D {
    public Mat img;
    public Bitmap img_bmp;

    public Map2D(String path) {
        img = new Mat();
        img = Imgcodecs.imread(path);
        System.out.println("fuck you");
        System.out.println(path);
        System.out.println(img.cols() + img.rows());
        img_bmp = Bitmap.createBitmap(img.cols(), img.rows(), Bitmap.Config.ARGB_8888);
        Utils.matToBitmap(img, img_bmp);
    }
}
