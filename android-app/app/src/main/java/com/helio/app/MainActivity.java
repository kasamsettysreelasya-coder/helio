package com.helio.app;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.app.Activity;
import java.util.List;
import java.util.Map;

public class MainActivity extends Activity {

    private EditText etClinicalNotes;
    private Button btnProcessTriage;
    private LinearLayout layoutResultContainer;
    
    private TextView tvTriageLevelBadge;
    private TextView tvConfidenceScore;
    private LinearLayout layoutRedFlags;
    private TextView tvRedFlagsList;
    private TextView tvRecommendedAction;
    private TextView tvReferralCardText;
    private TextView tvFirstAidList;
    private Button btnToggleJson;
    private TextView tvStructuredJsonOutput;
    private Button btnSaveRecord;
    private Button btnShareReferral;
    
    private LinearLayout layoutHistoryList;
    private TextView tvNoHistory;

    private HelioDatabaseHelper dbHelper;
    private HelioParser.StructuredRecord currentRecord;
    private boolean isJsonVisible = false;

    // Synthetic demo records from SPEC.md
    private final String DEMO_CHEST_PAIN = "Patient Rajesh, age 52, male. Complaining of severe crushing chest pain radiating to his left arm and heavy sweating since 2 hours. Extremely anxious.";
    private final String DEMO_CHILD_FEVER = "Baby Meera, 3 years old, female. High fever of 101 F and mild cough for 2 days. Rest of the physical exam is normal, drinking fluids and active.";
    private final String DEMO_HAND_CUT = "Suresh, 28 years old, male. Sustained a small superficial cut on his right thumb while slicing vegetables this morning. Bleeding stopped, minor pain.";
    private final String DEMO_WATER_BURN = "Lakshmi, 42yo, female. Accidental hot water burn on her face and neck 1 hour ago. Skin is blistering and red with severe pain.";
    private final String DEMO_FEVER_CONF = "Elderly patient Joseph, 78yo, male. Running high fever and showing severe confusion. Not recognizing family members since yesterday.";
    private final String DEMO_PREGNANCY = "Sita, 25 years old, female, 6 months pregnant. Presenting with sudden onset of moderate vaginal bleeding and mild abdominal cramping for 3 hours.";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        dbHelper = new HelioDatabaseHelper(this);

        // Bind Views
        etClinicalNotes = findViewById(R.id.et_clinical_notes);
        btnProcessTriage = findViewById(R.id.btn_process_triage);
        layoutResultContainer = findViewById(R.id.layout_result_container);
        
        tvTriageLevelBadge = findViewById(R.id.tv_triage_level_badge);
        tvConfidenceScore = findViewById(R.id.tv_confidence_score);
        layoutRedFlags = findViewById(R.id.layout_red_flags);
        tvRedFlagsList = findViewById(R.id.tv_red_flags_list);
        tvRecommendedAction = findViewById(R.id.tv_recommended_action);
        tvReferralCardText = findViewById(R.id.tv_referral_card_text);
        tvFirstAidList = findViewById(R.id.tv_first_aid_list);
        btnToggleJson = findViewById(R.id.btn_toggle_json);
        tvStructuredJsonOutput = findViewById(R.id.tv_structured_json_output);
        btnSaveRecord = findViewById(R.id.btn_save_record);
        btnShareReferral = findViewById(R.id.btn_share_referral);
        
        layoutHistoryList = findViewById(R.id.layout_history_list);
        tvNoHistory = findViewById(R.id.tv_no_history);

        // Set up Quick Demo Buttons
        findViewById(R.id.btn_demo_chest_pain).setOnClickListener(v -> fillNotes(DEMO_CHEST_PAIN));
        findViewById(R.id.btn_demo_child_fever).setOnClickListener(v -> fillNotes(DEMO_CHILD_FEVER));
        findViewById(R.id.btn_demo_hand_cut).setOnClickListener(v -> fillNotes(DEMO_HAND_CUT));
        findViewById(R.id.btn_demo_water_burn).setOnClickListener(v -> fillNotes(DEMO_WATER_BURN));
        findViewById(R.id.btn_demo_fever_conf).setOnClickListener(v -> fillNotes(DEMO_FEVER_CONF));
        findViewById(R.id.btn_demo_pregnancy).setOnClickListener(v -> fillNotes(DEMO_PREGNANCY));

        // Process button listener
        btnProcessTriage.setOnClickListener(v -> processClinicalNotes());

        // Toggle JSON visibility
        btnToggleJson.setOnClickListener(v -> toggleJsonVisibility());

        // Save Record listener
        btnSaveRecord.setOnClickListener(v -> saveRecordToDatabase());

        // Share Referral listener
        btnShareReferral.setOnClickListener(v -> shareReferralNote());

        // Load History on start
        refreshHistoryList();
    }

    private void fillNotes(String notesText) {
        etClinicalNotes.setText(notesText);
        Toast.makeText(this, "Demo case loaded", Toast.LENGTH_SHORT).show();
    }

    private void processClinicalNotes() {
        String notes = etClinicalNotes.getText().toString().trim();
        if (notes.isEmpty()) {
            Toast.makeText(this, "Please enter some patient notes first.", Toast.LENGTH_SHORT).show();
            return;
        }

        // Run local parsing and rule-engine
        currentRecord = HelioParser.parseNotes(notes);

        // Show result container
        layoutResultContainer.setVisibility(View.VISIBLE);

        // Update Triage Badge style depending on level
        tvTriageLevelBadge.setText(currentRecord.triageLevel.toUpperCase());
        GradientDrawable badgeBackground = new GradientDrawable();
        badgeBackground.setCornerRadius(12);

        int textColor = Color.WHITE;
        int badgeColor = Color.GRAY;

        switch (currentRecord.triageLevel) {
            case "Urgent":
                badgeColor = Color.parseColor("#BA1A1A"); // Urgent Red
                break;
            case "High":
                badgeColor = Color.parseColor("#E65100"); // High Orange
                break;
            case "Medium":
                badgeColor = Color.parseColor("#006064"); // Medium Cyan/Teal
                break;
            case "Low":
                badgeColor = Color.parseColor("#1B5E20"); // Low Green
                break;
        }
        badgeBackground.setColor(badgeColor);
        tvTriageLevelBadge.setBackground(badgeBackground);
        tvTriageLevelBadge.setTextColor(textColor);

        // Update confidence score
        tvConfidenceScore.setText(String.format("Confidence: %d%%", (int)(currentRecord.confidence * 100)));

        // Show/Hide Red Flags
        if (currentRecord.redFlags.isEmpty()) {
            layoutRedFlags.setVisibility(View.GONE);
        } else {
            layoutRedFlags.setVisibility(View.VISIBLE);
            StringBuilder sb = new StringBuilder();
            for (String flag : currentRecord.redFlags) {
                sb.append("• ").append(flag).append("\n");
            }
            tvRedFlagsList.setText(sb.toString().trim());
        }

        // Recommended Action
        tvRecommendedAction.setText(currentRecord.recommendedAction);

        // First Aid checklist
        if (currentRecord.firstAid.isEmpty()) {
            tvFirstAidList.setText("No specific first aid required. Maintain comfort.");
        } else {
            StringBuilder sb = new StringBuilder();
            for (String tip : currentRecord.firstAid) {
                sb.append("✓ ").append(tip).append("\n\n");
            }
            tvFirstAidList.setText(sb.toString().trim());
        }

        // Structured JSON
        tvStructuredJsonOutput.setText(currentRecord.toJSONString());

        // Generate Referral Note
        String referralNote = generateReferralCardText(currentRecord, notes);
        tvReferralCardText.setText(referralNote);

        // Scroll to results
        layoutResultContainer.getParent().requestChildFocus(layoutResultContainer, layoutResultContainer);
    }

    private String generateReferralCardText(HelioParser.StructuredRecord record, String notes) {
        StringBuilder sb = new StringBuilder();
        sb.append("====================================\n");
        sb.append("       HELIO AI REFERRAL CARD       \n");
        sb.append("====================================\n");
        sb.append("Patient: ").append(record.patientName).append("\n");
        sb.append("Age: ").append(record.age == -1 ? "Unknown" : record.age).append("\n");
        sb.append("Gender: ").append(record.gender).append("\n");
        sb.append("Duration: ").append(record.duration).append("\n");
        sb.append("------------------------------------\n");
        sb.append("TRIAGE LEVEL: ").append(record.triageLevel.toUpperCase()).append("\n");
        
        if (!record.redFlags.isEmpty()) {
            sb.append("\nRED FLAGS DETECTED:\n");
            for (String rf : record.redFlags) {
                sb.append(" - ").append(rf).append("\n");
            }
        }
        
        sb.append("\nSYMPTOMS IDENTIFIED:\n");
        if (record.symptoms.isEmpty()) {
            sb.append(" - None identified (unstructured notes attached)\n");
        } else {
            for (String s : record.symptoms) {
                sb.append(" - ").append(s).append("\n");
            }
        }
        
        sb.append("\nRECOMMENDED ACTION:\n");
        sb.append(record.recommendedAction).append("\n");
        
        sb.append("------------------------------------\n");
        sb.append("CLINICAL SUMMARY:\n");
        if (notes.length() > 120) {
            sb.append(notes.substring(0, 117)).append("...\n");
        } else {
            sb.append(notes).append("\n");
        }
        sb.append("------------------------------------\n");
        sb.append("[Offline CPU Processing Complete]\n");
        sb.append("====================================");
        return sb.toString();
    }

    private void toggleJsonVisibility() {
        isJsonVisible = !isJsonVisible;
        if (isJsonVisible) {
            tvStructuredJsonOutput.setVisibility(View.VISIBLE);
            btnToggleJson.setText("Hide Structured JSON Output");
        } else {
            tvStructuredJsonOutput.setVisibility(View.GONE);
            btnToggleJson.setText("Show Structured JSON Output");
        }
    }

    private void saveRecordToDatabase() {
        if (currentRecord == null) return;

        String notes = etClinicalNotes.getText().toString().trim();
        String json = currentRecord.toJSONString();
        String triageLevel = currentRecord.triageLevel;

        long id = dbHelper.insertRecord(notes, json, triageLevel);
        if (id > 0) {
            Toast.makeText(this, "Record saved to SQLite successfully", Toast.LENGTH_SHORT).show();
            refreshHistoryList();
        } else {
            Toast.makeText(this, "Failed to save record", Toast.LENGTH_SHORT).show();
        }
    }

    private void shareReferralNote() {
        if (currentRecord == null) return;
        String referralText = tvReferralCardText.getText().toString();

        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "HELIO AI Referral: " + currentRecord.patientName);
        shareIntent.putExtra(Intent.EXTRA_TEXT, referralText);
        startActivity(Intent.createChooser(shareIntent, "Share Referral Note via:"));
    }

    private void refreshHistoryList() {
        layoutHistoryList.removeAllViews();
        List<Map<String, String>> records = dbHelper.getAllRecords();

        if (records.isEmpty()) {
            tvNoHistory.setVisibility(View.VISIBLE);
            return;
        }

        tvNoHistory.setVisibility(View.GONE);

        for (Map<String, String> rec : records) {
            // Build card-like layouts programmatically for robustness
            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setPadding(24, 24, 24, 24);
            
            // Border & Background using drawable
            GradientDrawable border = new GradientDrawable();
            border.setColor(Color.WHITE);
            border.setCornerRadius(8);
            border.setStroke(2, Color.parseColor("#E0E0E0"));
            card.setBackground(border);

            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            params.setMargins(0, 0, 0, 16);
            card.setLayoutParams(params);

            // Title Line (Name & Triage)
            LinearLayout titleLine = new LinearLayout(this);
            titleLine.setOrientation(LinearLayout.HORIZONTAL);
            
            TextView tvTitle = new TextView(this);
            String name = "Patient: " + getPatientNameFromJson(rec.get("structured_json"));
            tvTitle.setText(name);
            tvTitle.setTextSize(14);
            tvTitle.setTypeface(null, android.graphics.Typeface.BOLD);
            tvTitle.setTextColor(Color.parseColor("#191C1C"));
            
            TextView tvTriage = new TextView(this);
            String level = rec.get("triage_level");
            tvTriage.setText(" " + level.toUpperCase() + " ");
            tvTriage.setTextSize(11);
            tvTriage.setTypeface(null, android.graphics.Typeface.BOLD);
            tvTriage.setTextColor(Color.WHITE);
            
            GradientDrawable triageBg = new GradientDrawable();
            triageBg.setCornerRadius(6);
            int color = Color.GRAY;
            if ("Urgent".equalsIgnoreCase(level)) color = Color.parseColor("#BA1A1A");
            else if ("High".equalsIgnoreCase(level)) color = Color.parseColor("#E65100");
            else if ("Medium".equalsIgnoreCase(level)) color = Color.parseColor("#006064");
            else if ("Low".equalsIgnoreCase(level)) color = Color.parseColor("#1B5E20");
            triageBg.setColor(color);
            tvTriage.setBackground(triageBg);

            View spacer = new View(this);
            LinearLayout.LayoutParams spacerParams = new LinearLayout.LayoutParams(0, 1);
            spacerParams.weight = 1;
            spacer.setLayoutParams(spacerParams);

            titleLine.addView(tvTitle);
            titleLine.addView(spacer);
            titleLine.addView(tvTriage);

            // Date line
            TextView tvDate = new TextView(this);
            tvDate.setText(rec.get("timestamp"));
            tvDate.setTextSize(11);
            tvDate.setTextColor(Color.parseColor("#757575"));
            tvDate.setPadding(0, 4, 0, 8);

            // Notes excerpt
            TextView tvNotes = new TextView(this);
            String notes = rec.get("notes");
            if (notes.length() > 80) {
                notes = notes.substring(0, 77) + "...";
            }
            tvNotes.setText(notes);
            tvNotes.setTextSize(13);
            tvNotes.setTextColor(Color.parseColor("#3F4948"));

            // View Details click listener
            card.setOnClickListener(v -> {
                etClinicalNotes.setText(rec.get("notes"));
                processClinicalNotes();
                Toast.makeText(this, "Loaded record details", Toast.LENGTH_SHORT).show();
            });

            card.addView(titleLine);
            card.addView(tvDate);
            card.addView(tvNotes);

            layoutHistoryList.addView(card);
        }
    }

    private String getPatientNameFromJson(String jsonStr) {
        try {
            org.json.JSONObject obj = new org.json.JSONObject(jsonStr);
            return obj.optString("patient_name", "Unknown");
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
