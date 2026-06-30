package com.helio.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class HelioDatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "helio_records.db";
    private static final int DATABASE_VERSION = 1;

    public static final String TABLE_RECORDS = "records";
    public static final String COLUMN_ID = "id";
    public static final String COLUMN_TIMESTAMP = "timestamp";
    public static final String COLUMN_NOTES = "notes";
    public static final String COLUMN_STRUCTURED_JSON = "structured_json";
    public static final String COLUMN_TRIAGE_LEVEL = "triage_level";

    private static final String TABLE_CREATE =
            "CREATE TABLE " + TABLE_RECORDS + " (" +
                    COLUMN_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    COLUMN_TIMESTAMP + " TEXT, " +
                    COLUMN_NOTES + " TEXT, " +
                    COLUMN_STRUCTURED_JSON + " TEXT, " +
                    COLUMN_TRIAGE_LEVEL + " TEXT" +
                    ");";

    public HelioDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(TABLE_CREATE);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_RECORDS);
        onCreate(db);
    }

    public long insertRecord(String notes, String json, String triageLevel) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        
        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date());
        
        values.put(COLUMN_TIMESTAMP, timestamp);
        values.put(COLUMN_NOTES, notes);
        values.put(COLUMN_STRUCTURED_JSON, json);
        values.put(COLUMN_TRIAGE_LEVEL, triageLevel);

        long id = db.insert(TABLE_RECORDS, null, values);
        db.close();
        return id;
    }

    public List<Map<String, String>> getAllRecords() {
        List<Map<String, String>> recordsList = new ArrayList<>();
        String selectQuery = "SELECT * FROM " + TABLE_RECORDS + " ORDER BY " + COLUMN_ID + " DESC";
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery(selectQuery, null);

        if (cursor.moveToFirst()) {
            do {
                Map<String, String> record = new HashMap<>();
                record.put("id", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ID)));
                record.put("timestamp", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_TIMESTAMP)));
                record.put("notes", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_NOTES)));
                record.put("structured_json", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_STRUCTURED_JSON)));
                record.put("triage_level", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_TRIAGE_LEVEL)));
                recordsList.add(record);
            } while (cursor.moveToNext());
        }
        cursor.close();
        db.close();
        return recordsList;
    }
}
