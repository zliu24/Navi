package com.example.alan.map;

/**
 * Created by alan on 4/14/16.
 */

import java.io.IOException;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import android.graphics.Bitmap;
import android.content.Context;
import android.content.res.AssetManager;
import org.opencv.core.*;
import org.opencv.android.Utils;
import org.opencv.imgproc.Imgproc;
import org.opencv.core.Point;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import com.example.alan.pathfinding.LazyThetaStar;
import com.example.alan.pathfinding.datatypes.GridGraph;

public class Map2D {
    public Mat imgBg;
    public Mat img;
    public Mat imgResize;
    public Bitmap imgBmp;
    private LazyThetaStar lazyThetaStar;
    private List<Scalar> palette = new ArrayList<>();
    private Context mContext;
    private List<Point> points = new ArrayList<>();
    private List<String> locations = new ArrayList<>();
    private Size screenSize;
    private Size bmpSize;
    private Size imgSize;
    private GridGraph gridGraph;
    private byte []buff;
    private int [][]path;

    public Map2D(Context context, int screenWidth, int screenHeight) {
        mContext = context;

        try {
            img = Utils.loadResource(mContext, R.drawable.gates);
            imgBg = Mat.zeros(img.rows(), img.cols(), CvType.CV_8U);
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }

        System.out.println("width: "+img.cols()+", height: "+img.rows());
        screenSize = new Size(screenWidth, screenHeight);
        makePalette();
        preProcess();
        loadCoordinates();

        double bmpWidth = screenSize.width;
        double bmpHeight = (double)img.rows()/img.cols()*screenSize.width;
        bmpSize = new Size(bmpWidth, bmpHeight);
        imgSize = new Size(img.cols(), img.rows());
        imgBmp = Bitmap.createBitmap((int) bmpSize.width, (int) bmpSize.height, Bitmap.Config.ARGB_8888);
        imgResize = Mat.zeros((int) bmpSize.width, (int) bmpSize.height, CvType.CV_8U);
        buff = new byte[(int)img.total()];
    }

    public Bitmap getBmp() {
        Imgproc.resize(img, imgResize, bmpSize);
        Utils.matToBitmap(imgResize, imgBmp);
        return imgBmp;
    }

    public void computePath(int start, int end) {
        img2graph();
        lazyThetaStar = new LazyThetaStar(gridGraph, (int)points.get(start).x, (int)points.get(start).y,
                (int)points.get(end).x, (int)points.get(end).y);
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        drawPath();
    }

    public String getLocation(int i) {
        return locations.get(i);
    }

    private void preProcess() {
        Imgproc.cvtColor(img, imgBg, Imgproc.COLOR_BGR2GRAY);
        Imgproc.threshold(imgBg, imgBg, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
        Imgproc.cvtColor(imgBg, img, Imgproc.COLOR_GRAY2BGR);
    }

    private void loadCoordinates() {
        AssetManager am = mContext.getAssets();

        try {
            InputStream is = am.open("coordinates.txt");
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            String line;

            while ((line = reader.readLine()) != null) {
                String []tokens = line.split("[,]");
                Point pt = new Point(Integer.parseInt(tokens[0]), Integer.parseInt(tokens[1]));
                String loc = tokens[2];
                points.add(pt);
                locations.add(loc);
            }
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }

        for (int i = 0; i < points.size(); i++) {
            Point pt = points.get(i);
            System.out.println(locations.get(i)+": ("+pt.x+", "+pt.y+")");
            Imgproc.circle(img, pt, 15, palette.get(i), -1);
        }
    }

    // reference: http://tools.medialab.sciences-po.fr/iwanthue/
    private void makePalette() {
        palette.add(new Scalar(205, 82, 203));
        palette.add(new Scalar(67, 208, 113));
        palette.add(new Scalar(198, 110, 132));
        palette.add(new Scalar(66, 196, 198));
        palette.add(new Scalar(128, 72, 194));
        palette.add(new Scalar(132, 201, 115));
        palette.add(new Scalar(60, 73, 211));
        palette.add(new Scalar(195, 200, 126));
        palette.add(new Scalar(58, 130, 194));
        palette.add(new Scalar(189, 148, 110));
        palette.add(new Scalar(48, 57, 116));
        palette.add(new Scalar(136, 188, 192));
        palette.add(new Scalar(88, 57, 76));
        palette.add(new Scalar(52, 90, 71));
        palette.add(new Scalar(175, 160, 207));
    }

    private void img2graph() {
        gridGraph = new GridGraph((int)imgSize.width, (int)imgSize.height);
        imgBg.get(0, 0, buff);
        for (int i = 0; i < (int)imgSize.height; i++) {
            for (int j = 0; j < (int)imgSize.width; j++) {
                gridGraph.setBlocked(j, i, buff[i*(int)imgSize.width+j] == 0);
            }
        }
    }

    private void drawPath() {
        for (int i = 0; i < path.length-1; i++) {
            Imgproc.line(img, new Point(path[i][0], path[i][1]), new Point(path[i+1][0], path[i+1][1]), new Scalar(0, 0, 255), 5);
        }
    }
}
