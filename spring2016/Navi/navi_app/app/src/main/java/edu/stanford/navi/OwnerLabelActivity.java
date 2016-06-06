package edu.stanford.navi;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.graphics.Typeface;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.ViewFlipper;


import com.google.atap.tangoservice.Tango;
import com.google.atap.tangoservice.TangoConfig;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Map;

import edu.stanford.navi.adf.Utils;

public class OwnerLabelActivity extends BaseActivity implements View.OnClickListener/*, AdapterView.OnItemClickListener*/ {

    private final String CONFIG_FILE = "config.txt";
    private final String ITEM_MANAGEMENT_FILE = "config.txt";

    private Tango mTango;
    private TangoConfig mConfig;

    private float mClickedMapCoordX;
    private float mClickedMapCoordY;

    private ArrayList<String> mFilterCategories;
    private ArrayList<String> mStoreItemsList;

    private Button mCancelAddItemButton;
    private Button mAddItemButton;
    private Button mCreateFilterButton;

    private ImageView imageView;
    private EditText mTextFieldLocationItem;
    private String selectedADFName;
    private String selectedUUID;
    private ArrayList<String> fullUUIDList;
    private ArrayList<String> fullADFnameList;
    private Map<String, String> name2uuidMap;

    private boolean mIsFirstStep = true;

    private JSONArray mStoreItemsForInternalStorage;

    private ViewFlipper vf;

    private AlertDialog mFilterNameCreationDialog;

    private ListView mItemListAsListView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_owner_label);

        mTango = new Tango(this);
        setUpADF();
        setUpMap();
        setUpUI();

        mStoreItemsForInternalStorage = Utils.readJson(ITEM_MANAGEMENT_FILE, this);
        if(mStoreItemsForInternalStorage.length() == 0) {
            mStoreItemsForInternalStorage = new JSONArray();
        }
        mFilterCategories = new ArrayList<String>();
        mStoreItemsList = new ArrayList<String>();
    }

    private void setUpFontHeaderAndCardInstruction() {
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");

        Typeface faceRegular = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Regular.otf");

        TextView stepHeader = (TextView) findViewById(R.id.stepHeader);
        TextView stepInstructions = (TextView) findViewById(R.id.stepInstructions);

        stepHeader.setTypeface(face);
        stepInstructions.setTypeface(faceRegular);

        TextView headerTxt = (TextView) findViewById(R.id.header_text);
        headerTxt.setTypeface(face);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.doneButton:
                Log.i("bob", "done");
                addItemToStorage();
                showFilterCardAndItemListView();
                break;
            case R.id.cancelButton:
                Log.i("bob", "cancel");
                showFilterCardAndItemListView();
                break;
            case R.id.createFilterButton:
                Log.i("bob", "creating filter");
                mFilterNameCreationDialog.show();
                break;
        }
    }

    private void showFilterCardAndItemListView() {
        // Clear text field
        mTextFieldLocationItem.setText("");

        // Close keyboard
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }

        vf.setDisplayedChild(2);

        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        Typeface faceRegular = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Regular.otf");

        TextView filterHeader = (TextView) findViewById(R.id.filterStoreItemsHeader);
        mCreateFilterButton = (Button) findViewById(R.id.createFilterButton);

        filterHeader.setTypeface(face);

        mCreateFilterButton.setTypeface(faceRegular);
        mCreateFilterButton.setOnClickListener(this);

//        mItemListAsListView = (ListView) findViewById(R.id.listOfItemsInEnviroment);
//        mItemListAsListView.setChoiceMode(ListView.CHOICE_MODE_SINGLE);
//        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, R.layout.list_item, R.id.Itemname, mStoreItemsList);
//        mItemListAsListView.setAdapter(adapter);
//        mItemListAsListView.setOnItemClickListener(this);

        StoreItemListAdapter adapter = new StoreItemListAdapter(this, mStoreItemsForInternalStorage, mStoreItemsList);
        mItemListAsListView = (ListView)findViewById(R.id.listOfItemsInEnviroment);
        mItemListAsListView.setAdapter(adapter);

        mItemListAsListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {

            @Override
            public void onItemClick(AdapterView<?> parent, View view,
                                    int position, long id) {
                // TODO Auto-generated method stub
                Log.i("Bob", "hihihi");
                //String Slecteditem= itemname[+position];
                // Toast.makeText(getApplicationContext(), Slecteditem, Toast.LENGTH_SHORT).show();

            }
        });
    }

//    public void onItemClick(AdapterView<?> parentView, View v, int pos, long id) {
//        // TODO: EDIT the item
//    }

    private void addItemToStorage() {
        String label = mTextFieldLocationItem.getText().toString();
        if(label.length() > 0) {
            mStoreItemsList.add(label);
            // Save item
            ArrayList<Float> coord2D = new ArrayList<Float>();
            coord2D.add(mClickedMapCoordX);
            coord2D.add(mClickedMapCoordY);
            ArrayList<Float> coord3D = new ArrayList<Float>();

            // TODO: localize to get onPoseAvailable!
            coord3D.add(0.0f);
            coord3D.add(0.0f);
            JSONObject item = Utils.createJsonItem(label, mFilterCategories, coord2D, coord3D);
            mStoreItemsForInternalStorage.put(item);
        }
    }

    private void setUpAddLocItemCard() {
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");

        Typeface faceRegular = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Regular.otf");

        TextView addlocationHeader = (TextView) findViewById(R.id.addLocCardHeader);
        addlocationHeader.setTypeface(face);

        mTextFieldLocationItem = (EditText) findViewById(R.id.textFieldLocationItem);
        mTextFieldLocationItem.setTypeface(faceRegular);

        mCancelAddItemButton = (Button) findViewById(R.id.cancelButton);
        mCancelAddItemButton.setTypeface(faceRegular);
        mCancelAddItemButton.setOnClickListener(this);

        mAddItemButton = (Button) findViewById(R.id.doneButton);
        mAddItemButton.setTypeface(face);
        mAddItemButton.setOnClickListener(this);
    }

    private void closeKeyboard() {
        InputMethodManager inputManager = (InputMethodManager)
                getSystemService(Context.INPUT_METHOD_SERVICE);

        inputManager.hideSoftInputFromWindow((null == getCurrentFocus()) ? null : getCurrentFocus().getWindowToken(),
                InputMethodManager.HIDE_NOT_ALWAYS);
    }

    private void setUpUI() {

        vf = (ViewFlipper) findViewById(R.id.vf);

        vf.setDisplayedChild(0);

        setUpFontHeaderAndCardInstruction();

        // 1. Instantiate an AlertDialog.Builder with its constructor
        AlertDialog.Builder builder = new AlertDialog.Builder(OwnerLabelActivity.this);

        // 2. Chain together various setter methods to set the dialog characteristics
        builder.setTitle("Create a filter category");

        //  LayoutInflater inflater = getActivity().getLayoutInflater();
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogView = inflater.inflate(R.layout.add_filter_label_dialog, null);
        builder.setView(dialogView);
        final EditText textFieldFilterCategory = (EditText) dialogView.findViewById(R.id.textFieldNameFilter);

        builder.setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int id) {
                Log.i("bob", "Okay'ed dialog box");
                mFilterCategories.add(textFieldFilterCategory.getText().toString());
                dialog.cancel();
            }
        });
        builder.setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int id) {
                Log.i("bob", "Dismissed dialog box");
                dialog.cancel();
            }
        });

        // 3. Get the AlertDialog from create()
        mFilterNameCreationDialog = builder.create();
//        List<String> filterItemsTemp = new ArrayList<String>();
//        filterItemsTemp.add("Android");
//        filterItemsTemp.add("iOS");
//        filterItemsTemp.add("AR / VR");
//
//        Spinner spinner = (Spinner) findViewById(R.id.filterSpinner);
//        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, filterItemsTemp);
//        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//        spinner.setPrompt("Filter labels");
    }

    public void setUpMap() {
        Drawable img = Utils.getImage(this, selectedADFName);
        imageView = (ImageView) findViewById(R.id.ownerMap);
        imageView.setImageDrawable(img);

        final TextView textView = (TextView)findViewById(R.id.textView);
        imageView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
//                if(mIsFirstStep) {
                    vf.setDisplayedChild(1);
                    setUpAddLocItemCard();
//                    mIsFirstStep = false;
//                }

                mClickedMapCoordX = event.getX();
                mClickedMapCoordY = event.getY();

                // TODO: Fix this to draw a balloon
                textView.setText("Map coordinates : " +
                        String.valueOf(event.getX()) + "x" + String.valueOf(event.getY()));
                return true;
            }
        });
    }

    private void setUpADF() {
        fullUUIDList = mTango.listAreaDescriptions();
        fullADFnameList = Utils.getADFNameList(fullUUIDList, mTango);
        name2uuidMap = Utils.getName2uuidMap(fullUUIDList, mTango);
        selectedADFName = Utils.loadFromFile(CONFIG_FILE, this, Utils.DEFAULT_LOC);
    }

}

