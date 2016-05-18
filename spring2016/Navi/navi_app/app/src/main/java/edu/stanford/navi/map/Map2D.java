package edu.stanford.navi.map;

/**
 * Created by alan on 4/14/16.
 */

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Bitmap;

import org.apache.commons.math3.stat.regression.OLSMultipleLinearRegression;
import org.opencv.android.Utils;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Point;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

import edu.stanford.navi.R;
import edu.stanford.navi.pathfinding.LazyThetaStar;
import edu.stanford.navi.pathfinding.datatypes.GridGraph;

public class Map2D {
    public Mat imgBg;
    public Mat img;
    public Mat imgClean;
    public Mat imgResize;
    public Bitmap imgBmp;
    private OLSMultipleLinearRegression linearRegression;
    private LazyThetaStar lazyThetaStar;
    private List<Scalar> palette = new ArrayList<Scalar>();
    private Context mContext;
    public List<Point> points = new ArrayList<Point>();
    private List<String> locations = new ArrayList<String>();
    private Size screenSize;
    private Size bmpSize;
    private Size imgSize;
    private GridGraph gridGraph;
    private byte []buff;
    private double []beta;
    private float[][] worldPath;
    private double scale = 0.25;

    public Map2D(Context context, int screenWidth, int screenHeight) {
        mContext = context;

        try {
            // Load map image specified by R.drawable.filename
            img = Utils.loadResource(mContext, R.drawable.ikea, CvType.CV_8UC3);
            Imgproc.cvtColor(img, img, Imgproc.COLOR_GRAY2RGB);
            Imgproc.resize(img, img, new Size(0, 0), scale, scale, Imgproc.INTER_LINEAR);
            imgBg = Mat.zeros(img.rows(), img.cols(), CvType.CV_8U);
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }

        System.out.println("img width: "+img.cols()+", img height: "+img.rows()+", channel: "+img.channels());
        screenSize = new Size(screenWidth, screenHeight);
        makePalette();
        preProcess();
        loadCoordinates();

        double bmpWidth = screenSize.width;
        double bmpHeight = (double)img.rows()/img.cols()*screenSize.width;
        System.out.println("bmp width: "+bmpWidth+", bmp height: "+bmpHeight);
        bmpSize = new Size(bmpWidth, bmpHeight);
        imgSize = new Size(img.cols(), img.rows());
        // createBitmap(int width, int height, Bitmap.Config config)
        imgBmp = Bitmap.createBitmap((int) bmpSize.width, (int) bmpSize.height, Bitmap.Config.ARGB_8888);
        // Mat::zeros(int rows, int cols, int type)¶
        imgResize = Mat.zeros((int) bmpSize.height, (int) bmpSize.width, CvType.CV_8U);
        buff = new byte[(int)img.total()];
        img2graph(); // must be called after the memory of buff is allocated
        imgClean = img.clone();
        linearRegression = new OLSMultipleLinearRegression();
        linearRegression.setNoIntercept(true);
        findAffine();
        updateBmp();
    }

    public float[] world2bmp(float worldX, float worldY) {
        float mapX = (float)(beta[0]*worldX+beta[1]*worldY+beta[2]);
        float mapY = (float)(beta[3]*worldX+beta[4]*worldY+beta[5]);

        float []bmpCoor = new float[2];
        bmpCoor[0] = (float)(mapX/imgSize.width*bmpSize.width);
        bmpCoor[1] = (float)(mapY/imgSize.height*bmpSize.height);

        return bmpCoor;
    }

    public float[] world2map(float worldX, float worldY) {
        float []mapCoor = new float[2];
        mapCoor[0] = (float)(beta[0]*worldX+beta[1]*worldY+beta[2]);
        mapCoor[1] = (float)(beta[3]*worldX+beta[4]*worldY+beta[5]);

        return mapCoor;
    }

    public float[][] map2world (int[][] mapCoors) {
        int len = mapCoors.length;
        float[][] worldPath = new float[len][2];

        float denom = (float) (beta[1]*beta[3]-beta[0]*beta[4]);
        for (int i = 0; i < len; i++) {
            float mapX = (float) mapCoors[i][0];
            float mapY = (float) mapCoors[i][1];
            worldPath[i][0] = (float)(beta[1]*mapY-beta[4]*mapX+beta[2]*beta[4]-beta[1]*beta[5])/denom;
            worldPath[i][1] = (float)(beta[3]*mapX-beta[0]*mapY+beta[0]*beta[5]-beta[2]*beta[3])/denom;
        }

        return worldPath;
    }

    public float[] map2bmp(float mapX, float mapY) {
        float []bmpCoor = new float[2];
        bmpCoor[0] = (float)(mapX/imgSize.width*bmpSize.width);
        bmpCoor[1] = (float)(mapY/imgSize.height*bmpSize.height);

        return bmpCoor;
    }

    public float[][] map2bmp(int [][]mapCoors) {
        int len = mapCoors.length;
        float [][]bmpCoors = new float[len][2];
        for (int i = 0; i < len; i++) {
            bmpCoors[i][0] = (float)((float)mapCoors[i][0]/imgSize.width*bmpSize.width);
            bmpCoors[i][1] = (float)((float)mapCoors[i][1]/imgSize.height*bmpSize.height);
        }

        return bmpCoors;
    }

    private Bitmap updateBmp() {
        Imgproc.resize(img, imgResize, bmpSize);
        Utils.matToBitmap(imgResize, imgBmp);
        return imgBmp;
    }

    private void cleanImg() {
        img = imgClean.clone();
    }

    public void computePath(int start, int end) {
        cleanImg();
        int[][] path;
        lazyThetaStar = new LazyThetaStar(gridGraph, (int)points.get(start).x, (int)points.get(start).y,
                (int)points.get(end).x, (int)points.get(end).y);
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        drawPath(path);
        worldPath = map2world(path);
        updateBmp();
    }

    public void computePath(int mapX, int mapY, int end) {
        cleanImg();
        int[][] path;
        lazyThetaStar = new LazyThetaStar(gridGraph, mapX, mapY,
                (int)points.get(end).x, (int)points.get(end).y);
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        drawPath(path);
        worldPath = map2world(path);
        updateBmp();
    }

    public float[][] getWolrdPath() {
        return worldPath;
    }

    public void creatPathSingleton() {
        Path path = Path.getSingletonObject();
        path.setpath(worldPath);
    }

    public String getLocation(int i) {
        return locations.get(i);
    }

    public String [] getLocations() {
        return locations.toArray(new String[0]);
    }

    private void preProcess() {
        Imgproc.cvtColor(img, imgBg, Imgproc.COLOR_RGB2GRAY);
        Imgproc.threshold(imgBg, imgBg, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
        Imgproc.cvtColor(imgBg, img, Imgproc.COLOR_GRAY2RGB);
    }

    private void loadCoordinates() {
        AssetManager am = mContext.getAssets();

        try {
            InputStream is = am.open("coordinates.txt");
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            String line;

            while ((line = reader.readLine()) != null) {
                String []tokens = line.split("[,]");
                Point pt = new Point(Integer.parseInt(tokens[0])*scale, Integer.parseInt(tokens[1])*scale);
                String loc = tokens[2];
                points.add(pt);
                locations.add(loc);
            }
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }

        /*
        for (int i = 0; i < points.size(); i++) {
            Point pt = points.get(i);
            System.out.println(locations.get(i)+": ("+pt.x+", "+pt.y+")");
            Imgproc.circle(img, pt, 30, palette.get(i), -1);
        }
        */
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

    private void drawPath(int [][]path) {
        for (int i = 0; i < path.length-1; i++) {
            Imgproc.line(img, new Point(path[i][0], path[i][1]), new Point(path[i+1][0], path[i+1][1]), new Scalar(0, 255, 0), (int)(8*scale));
        }
    }

    private void loadMapping(List<Point> mapCoors, List<Point> worldCoors) {
        AssetManager am = mContext.getAssets();

        try {
            InputStream is = am.open("mapping.txt");
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            String line;

            while ((line = reader.readLine()) != null) {
                String []tokens = line.split("[,]");
                Point pt1 = new Point(Double.parseDouble(tokens[0])*scale, Double.parseDouble(tokens[1])*scale);
                Point pt2 = new Point(Double.parseDouble(tokens[2]), Double.parseDouble(tokens[3]));
                mapCoors.add(pt1);
                worldCoors.add(pt2);
            }
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }
    }

    public void findAffine() {
        List<Point> mapCoors = new ArrayList<Point>();
        List<Point> worldCoors = new ArrayList<Point>();
        loadMapping(mapCoors, worldCoors);

        if (mapCoors == null || worldCoors == null)
            return;
        assert mapCoors.size() == worldCoors.size();
        System.out.println("pairs of matching points: "+mapCoors.size());

        // Y = X*b
        double [][]X = new double[2*mapCoors.size()][];
        double []Y = new double[2*mapCoors.size()];
        for (int i = 0; i < mapCoors.size(); i++) {
            X[2*i] = new double[]{worldCoors.get(i).x, worldCoors.get(i).y, 1, 0, 0, 0};
            X[2*i+1] = new double[]{0, 0, 0, worldCoors.get(i).x, worldCoors.get(i).y, 1};
            Y[2*i] = mapCoors.get(i).x;
            Y[2*i+1] = mapCoors.get(i).y;
        }

        System.out.println("dim: " + X.length + "," + X[0].length + "," + Y.length);
        linearRegression.newSampleData(Y, X);
        beta = linearRegression.estimateRegressionParameters();
        System.out.println(beta[0]+","+beta[1]+","+beta[2]+","+beta[3]+","+beta[4]+","+beta[5]);

        System.out.println("Check:");
        for (int i = 0; i < mapCoors.size(); i++) {
            double tmp1 = beta[0]*worldCoors.get(i).x+beta[1]*worldCoors.get(i).y+beta[2];
            double tmp2 = beta[3]*worldCoors.get(i).x+beta[4]*worldCoors.get(i).y+beta[5];
            System.out.println(mapCoors.get(i).x+"/"+tmp1);
            System.out.println(mapCoors.get(i).y+"/"+tmp2);
        }
    }
}
