package edu.stanford.navi.adf;

import android.content.res.AssetManager;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created by Emma on 5/18/16.
 */
public class Utils {
    private static final String DEFAULT_ADF = "616b";

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

    public static String loadADF(String filePath, AssetManager assetManager) {
        String adfName = DEFAULT_ADF;
        try {
            InputStream adfFile = assetManager.open(filePath);
            BufferedReader reader = new BufferedReader(new InputStreamReader(adfFile));
            adfName = (reader.readLine()).split("\n")[0];
        } catch (IOException e) {
            System.out.println("Fail to read adfFile: " + filePath);
            e.printStackTrace();
        }
        return adfName;
    }
}
