package edu.stanford.navi.adf;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.opencv.core.Size;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import edu.stanford.navi.domain.Coordinate;
import edu.stanford.navi.domain.Item;

import static java.util.Arrays.asList;

/**
 * Created by Emma on 5/18/16.
 */
public class Utils {
    public static final String DEFAULT_LOC = "quillen_616b";
    public static final String DEFAULT_JSON_LOC = "items.txt";
    public static final boolean isSF = false;

    public static String getJsonLoc() {
        String jsonLoc;
        if (isSF) {
            jsonLoc = "sf_" + DEFAULT_JSON_LOC;
        }  else {
            jsonLoc = "ikea_" + DEFAULT_JSON_LOC;
        }
        return jsonLoc;
    }

    public static ArrayList<String> getADFNameList(ArrayList<String> uuidList, Tango tango) {
        ArrayList<String> nameList = new ArrayList<String>();
        for (String uuid: uuidList) {
            TangoAreaDescriptionMetaData metadata = tango.loadAreaDescriptionMetaData(uuid);
            byte[] nameBytes = metadata.get(TangoAreaDescriptionMetaData.KEY_NAME);
            if (nameBytes != null) {
                String name = new String(nameBytes);
                nameList.add(name);
            } // Do something if null
        }
        return nameList;
    }

    public static Map<String, String> getName2uuidMap(ArrayList<String> uuidList, Tango tango) {
        Map<String, String> map = new HashMap<String, String>();
        for (String uuid: uuidList) {
            TangoAreaDescriptionMetaData metadata = tango.loadAreaDescriptionMetaData(uuid);
            byte[] nameBytes = metadata.get(TangoAreaDescriptionMetaData.KEY_NAME);
            if (nameBytes != null) {
                String name = new String(nameBytes);
                map.put(name, uuid);
            } // Do something if null
        }
        return map;
    }

    public static String loadFromFile(String filePath, Context context, String defaultContent) {
        String content = defaultContent;
        try {
            String line;
            BufferedReader input = new BufferedReader(
                    new InputStreamReader(context.openFileInput(filePath)));
            if ((line = input.readLine()) != null) {
                content = line.split("\n")[0];
                System.out.println("Read from file: " + filePath + " " + content);
            }
        } catch (IOException e) {
            System.out.println("Fail to read file: " + filePath);
            e.printStackTrace();
        }
        return content;
    }

    public static void writeToFile(String filePath, String content, Context context) {
        try {
            OutputStreamWriter outputStreamWriter = new OutputStreamWriter(
                    context.openFileOutput(filePath, Context.MODE_PRIVATE));
            outputStreamWriter.write(content);
            outputStreamWriter.close();
            System.out.println("Write to file: " + filePath + " " + content);
        } catch (IOException e) {
            System.out.println("Fail to write to file: " + filePath);
            e.printStackTrace();
        }
    }

    public static Drawable getImage(Context context, String name) {
        Drawable img;
        try {
            img = context.getResources().getDrawable(
                    context.getResources().getIdentifier(name, "drawable", context.getPackageName()));
            System.out.println("Load owner map: " + name);
        } catch (Exception e) {
            e.printStackTrace();
            img = context.getResources().getDrawable(
                    context.getResources().getIdentifier(DEFAULT_LOC, "drawable", context.getPackageName()));
            System.out.println("Load default map: " + DEFAULT_LOC);
        }
        return img;
    }

    public static int getResourceId(Context context, String name) {
        int id = context.getResources().getIdentifier(name, "drawable", context.getPackageName());
        if (id == 0) {
            id = context.getResources().getIdentifier(DEFAULT_LOC, "drawable", context.getPackageName());
        }
        return id;
    }

    public static void writeJson(List<Item> items, String filePath, Context context) {
        Gson gson = new Gson();
        String jsonInString = gson.toJson(items);
        writeToFile(filePath, jsonInString, context);
    }

    public static List<Item> readJson(String filePath, Context context) {
        Gson gson = new Gson();
        String itemsStr = loadFromFile(filePath, context, "");
        List<Item> items = new ArrayList<Item>();
        if (itemsStr != "") {
            Type listOfTestObject = new TypeToken<List<Item>>() {
            }.getType();
            items = gson.fromJson(itemsStr, listOfTestObject);
        }
        return items;
    }

    public static void testWriteJson(Context context) {
        List<Item> items = new ArrayList<Item>();
        String jsonLoc = getJsonLoc();
        if (isSF) {
        } else {
            items.add(new Item("Home Organization", new Coordinate(281f,181f), new HashSet<String>(asList("On Sale"))));
            items.add(new Item("Shortcut", new Coordinate(183f,145f), new HashSet<String>()));
            items.add(new Item("Hangers", new Coordinate(374f, 147f), new HashSet<String>()));
            items.add(new Item("Laundry Bags", new Coordinate(420f,184f), new HashSet<String>(asList("On Sale"))));
            items.add(new Item("Trash Can", new Coordinate(232f,258f), new HashSet<String>()));
            items.add(new Item("Baskets", new Coordinate(273f,269f), new HashSet<String>(asList("On Sale"))));
            items.add(new Item("Gift Wraps", new Coordinate(342f,238f), new HashSet<String>()));
            items.add(new Item("Organization Boxes", new Coordinate(402f,264f), new HashSet<String>(asList("On Sale"))));
        }

        writeJson(items, jsonLoc, context);
    }

    public static void testReadJson(Context context) {
        List<Item> items = readJson(DEFAULT_JSON_LOC, context);
        System.out.println(items);
    }

    public static void drawLocation(Bitmap bitmap, int imgX, int imgY, Paint paint) {
        Canvas canvas = new Canvas(bitmap);
        canvas.drawCircle(imgX, imgY, 15, paint);

        return;
    }

    public static void drawText(Bitmap bitmap, String text, int imgX, int imgY, Paint paint) {
        Canvas canvas = new Canvas(bitmap);
        canvas.drawText(text, imgX, imgY, paint);

        return;
    }

    public static Coordinate screen2img(float x, float y, Size screenSize, Size imgSize) {
        float imgX = (float)(x*imgSize.width/screenSize.width);
        imgX = imgX > 0 ? imgX : 0;
        float imgY = (float)(y*imgSize.height/screenSize.height);
        imgY = imgY > 0 ? imgY : 0;
        return new Coordinate(imgX, imgY);
    }


}
