package edu.stanford.navi.map;

/**
 * Created by alan on 4/14/16.
 */

import android.content.Context;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;

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
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.List;

import edu.stanford.navi.OwnerLabelActivity;
import edu.stanford.navi.OwnerMapActivity;
import edu.stanford.navi.pathfinding.LazyThetaStar;
import edu.stanford.navi.pathfinding.datatypes.GridGraph;

public class Map2D {
    public Mat img;
    public Mat imgBg; // a binary image
    public Bitmap imgBmp;
    public Bitmap imgBmpNoPath;
    public Bitmap imgBmpNoCurLoc;
    public int nKeypoints;

    private Context mContext;
    private String mapName;

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
    public float[][] worldPath;
    public int[][] path;
    private double scale_png2img;
    public double scale_img2graph = 0.25;
    public float minDistThres = 80;

    // load resource
    private String keypoints_txt = "keypoints.txt"; // for keypoints and keypointsNames
    private String mapping_txt = "mapping.txt";
    private final String CONFIG_FILE = "config.txt";
    private int imgId;

    // drawings
    Canvas canvas;
    Paint paintKeypoints;
    Paint paintCurLoc;
    Paint paintClosestPt;
    Paint paintPath;

    /*
     * Three coordinate systems:
     *  - world
     *  - img: including map and bmp
     */

    public Map2D(Context context, int screenWidth, int screenHeight) {
        mContext = context;

        try {
            // Load map image specified by R.drawable.filename
            Resources resources = context.getResources();
            mapName = edu.stanford.navi.adf.Utils.loadFromFile(
                    CONFIG_FILE, context, edu.stanford.navi.adf.Utils.DEFAULT_LOC);
            imgId = edu.stanford.navi.adf.Utils.getResourceId(mContext, mapName);

            img = Utils.loadResource(mContext, imgId, CvType.CV_8UC3);

        } catch (Exception e) {
            try {
                // Load default location
                mapName = edu.stanford.navi.adf.Utils.DEFAULT_LOC;
                imgId = context.getResources().getIdentifier(mapName, "drawable", context.getPackageName());
                img = Utils.loadResource(mContext, imgId, CvType.CV_8UC3);
            }
            catch (Exception e2) {
                System.out.println("Failed to load default map image!");
                e2.printStackTrace();
            }
        }
        Imgproc.cvtColor(img, img, Imgproc.COLOR_GRAY2RGB);

        // calculate image size
        screenSize = new Size(screenWidth, screenHeight);
        if (screenSize.width/screenSize.height >= img.cols()/img.rows()) {
            double imgHeight = screenSize.height;
            double imgWidth = (double) imgHeight*img.cols()/img.rows();
            scale_png2img = (double) imgWidth/img.cols();
            imgSize = new Size(imgWidth, imgHeight);
        } else {
            double imgWidth = screenSize.width;
            double imgHeight = (double) imgWidth*img.rows()/img.cols();
            scale_png2img = (double) imgWidth/img.cols();
            imgSize = new Size(imgWidth, imgHeight);
        }

        Imgproc.resize(img, img, imgSize, 0, 0, Imgproc.INTER_CUBIC);

        System.out.println("img width: " + img.cols() + ", img height: " + img.rows() + ", channel: " + img.channels());
        makePalette();
        preProcess();
        loadKeypoints();

        // createBitmap(int width, int height, Bitmap.Config config)
        imgBmp = Bitmap.createBitmap((int) imgSize.width, (int) imgSize.height, Bitmap.Config.ARGB_8888);
        Utils.matToBitmap(img, imgBmp);

        buff = new byte[(int)imgBg.total()]; // must be called after preProcess() to get imgBg
        img2graph(); // must be called after the memory of buff is allocated
        linearRegression = new OLSMultipleLinearRegression();
        linearRegression.setNoIntercept(true);
        findAffine();

        canvas = new Canvas(imgBmp);
        paintKeypoints = new Paint();
        paintCurLoc = new Paint();
        paintClosestPt = new Paint();
        paintPath = new Paint();

        paintKeypoints.setARGB(255, 86, 208, 193);
        paintKeypoints.setStyle(Paint.Style.FILL);
        paintKeypoints.setTextSize(30);
        paintCurLoc.setARGB(255, 255, 196, 37);
        paintCurLoc.setStyle(Paint.Style.FILL);
        paintCurLoc.setTextSize(30);
        paintClosestPt.setARGB(255, 120, 117, 86);
        paintClosestPt.setStyle(Paint.Style.FILL);
        paintPath.setARGB(255, 255, 155, 155);
        paintPath.setStrokeWidth(3);

        imgBmpNoPath = imgBmp.copy(Bitmap.Config.ARGB_8888, true);
        imgBmpNoCurLoc = imgBmp.copy(Bitmap.Config.ARGB_8888, true);

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

    public float[] img2world(int imgX, int imgY) {
        float []worldCoor = new float[2];
        float denom = (float) (beta[1]*beta[3]-beta[0]*beta[4]);
        worldCoor[0] = (float) (beta[1]*imgY-beta[4]*imgX+beta[2]*beta[4]-beta[1]*beta[5])/denom;
        worldCoor[1] = (float) (beta[3]*imgX-beta[0]*imgY+beta[0]*beta[5]-beta[2]*beta[3])/denom;
        return worldCoor;
    }

    public void computeAndDrawPath(int start, int end) {
        System.out.println("computing");
        imgBmp = imgBmpNoPath.copy(Bitmap.Config.ARGB_8888, true);
        canvas = new Canvas(imgBmp);
        drawKeyPoints();

        lazyThetaStar = new LazyThetaStar(gridGraph,
                (int)(keypoints.get(start).x*scale_img2graph),
                (int)(keypoints.get(start).y*scale_img2graph),
                (int)(keypoints.get(end).x*scale_img2graph),
                (int)(keypoints.get(end).y*scale_img2graph));
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        fixScale();
        drawPath();
        worldPath = img2world(path);
        imgBmpNoCurLoc = imgBmp.copy(Bitmap.Config.ARGB_8888, true);
        System.out.println("computing done");
    }

    private void fixScale() {
        for (int i = 0; i < path.length; i++) {
            path[i][0] = (int) (path[i][0]/scale_img2graph);
            path[i][1] = (int) (path[i][1]/scale_img2graph);
        }
    }

    public void computeAndDrawPath(int imgX, int imgY, int end) {
        System.out.println("computing");
        imgBmp = imgBmpNoPath.copy(Bitmap.Config.ARGB_8888, true);
        canvas = new Canvas(imgBmp);
        drawKeyPoints();

        lazyThetaStar = new LazyThetaStar(gridGraph,
                (int)(imgX*scale_img2graph),
                (int)(imgY*scale_img2graph),
                (int)(keypoints.get(end).x*scale_img2graph),
                (int)(keypoints.get(end).y*scale_img2graph));
        lazyThetaStar.computePath();
        path = lazyThetaStar.getPath();
        fixScale();
        drawPath();
        worldPath = img2world(path);

        imgBmpNoCurLoc = imgBmp.copy(Bitmap.Config.ARGB_8888, true);
        System.out.println("computing done");
    }

    public float drawCurLoc(int imgX, int imgY, int position) {
        imgBmp = imgBmpNoCurLoc.copy(Bitmap.Config.ARGB_8888, true);
        canvas = new Canvas(imgBmp);
        drawKeyPoints();
        canvas.drawCircle(imgX, imgY, 15, paintCurLoc);
        canvas.drawText("You are here!", imgX + 10, imgY - 10, paintCurLoc);
        float[] closestPt = getCurLocOnPath(imgX, imgY, position);
        if (closestPt != null) {
            canvas.drawCircle(closestPt[0], closestPt[1], 15, paintClosestPt);
            return closestPt[2];
        }
        return -1;
    }

    public float[] getKeypoint(int position) {
        float []keypoint = new float[2];
        keypoint[0] = (float) keypoints.get(position).x;
        keypoint[1] = (float) keypoints.get(position).y;
        return keypoint;
    }

    public String getKeypointName(int i) {
        return keypointsNames.get(i);
    }

    public String [] getKeypointsNames() {
        ArrayList<String> numberedNames = new ArrayList<String>();
        for (int i = 0; i < keypointsNames.size(); i++) {
            numberedNames.add((new Integer(i+1)).toString() + ". " + keypointsNames.get(i));
        }
        return numberedNames.toArray(new String[0]);
    }

    private void preProcess() {
        imgBg = Mat.zeros(img.rows(), img.cols(), CvType.CV_8U);
        Imgproc.cvtColor(img, imgBg, Imgproc.COLOR_RGB2GRAY);
        Imgproc.threshold(imgBg, imgBg, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);
        Imgproc.cvtColor(imgBg, img, Imgproc.COLOR_GRAY2RGB);
        Imgproc.resize(imgBg, imgBg, new Size(0, 0), scale_img2graph, scale_img2graph, Imgproc.INTER_CUBIC);
    }

    private void loadKeypoints() {
        String keypointsFile = mapName + OwnerLabelActivity.KEYPOINT_SUFFIX;
        BufferedReader reader = null;

        try {
            reader = new BufferedReader(new InputStreamReader(mContext.openFileInput(keypointsFile)));
        } catch (IOException e) {
            System.out.println(keypointsFile + " not found! Loading default keypoints.");
            // Load from asset
            try {
                AssetManager am = mContext.getAssets();
                InputStream is = am.open(keypoints_txt);
                reader = new BufferedReader(new InputStreamReader(is));
            } catch (IOException e1) {
                e1.printStackTrace();
            }
        } finally {
            try {
                String line;
                while ((line = reader.readLine()) != null) {
                    String []tokens = line.split("[,]");
                    Point keypoint = new Point(Integer.parseInt(tokens[0])*scale_png2img, Integer.parseInt(tokens[1])*scale_png2img);
                    String keypointName = tokens[2];
                    keypoints.add(keypoint);
                    keypointsNames.add(keypointName);
                }
                nKeypoints = keypoints.size();
            } catch (IOException e2) {
                e2.printStackTrace();
            }
        }
    }

    public void drawKeyPoints() {
        for (int i = 0; i < nKeypoints; i++) {
            float []keypoint = this.getKeypoint(i);
            canvas.drawCircle(keypoint[0], keypoint[1], 15, paintKeypoints);
            canvas.drawText(this.getKeypointName(i), keypoint[0]+10, keypoint[1]-10, paintKeypoints);
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
        System.out.println("GridGraph: " + imgBg.cols() + ", " + imgBg.rows());
        gridGraph = new GridGraph((int)imgBg.cols(), (int)imgBg.rows());
        imgBg.get(0, 0, buff);
        for (int i = 0; i < (int)imgBg.rows(); i++) {
            for (int j = 0; j < (int)imgBg.cols(); j++) {
                gridGraph.setBlocked(j, i, buff[i*(int)imgBg.cols()+j] == 0);
            }
        }
    }

    private void drawPath() {
        System.out.println("path length: " + path.length);
        for (int i = 0; i < path.length-1; i++) {
            canvas.drawLine((float) path[i][0],
                    (float) path[i][1],
                    (float) path[i + 1][0],
                    (float) path[i + 1][1],
                    paintPath);
        }
    }

    private double distPtAndLineSegment(float x1, float y1, float x2, float y2, float x, float y) {
        float A = x - x1;
        float B = y - y1;
        float C = x2 - x1;
        float D = y2 - y1;

        float dot = A*C + B*D;
        float len_sq = C*C + D*D;
        float param = -1;
        if (len_sq != 0) //in case of 0 length line
            param = dot/len_sq;

        float xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param*C;
            yy = y1 + param*D;
        }

        float dx = x - xx;
        float dy = y - yy;
        return Math.sqrt(dx*dx + dy*dy);
    }

    private float[] getClosestPt(float x1, float y1, float x2, float y2, float x, float y) {
        float px = x2 - x1;
        float py = y2 - y1;
        float dAB = px*px + py*py;
        float u = ((x - x1) * px + (y - y1) * py) / dAB;
        return new float[] {x1 + u * px, y1 + u * py};
    }

    private float[] getCurLocOnPath(int imgX, int imgY, int position) {
        double minDist = 999999999;
        float []closestPt = null;
        if (path == null) {
            return null;
        }
        for (int i = 0; i < path.length-1; i++) {
            float x1 = (float) path[i][0];
            float y1 = (float) path[i][1];
            float x2 = (float) path[i + 1][0];
            float y2 = (float) path[i + 1][1];
            double dist = distPtAndLineSegment(x1, y1, x2, y2, imgX, imgY);
            if (dist < minDist) {
                minDist = dist;
                closestPt = getClosestPt(x1, y1, x2, y2, imgX, imgY);
            }
        }

        return new float[] {closestPt[0], closestPt[1], (float)minDist};
    }

    private void loadMapping(List<Point> imgCoors, List<Point> worldCoors) {
        String mapping = mapName + OwnerMapActivity.MAPPING_SUFFIX;
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new InputStreamReader(mContext.openFileInput(mapping)));
        } catch (IOException e){
            System.out.println(mapping + " not found! Loading default mapping.");
            // Load from asset
            try {
                AssetManager am = mContext.getAssets();
                InputStream is = am.open(mapping_txt);
                reader = new BufferedReader(new InputStreamReader(is));
            } catch (IOException e1) {
                e1.printStackTrace();
            }
        } finally {
            try {
                String line;
                while ((line = reader.readLine()) != null) {
                    String[] tokens = line.split("[,]");
                    Point pt1 = new Point(Double.parseDouble(tokens[0]) * scale_png2img, Double.parseDouble(tokens[1]) * scale_png2img);
                    Point pt2 = new Point(Double.parseDouble(tokens[2]), Double.parseDouble(tokens[3]));
                    imgCoors.add(pt1);
                    worldCoors.add(pt2);
                }
            } catch (IOException e2) {
                e2.printStackTrace();
            }
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

    public Size getImgSize() {
        return imgSize;
    }

    public double getRaw2ImgScale() {
        return scale_png2img;
    }
    public Size getScreenSize() {
        return screenSize;
    }

}
