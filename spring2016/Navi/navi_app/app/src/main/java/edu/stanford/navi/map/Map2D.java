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
    public Mat img;
    public Mat imgBg; // a binary image
    public Mat imgClean; // with no drawings
    public Bitmap imgBmp;

    private Context mContext;

    private GridGraph gridGraph;
    private OLSMultipleLinearRegression linearRegression;
    private LazyThetaStar lazyThetaStar;

    private List<Scalar> palette = new ArrayList<Scalar>();

    private List<Point> keypoints = new ArrayList<Point>();
    private List<String> keypointsNames = new ArrayList<String>();

    private Size screenSize;
    private Size imgSize; // For both map and bmp

    private byte []buff;
    private double []beta;
    private float[][] worldPath;
    private double scale;

    // load resource
    private String keypoints_txt = "keypoints.txt"; // for keypoints and keypointsNames
    private String mapping_txt = "mapping.txt";
    private int imgId = R.drawable.ikea5;

    /*
     * Three coordinate systems:
     *  - world
     *  - img: including map and bmp
     */

    public Map2D(Context context, int screenWidth, int screenHeight) {
        mContext = context;

        try {
            // Load map image specified by R.drawable.filename
            img = Utils.loadResource(mContext, imgId, CvType.CV_8UC3);
            Imgproc.cvtColor(img, img, Imgproc.COLOR_GRAY2RGB);

            // calculate image size
            screenSize = new Size(screenWidth, screenHeight);
            if (screenSize.width/screenSize.height >= img.cols()/img.rows()) {
                double imgHeight = screenSize.height;
                double imgWidth = imgHeight*img.cols()/img.rows();
                imgSize = new Size(imgWidth, imgHeight);
            } else {
                double imgWidth = screenSize.width;
                double imgHeight = imgWidth*img.rows()/img.cols();
                scale = imgWidth/img.cols();
                imgSize = new Size(imgWidth, imgHeight);
            }

            Imgproc.resize(img, img, imgSize, 0, 0, Imgproc.INTER_CUBIC);
            imgBg = Mat.zeros(img.rows(), img.cols(), CvType.CV_8U);
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }

        System.out.println("img width: " + img.cols() + ", img height: " + img.rows() + ", channel: " + img.channels());
        makePalette();
        preProcess();
        loadKeypoints();

        // createBitmap(int width, int height, Bitmap.Config config)
        imgBmp = Bitmap.createBitmap((int) imgSize.width, (int) imgSize.height, Bitmap.Config.ARGB_8888);
        buff = new byte[(int)img.total()];
        img2graph(); // must be called after the memory of buff is allocated
        imgClean = img.clone();
        linearRegression = new OLSMultipleLinearRegression();
        linearRegression.setNoIntercept(true);
        findAffine();
        updateBmp();
    }

    public float[] world2img(float worldX, float worldY) {
        float []imgCoor = new float[2];
        imgCoor[0] = (float)(beta[0]*worldX+beta[1]*worldY+beta[2]);
        imgCoor[1] = (float)(beta[3]*worldX+beta[4]*worldY+beta[5]);

        return imgCoor;
    }

    public float[][] img2world (int[][] imgCoor) {
        int len = imgCoor.length;
        float[][] worldPath = new float[len][2];

        float denom = (float) (beta[1]*beta[3]-beta[0]*beta[4]);
        for (int i = 0; i < len; i++) {
            float imgX = (float) imgCoor[i][0];
            float imgY = (float) imgCoor[i][1];
            worldPath[i][0] = (float)(beta[1]*imgY-beta[4]*imgX+beta[2]*beta[4]-beta[1]*beta[5])/denom;
            worldPath[i][1] = (float)(beta[3]*imgX-beta[0]*imgY+beta[0]*beta[5]-beta[2]*beta[3])/denom;
        }

        return worldPath;
    }

    private Bitmap updateBmp() {
        Utils.matToBitmap(img, imgBmp);
        return imgBmp;
    }

    private void cleanImg() {
        img = imgClean.clone();
    }

    public void computePath(int start, int end) {
        cleanImg();
        int[][] path;
        lazyThetaStar = new LazyThetaStar(gridGraph,
                (int)keypoints.get(start).x, (int)keypoints.get(start).y,
                (int)keypoints.get(end).x, (int)keypoints.get(end).y);
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        drawPath(path); // draw directly on img, that's why we need to call cleanImg()
        worldPath = img2world(path);
        updateBmp(); // img -> imgBmp
    }

    public void computePath(int imgX, int imgY, int end) {
        cleanImg();
        int[][] path;
        lazyThetaStar = new LazyThetaStar(gridGraph, imgX, imgY,
                (int)keypoints.get(end).x, (int)keypoints.get(end).y);
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        drawPath(path); // draw directly on img, that's why we need to call cleanImg()
        worldPath = img2world(path);
        updateBmp(); // img -> imgBmp
    }

    public float[][] getWolrdPath() {
        return worldPath;
    }

    public float[] getKeypoint(int position) {
        float []keypoint = new float[2];
        keypoint[0] = (float) keypoints.get(position).x;
        keypoint[1] = (float) keypoints.get(position).y;
        return keypoint;
    }

    public void creatPathSingleton() {
        Path path = Path.getSingletonObject();
        path.setpath(worldPath);
    }

    public String getKeypointName(int i) {
        return keypointsNames.get(i);
    }

    public String [] getKeypointsNames() {
        return keypointsNames.toArray(new String[0]);
    }

    private void preProcess() {
        Imgproc.cvtColor(img, imgBg, Imgproc.COLOR_RGB2GRAY);
        Imgproc.threshold(imgBg, imgBg, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
        Imgproc.cvtColor(imgBg, img, Imgproc.COLOR_GRAY2RGB);
    }

    private void loadKeypoints() {
        AssetManager am = mContext.getAssets();

        try {
            InputStream is = am.open(keypoints_txt);
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            String line;

            while ((line = reader.readLine()) != null) {
                String []tokens = line.split("[,]");
                Point keypoint = new Point(Integer.parseInt(tokens[0])*scale, Integer.parseInt(tokens[1])*scale);
                String keypointName = tokens[2];
                keypoints.add(keypoint);
                keypointsNames.add(keypointName);
            }
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
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

    private void drawPath(int [][]path) {
        for (int i = 0; i < path.length-1; i++) {
            Imgproc.line(img, new Point(path[i][0], path[i][1]), new Point(path[i+1][0], path[i+1][1]), new Scalar(0, 255, 0), (int)(8*scale));
        }
    }

    private void loadMapping(List<Point> imgCoors, List<Point> worldCoors) {
        AssetManager am = mContext.getAssets();

        try {
            InputStream is = am.open(mapping_txt);
            BufferedReader reader = new BufferedReader(new InputStreamReader(is));
            String line;

            while ((line = reader.readLine()) != null) {
                String []tokens = line.split("[,]");
                Point pt1 = new Point(Double.parseDouble(tokens[0])*scale, Double.parseDouble(tokens[1])*scale);
                Point pt2 = new Point(Double.parseDouble(tokens[2]), Double.parseDouble(tokens[3]));
                imgCoors.add(pt1);
                worldCoors.add(pt2);
            }
        } catch (IOException e) {
            System.out.println("bad");
            e.printStackTrace();
        }
    }

    public void findAffine() {
        List<Point> imgCoors = new ArrayList<Point>();
        List<Point> worldCoors = new ArrayList<Point>();
        loadMapping(imgCoors, worldCoors);

        if (imgCoors == null || worldCoors == null)
            return;
        assert imgCoors.size() == worldCoors.size();
        System.out.println("pairs of matching points: " + imgCoors.size());

        // Y = X*b
        double [][]X = new double[2*imgCoors.size()][];
        double []Y = new double[2*imgCoors.size()];
        for (int i = 0; i < imgCoors.size(); i++) {
            X[2*i] = new double[]{worldCoors.get(i).x, worldCoors.get(i).y, 1, 0, 0, 0};
            X[2*i+1] = new double[]{0, 0, 0, worldCoors.get(i).x, worldCoors.get(i).y, 1};
            Y[2*i] = imgCoors.get(i).x;
            Y[2*i+1] = imgCoors.get(i).y;
        }

        System.out.println("dim: " + X.length + "," + X[0].length + "," + Y.length);
        linearRegression.newSampleData(Y, X);
        beta = linearRegression.estimateRegressionParameters();
        System.out.println(beta[0]+","+beta[1]+","+beta[2]+","+beta[3]+","+beta[4]+","+beta[5]);

        System.out.println("Check:");
        for (int i = 0; i < imgCoors.size(); i++) {
            double tmp1 = beta[0]*worldCoors.get(i).x+beta[1]*worldCoors.get(i).y+beta[2];
            double tmp2 = beta[3]*worldCoors.get(i).x+beta[4]*worldCoors.get(i).y+beta[5];
            System.out.println(imgCoors.get(i).x+"/"+tmp1);
            System.out.println(imgCoors.get(i).y+"/"+tmp2);
        }
    }
}
