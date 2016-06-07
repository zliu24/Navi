package edu.stanford.navi;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.ViewFlipper;

import org.opencv.android.BaseLoaderCallback;
import org.opencv.android.LoaderCallbackInterface;
import org.opencv.android.OpenCVLoader;
import org.opencv.core.Size;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import edu.stanford.navi.adf.Utils;
import edu.stanford.navi.domain.Coordinate;
import edu.stanford.navi.domain.Item;
import edu.stanford.navi.map.Map2D;

public class OwnerLabelActivity extends BaseActivity implements View.OnClickListener/*, AdapterView.OnItemClickListener*/ {

    private final String ITEM_MANAGEMENT_FILE = "items.txt";

    private Map2D map;
    private Bitmap mapBitmap;
    private Paint labelPaint;
    private Paint disabledPaint;
    private Coordinate selectedCoord;
    private List<Coordinate> imageCoords;


    private Set<String> mFilterCategories;

    private Button mCancelAddItemButton;
    private Button mAddItemButton;
    private Button mCreateFilterButton;

    private ImageView imageView;
    private EditText mTextFieldLocationItem;

    private boolean mIsFirstStep = true;

    private ArrayList<String> mStoreItemsList;
    private ArrayList<Item> mItemsObjList;

    private ViewFlipper vf;
    private AlertDialog mFilterNameCreationDialog;
    private ListView mItemListAsListView;

    private static final String TAG = OwnerLabelActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_owner_label);

        setUpUI();

        mItemsObjList = (ArrayList<Item>) Utils.readJson(ITEM_MANAGEMENT_FILE, this);
        if(mItemsObjList.size() == 0) {
            mItemsObjList = new ArrayList<Item>();
        }

        mStoreItemsList = new ArrayList<String>();
        mFilterCategories = new HashSet<String>();
        imageCoords = new ArrayList<Coordinate>();

        labelPaint = new Paint();
        labelPaint.setColor(Color.RED);
        labelPaint.setStyle(Paint.Style.FILL);
        labelPaint.setTextSize(30);

        disabledPaint = new Paint();
        disabledPaint.setColor(Color.GRAY);
        disabledPaint.setStyle(Paint.Style.FILL);
        disabledPaint.setTextSize(30);

        OpenCVLoader.initAsync(OpenCVLoader.OPENCV_VERSION_3_1_0, this, mLoaderCallback);
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
    }

    public void onItemClick(AdapterView<?> parentView, View v, int pos, long id) {
        // TODO: EDIT the item
    }

    private void addItemToStorage() {
        String label = mTextFieldLocationItem.getText().toString();
        if(label.length() > 0) {
            mStoreItemsList.add(label);

            Coordinate rawCoord = img2raw(selectedCoord);
            Item item = new Item(label, rawCoord,
                    mFilterCategories);
            Log.i(TAG, "Adding item: " + item.toString());
            mItemsObjList.add(item);
            imageCoords.add(selectedCoord);
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
    private BaseLoaderCallback mLoaderCallback = new BaseLoaderCallback(this) {
        @Override
        public void onManagerConnected(int status) {
            if (status == LoaderCallbackInterface.SUCCESS) {
                setUpMap();
            } else {
                super.onManagerConnected(status);
            }
        }
    };

    private void setUpMap() {
        android.graphics.Point screenSize = new android.graphics.Point();
        getWindowManager().getDefaultDisplay().getSize(screenSize);
        map = new Map2D(this, screenSize.x, screenSize.y);
        mapBitmap = map.imgBmp.copy(Bitmap.Config.ARGB_8888, true);
        imageView = (ImageView) findViewById(R.id.ownerMap);
        imageView.setImageBitmap(mapBitmap);

        imageView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                vf.setDisplayedChild(1);
                setUpAddLocItemCard();

                selectedCoord = Utils.screen2img(event.getX(), event.getY(), new Size(v.getWidth(), v.getHeight()), map.getImgSize());

                Log.i(TAG, "Image size: " + map.getImgSize().width + "," + map.getImgSize().height + "\n");
                Log.i(TAG, "Image Coords: " + selectedCoord.getXInt() + "," + selectedCoord.getYInt() + "\n");

                Bitmap curBitmap = mapBitmap.copy(Bitmap.Config.ARGB_8888, true);
                Utils.drawLocation(curBitmap, selectedCoord.getXInt(), selectedCoord.getYInt(), labelPaint);
                for (Coordinate coord: imageCoords) {
                    Utils.drawLocation(curBitmap, coord.getXInt(), coord.getYInt(), disabledPaint);
                }
                imageView.setImageBitmap(curBitmap);

                return true;
            }

        });
    }

    private Coordinate img2raw(Coordinate imgCoord) {
        double scale = map.getRaw2ImgScale();
        float rawX = (float) (imgCoord.getX() / scale);
        float rawY = (float) (imgCoord.getY() / scale);

        return new Coordinate(rawX, rawY);
    }
}

