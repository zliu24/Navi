package edu.stanford.navi.adf;

import android.content.Context;
import android.graphics.drawable.Drawable;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created by Emma on 5/18/16.
 */
public class Utils {
    private static final String DEFAULT_LOC = "quillen_616b";

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

    public static HashMap<String, String> getName2uuidMap(ArrayList<String> uuidList, Tango tango) {
        HashMap<String, String> map = new HashMap<String, String>();
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

    public static String loadADFfromFile(String filePath, Context context) {
        String adfName = DEFAULT_LOC;
        try {
            String line;
            BufferedReader input = new BufferedReader(new InputStreamReader(context.openFileInput(filePath)));
            if ((line = input.readLine()) != null) {
                adfName = line.split("\n")[0];
                System.out.println("Read from file: " + filePath + " " + adfName);
            }
        } catch (IOException e) {
            System.out.println("Fail to read adfFile: " + filePath);
            e.printStackTrace();
        }
        return adfName;
    }

    public static void writeADFtoFile(String filePath, String adfName, Context context) {
        if (adfName == null)
            adfName = DEFAULT_LOC;
        try {
            OutputStreamWriter outputStreamWriter = new OutputStreamWriter(context.openFileOutput(filePath, Context.MODE_PRIVATE));
            outputStreamWriter.write(adfName);
            outputStreamWriter.close();
            System.out.println("Write to file: " + filePath + " " + adfName);
        } catch (IOException e) {
            System.out.println("Fail to write adfFile: " + filePath);
            e.printStackTrace();
        }
    }

    public static Drawable getImage(Context context, String name) {
        Drawable img;
        try {
            img = context.getResources().getDrawable(context.getResources().getIdentifier(name, "drawable", context.getPackageName()));
            System.out.println("Load owner map: " + name);
        } catch (Exception e) {
            e.printStackTrace();
            img = context.getResources().getDrawable(context.getResources().getIdentifier(DEFAULT_LOC, "drawable", context.getPackageName()));
            System.out.println("Load default map: " + DEFAULT_LOC);
        }
        return img;
    }
}
