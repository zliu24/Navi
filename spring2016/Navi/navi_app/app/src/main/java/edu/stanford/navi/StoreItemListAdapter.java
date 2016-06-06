package edu.stanford.navi;

/**
 * Created by catherinemullings on 6/4/16.
 */
import android.app.Activity;
import android.graphics.Typeface;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import edu.stanford.navi.domain.Item;

import java.util.ArrayList;

public class StoreItemListAdapter extends ArrayAdapter<String> {
    private final Activity context;
    // private final String[] itemname;
    private final JSONArray mStoreItemsForInternalStorage;

    public StoreItemListAdapter(Activity context, JSONArray storeItemsForInternalStorage, ArrayList<String> storeItemsList) {
        super(context, R.layout.list_item, storeItemsList);
        // TODO Auto-generated constructor stub

        this.context=context;
        this.mStoreItemsForInternalStorage = storeItemsForInternalStorage;
    }

    public View getView(int position,View view,ViewGroup parent) {
        LayoutInflater inflater=context.getLayoutInflater();
        View rowView=inflater.inflate(R.layout.list_item, null,true);

        TextView txtTitle = (TextView) rowView.findViewById(R.id.itemname);
        //ImageView imageView = (ImageView) rowView.findViewById(R.id.icon);
        //TextView extratxt = (TextView) rowView.findViewById(R.id.textView1);

        JSONObject item = new JSONObject();
        try {
            item = (JSONObject)mStoreItemsForInternalStorage.get(position);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        String s = "";
        try {
            s = (String)((Item)item.get("item")).getName();
        } catch (JSONException e) {
            Log.i("bob", "UH OH");
            e.printStackTrace();
        }

        Typeface faceRegular = Typeface.createFromAsset(context.getAssets(), "fonts/AvenirNextLTPro-Regular.otf");
        txtTitle.setTypeface(faceRegular);

        txtTitle.setText(s);
        return rowView;

    };
}