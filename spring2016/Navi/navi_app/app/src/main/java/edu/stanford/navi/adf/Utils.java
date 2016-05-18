package edu.stanford.navi.adf;

import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoAreaDescriptionMetaData;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created by Emma on 5/18/16.
 */
public class Utils {

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
}
