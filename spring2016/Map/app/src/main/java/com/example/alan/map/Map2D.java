package com.example.alan.map;

/**
 * Created by alan on 4/14/16.
 */

import java.io.IOException;
import android.graphics.Bitmap;
import android.content.Context;
import org.opencv.core.*;
import org.opencv.android.Utils;

public class Map2D {
    public Mat img;
    public Bitmap imgBmp;
    private Context context;

    public Map2D(Context base) {
        this.context = base;
        try {
            img = Utils.loadResource(this.context, R.drawable.gates);
        } catch (IOException e) {
            e.printStackTrace();
        }
        System.out.println(img.cols() + img.rows());
        imgBmp = Bitmap.createBitmap(img.cols(), img.rows(), Bitmap.Config.ARGB_8888);
    }

    public Bitmap getBmp() {
        Utils.matToBitmap(img, imgBmp);
        return imgBmp;
    }

    private void preProcess() {
        
    }
}
