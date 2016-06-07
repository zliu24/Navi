package edu.stanford.navi;

/**
 * Created by catherinemullings on 6/4/16.
 */
import android.app.Activity;
import android.graphics.Typeface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

import edu.stanford.navi.domain.Item;

public class StoreItemListAdapter extends ArrayAdapter<String> {
    private final Activity context;
    // private final String[] itemname;
    private final List<Item> mStoreItemsForInternalStorage;

    public StoreItemListAdapter(Activity context, List<Item> storeItemsForInternalStorage) {
        super(context, R.layout.list_item, (ArrayList)storeItemsForInternalStorage);
        // TODO Auto-generated constructor stub

        this.context=context;
        this.mStoreItemsForInternalStorage = storeItemsForInternalStorage;
    }

    public View getView(int position,View view,ViewGroup parent) {
        LayoutInflater inflater=context.getLayoutInflater();
        View rowView=inflater.inflate(R.layout.list_item, null,true);

        TextView txtTitle = (TextView) rowView.findViewById(R.id.itemname);
        TextView filterTitle = (TextView) rowView.findViewById(R.id.itemFilter);

        Item item = mStoreItemsForInternalStorage.get(position);


        Typeface faceRegular = Typeface.createFromAsset(context.getAssets(), "fonts/AvenirNextLTPro-Regular.otf");
        txtTitle.setTypeface(faceRegular);
        txtTitle.setText(item.getName());

        Object[] filters =  item.getCategories().toArray();
        if (filters.length > 0) {
            filterTitle.setTypeface(faceRegular);
            filterTitle.setText((String) filters[0]);
        }

        return rowView;

    };
}