package edu.stanford.navi.adf;

import android.content.Context;
import android.graphics.drawable.Drawable;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static java.util.Arrays.asList;

import edu.stanford.navi.domain.*;

/**
 * Created by Emma on 5/18/16.
 */
public class Utils {
    public static final String DEFAULT_LOC = "quillen_616b";
    public static final String DEFAULT_JSON_LOC = "items.txt";

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

    public static void writeJson(JSONArray items, String filePath, Context context) {
        JSONObject itemsObj = new JSONObject();
        try {
            itemsObj.put("Items", items);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        String itemsStr = itemsObj.toString();
        writeToFile(filePath, itemsStr, context);
    }

    public static JSONArray readJson(String filePath, Context context) {
        String itemsStr = loadFromFile(filePath, context, ""); // default content is the empty string
        JSONArray items = new JSONArray();
        try {
            JSONObject itemsObj = new JSONObject(itemsStr);
            items = (JSONArray) itemsObj.get("Items");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return items;
    }

    public static JSONObject createJsonObj(Item item) {
        JSONObject itemObj = new JSONObject();
        try {
            itemObj.put("item", item);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return itemObj;
    }

    public static void testWriteJson(Context context) {
        String jsonLoc = DEFAULT_JSON_LOC;

        List<Item> items = new ArrayList<Item>();
        items.add(new Item("foo", new Coordinate(1f, 2f), new Coordinate(10f, 20f),
                new HashSet<String>(asList("A", "B", "C"))));
        items.add(new Item("bar", new Coordinate(3f, 4f), new Coordinate(30f, 40f),
                new HashSet<String>(asList("A", "C"))));
        items.add(new Item("baz", new Coordinate(5f, 6f), new Coordinate(50f, 60f),
                new HashSet<String>(asList("B", "C"))));

        JSONArray itemsJson = new JSONArray();
        for (int i = 0; i < 3; i++) {
            JSONObject itemObj = createJsonObj(items.get(i));
            if (!itemObj.isNull("item")) {
                itemsJson.put(itemObj);
            }
        }

        Utils.writeJson(itemsJson, jsonLoc, context);
    }

    public static void testReadJson(Context context) {
        String jsonLoc = DEFAULT_JSON_LOC;
        JSONArray items = Utils.readJson(jsonLoc, context);
        if (items.length() == 0) {
            System.out.println("JSON file doesn't exist!");
        } else {
            System.out.println(items.toString());
        }
    }
}
