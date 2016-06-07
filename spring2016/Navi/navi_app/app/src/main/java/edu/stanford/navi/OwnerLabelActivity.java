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


    private Set<String> mFilterCategoriesSet;
    private ArrayList<String> mFilterCategoriesList;
    private Set<String> mSelectedFilterCategories;
    private ArrayList<Boolean> mSelectedFilterCategoriesBool;

    private Button mCancelAddItemButton;
    private Button mAddItemButton;
    private Button mCreateFilterButton;
    private Button mAddFilterCateogoryButton;

    private ImageView imageView;
    private EditText mTextFieldLocationItem;

    private boolean mIsFirstStep = true;

    private ArrayList<Item> mItemsObjList;

    private ViewFlipper vf;
    private AlertDialog mFilterNameCreationDialog;
    private AlertDialog mAddFilterCateogoryDialog;
    private ListView mItemListAsListView;
    private ArrayList<String> mStoreItemsList;

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

        mSelectedFilterCategories =  new HashSet<String>(); // Where we track the selected items
        mFilterCategoriesSet = new HashSet<String>();
        mFilterCategoriesList = new ArrayList<String>();
        mSelectedFilterCategoriesBool = new ArrayList<Boolean>();
        mStoreItemsList = new ArrayList<String>();
    }

    private void setUpUI() {
        vf = (ViewFlipper) findViewById(R.id.vf);

        // Display instruction card xml
        vf.setDisplayedChild(0);

        setUpFontHeaderAndCardInstruction();
        mFilterCategoriesSet = new HashSet<String>();
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
            case R.id.addFilterCatergoryButton:
                mAddFilterCateogoryDialog.show();
                break;
        }
    }

    private void showFilterCardAndItemListView() {
        // Clear text field
        mTextFieldLocationItem.setText("");

        // Close keyboard
        View view = this.getCurrentFocus();
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }

        // Viewfinder displays filter card and store item list xml
        vf.setDisplayedChild(2);

        setupTextAndButtonsInFilterView();

        setupStorelistView();

        setupChooseAFilterDialog();

        setupCreateFilterCategoryDialog();
    }

    private void setupTextAndButtonsInFilterView() {
        Typeface face = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Demi.otf");
        Typeface faceRegular = Typeface.createFromAsset(getAssets(), "fonts/AvenirNextLTPro-Regular.otf");

        mAddFilterCateogoryButton = (Button) findViewById(R.id.addFilterCatergoryButton);
        mAddFilterCateogoryButton.setTypeface(face);
        mAddFilterCateogoryButton.setOnClickListener(this);

        mCreateFilterButton = (Button) findViewById(R.id.createFilterButton);
        mCreateFilterButton.setTypeface(faceRegular);
        mCreateFilterButton.setOnClickListener(this);
    }

    private void setupStorelistView() {
        // Setup list view
        StoreItemListAdapter adapter = new StoreItemListAdapter(this, mItemsObjList, mStoreItemsList);
        mItemListAsListView = (ListView) findViewById(R.id.listOfItemsInEnviroment);
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

    private void setupCreateFilterCategoryDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(OwnerLabelActivity.this);
        // Set the dialog title
        final HashSet<String> tempSelectedFilterCategories = new HashSet<String>();
        for (String s:mSelectedFilterCategories) {
            tempSelectedFilterCategories.add(s);
        }

        // Can't convert from ArrayList<Boolean> to boolean[]
        final boolean[] tempIsSelected = new boolean[mSelectedFilterCategoriesBool.size()];
        for (int i = 0; i < mSelectedFilterCategoriesBool.size(); i++) {
            tempIsSelected[i] = mSelectedFilterCategoriesBool.get(i);
        }
        builder.setTitle("Pick filter categories")
                .setMultiChoiceItems(mFilterCategoriesList.toArray(new CharSequence[mFilterCategoriesList.size()]), tempIsSelected,
                        new DialogInterface.OnMultiChoiceClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which,
                                                boolean isChecked) {
                                String filterCategory = mFilterCategoriesList.get(which);
                                if (isChecked) {
                                    // Assuming the item is not in the list (if it is, this is still fine)
                                    tempIsSelected[which] = true;
                                    tempSelectedFilterCategories.add(filterCategory);
                                } else {
                                    if (tempSelectedFilterCategories.contains(filterCategory)) {
                                        tempSelectedFilterCategories.remove(filterCategory);
                                        tempIsSelected[which] = false;
                                    }
                                }
                            }
                        })
                // Set the action buttons
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int id) {
                        mSelectedFilterCategories = tempSelectedFilterCategories;
                        // Can't convert from ArrayList<Boolean> to boolean[]
                        for (int i = 0; i < mSelectedFilterCategoriesBool.size(); i++) {
                            mSelectedFilterCategoriesBool.set(i, tempIsSelected[i]);
                        }
                        dialog.cancel();
                        setupCreateFilterCategoryDialog();
                    }
                })
                .setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int id) {
//                        ArrayList<Boolean> b = mSelectedFilterCategoriesBool;
//                        boolean[] bc = tempIsSelected;
                        dialog.cancel();
                        setupCreateFilterCategoryDialog();
                    }
                });

        mAddFilterCateogoryDialog = builder.create();
    }

    private void addItemToStorage() {
        String label = mTextFieldLocationItem.getText().toString();
        if(label.length() > 0) {
            Coordinate rawCoord = img2raw(selectedCoord);
            Item item = new Item(label, rawCoord, mFilterCategoriesSet);
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

    String properCase (String inputVal) {
        // Empty strings should be returned as-is.

        if (inputVal.length() == 0) return "";

        // Strings with only one character uppercased.

        if (inputVal.length() == 1) return inputVal.toUpperCase();

        // Otherwise uppercase first letter, lowercase the rest.

        return inputVal.substring(0,1).toUpperCase()
                + inputVal.substring(1).toLowerCase();
    }

    private void setupChooseAFilterDialog() {
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
                String item = textFieldFilterCategory.getText().toString();
                item = properCase(item);
                if(!mFilterCategoriesSet.contains(item)) {
                    mFilterCategoriesList.add(item);
                    mFilterCategoriesSet.add(item);
                    mSelectedFilterCategoriesBool.add(false);
                    setupCreateFilterCategoryDialog();
                }
                textFieldFilterCategory.setText("");
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

