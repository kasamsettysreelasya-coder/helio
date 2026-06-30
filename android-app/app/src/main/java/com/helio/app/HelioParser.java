package com.helio.app;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class HelioParser {

    public static class StructuredRecord {
        public String patientName;
        public int age;
        public String gender;
        public List<String> symptoms;
        public String duration;
        public String triageLevel;
        public String recommendedAction;
        public List<String> firstAid;
        public List<String> redFlags;
        public double confidence;
        public List<String> recommendedMedications;

        public StructuredRecord() {
            this.patientName = "Unknown";
            this.age = -1;
            this.gender = "Unknown";
            this.symptoms = new ArrayList<>();
            this.duration = "Unknown";
            this.triageLevel = "Low";
            this.recommendedAction = "Monitor symptoms at home";
            this.firstAid = new ArrayList<>();
            this.redFlags = new ArrayList<>();
            this.confidence = 0.5;
            this.recommendedMedications = new ArrayList<>();
        }

        public String toJSONString() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("patient_name", patientName);
                obj.put("age", age == -1 ? null : age);
                obj.put("gender", gender);
                
                JSONArray syms = new JSONArray();
                for (String s : symptoms) syms.put(s);
                obj.put("symptoms", syms);
                
                obj.put("duration", duration);
                obj.put("triage_level", triageLevel);
                obj.put("recommended_action", recommendedAction);
                
                JSONArray fa = new JSONArray();
                for (String f : firstAid) fa.put(f);
                obj.put("first_aid", fa);
                
                JSONArray rf = new JSONArray();
                for (String r : redFlags) rf.put(r);
                obj.put("red_flags", rf);
                
                JSONArray meds = new JSONArray();
                for (String m : recommendedMedications) meds.put(m);
                obj.put("recommended_medications", meds);
                
                obj.put("confidence", confidence);
                return obj.toString(2);
            } catch (Exception e) {
                return "{}";
            }
        }
    }

    public static StructuredRecord parseNotes(String notes) {
        if (notes == null) {
            return new StructuredRecord();
        }

        StructuredRecord record = new StructuredRecord();
        String lowercaseNotes = notes.toLowerCase();

        // 1. Extract Patient Name
        Pattern namePattern1 = Pattern.compile("name\\s*:\\s*([A-Za-z ]+)", Pattern.CASE_INSENSITIVE);
        Pattern namePattern2 = Pattern.compile("patient\\s+is\\s+([A-Za-z ]+)", Pattern.CASE_INSENSITIVE);
        Pattern namePattern3 = Pattern.compile("patient\\s*:\\s*([A-Za-z ]+)", Pattern.CASE_INSENSITIVE);
        Pattern namePattern4 = Pattern.compile("\\b(?:patient|baby|elderly patient|elderly)\\s+([A-Z][a-z]+)\\b", Pattern.CASE_INSENSITIVE);
        Pattern namePattern5 = Pattern.compile("^([A-Z][a-z]+)\\b");
        Pattern namePattern6 = Pattern.compile("\\bname\\s+is\\s+([A-Za-z]+)\\b", Pattern.CASE_INSENSITIVE);
        Pattern namePattern7 = Pattern.compile("\\bpatient\\s+named\\s+([A-Za-z]+)\\b", Pattern.CASE_INSENSITIVE);
        Pattern namePattern8 = Pattern.compile("\\bnamed\\s+([A-Za-z]+)\\b", Pattern.CASE_INSENSITIVE);
        
        Matcher m = namePattern1.matcher(notes);
        if (m.find()) {
            record.patientName = m.group(1).trim();
        } else {
            m = namePattern2.matcher(notes);
            if (m.find()) {
                record.patientName = m.group(1).trim();
            } else {
                m = namePattern3.matcher(notes);
                if (m.find()) {
                    record.patientName = m.group(1).trim();
                } else {
                    m = namePattern6.matcher(notes);
                    if (m.find()) {
                        record.patientName = m.group(1).trim();
                    } else {
                        m = namePattern7.matcher(notes);
                        if (m.find()) {
                            record.patientName = m.group(1).trim();
                        } else {
                            m = namePattern8.matcher(notes);
                            if (m.find()) {
                                record.patientName = m.group(1).trim();
                            } else {
                                m = namePattern4.matcher(notes);
                                if (m.find()) {
                                    record.patientName = m.group(1).trim();
                                } else {
                                    m = namePattern5.matcher(notes);
                                    if (m.find()) {
                                        String name = m.group(1).trim();
                                        if (!name.equalsIgnoreCase("baby") && !name.equalsIgnoreCase("elderly") && !name.equalsIgnoreCase("patient") && !name.equalsIgnoreCase("young")) {
                                            record.patientName = name;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // Clean up multi-word names that capture symptoms
        if (record.patientName.contains(" ") && record.patientName.split(" ").length > 3) {
            record.patientName = record.patientName.split(" ")[0];
        }

        // 2. Extract Age
        Pattern agePattern1 = Pattern.compile("age\\s*:\\s*([0-9]+)", Pattern.CASE_INSENSITIVE);
        Pattern agePattern2 = Pattern.compile("\\b([0-9]+)\\s*(years old|yo|y.o.|years of age|year old|yr old|years|yrs)\\b", Pattern.CASE_INSENSITIVE);
        Pattern agePattern3 = Pattern.compile("aged\\s+([0-9]+)", Pattern.CASE_INSENSITIVE);

        m = agePattern1.matcher(notes);
        if (m.find()) {
            record.age = Integer.parseInt(m.group(1).trim());
        } else {
            m = agePattern2.matcher(notes);
            if (m.find()) {
                record.age = Integer.parseInt(m.group(1).trim());
            } else {
                m = agePattern3.matcher(notes);
                if (m.find()) {
                    record.age = Integer.parseInt(m.group(1).trim());
                }
            }
        }

        // 3. Extract Gender
        if (lowercaseNotes.contains("female") || lowercaseNotes.contains("woman") || lowercaseNotes.contains("girl") || lowercaseNotes.contains("she/her")) {
            record.gender = "Female";
        } else if (lowercaseNotes.contains("male") || lowercaseNotes.contains("man") || lowercaseNotes.contains("boy") || lowercaseNotes.contains("he/him")) {
            record.gender = "Male";
        } else {
            Pattern genderPattern = Pattern.compile("gender\\s*:\\s*([A-Za-z]+)", Pattern.CASE_INSENSITIVE);
            m = genderPattern.matcher(notes);
            if (m.find()) {
                String g = m.group(1).trim().toLowerCase();
                if (g.startsWith("f")) record.gender = "Female";
                else if (g.startsWith("m")) record.gender = "Male";
            }
        }

        // 4. Extract Duration
        Pattern durPattern = Pattern.compile("([0-9]+\\s*(days|weeks|months|hours|day|week|month|hour))", Pattern.CASE_INSENSITIVE);
        m = durPattern.matcher(notes);
        if (m.find()) {
            record.duration = m.group(1).trim();
        } else if (lowercaseNotes.contains("yesterday")) {
            record.duration = "1 day";
        } else if (lowercaseNotes.contains("today")) {
            record.duration = "less than 1 day";
        }

        // 5. Extract Symptoms (Keywords)
        String[] symptomKeywords = {"fever", "cough", "chest pain", "breathing difficulty", "shortness of breath", 
                                    "bleeding", "burn", "cut", "wound", "sweating", "confusion", "dizzy", 
                                    "headache", "vomiting", "diarrhea", "rash", "seizure", "dehydration"};
        
        for (String sym : symptomKeywords) {
            if (lowercaseNotes.contains(sym)) {
                record.symptoms.add(capitalize(sym));
            }
        }

        // 6. Apply Medical Triage Rule Engine
        boolean hasBreathingDifficulty = lowercaseNotes.contains("breathing difficulty") || 
                                         lowercaseNotes.contains("shortness of breath") || 
                                         lowercaseNotes.contains("difficulty breathing") ||
                                         lowercaseNotes.contains("cannot breathe");
                                         
        boolean hasChestPain = lowercaseNotes.contains("chest pain") || 
                               lowercaseNotes.contains("heart pain") || 
                               lowercaseNotes.contains("pressure in chest") ||
                               lowercaseNotes.contains("sweating") && lowercaseNotes.contains("chest");
                               
        boolean hasUnconsciousness = lowercaseNotes.contains("unconscious") || 
                                     lowercaseNotes.contains("fainted") || 
                                     lowercaseNotes.contains("unconsciousness") || 
                                     lowercaseNotes.contains("passed out");
                                     
        boolean hasHeavyBleeding = (lowercaseNotes.contains("bleeding") && 
                                    (lowercaseNotes.contains("heavy") || lowercaseNotes.contains("severe") || 
                                     lowercaseNotes.contains("profuse") || lowercaseNotes.contains("uncontrolled")));
                                     
        boolean hasSevereBurn = lowercaseNotes.contains("burn") && 
                                (lowercaseNotes.contains("severe") || lowercaseNotes.contains("third degree") || 
                                 lowercaseNotes.contains("face") || lowercaseNotes.contains("large area") || 
                                 lowercaseNotes.contains("genital"));
                                 
        boolean hasFeverWithConfusion = lowercaseNotes.contains("fever") && 
                                        (lowercaseNotes.contains("confusion") || lowercaseNotes.contains("confused") || 
                                         lowercaseNotes.contains("unresponsive") || lowercaseNotes.contains("delirious"));

        boolean hasBleedingPregnancy = lowercaseNotes.contains("bleeding") && 
                                       (lowercaseNotes.contains("pregnant") || lowercaseNotes.contains("pregnancy") || 
                                        lowercaseNotes.contains("expecting"));

        boolean hasSeizure = lowercaseNotes.contains("seizure") || lowercaseNotes.contains("convulsion") || lowercaseNotes.contains("fit");

        // Compute Red Flags and Urgency
        if (hasBreathingDifficulty) {
            record.redFlags.add("Difficulty breathing / Respiratory distress");
        }
        if (hasChestPain) {
            record.redFlags.add("Chest pain or pressure (possible cardiac event)");
        }
        if (hasUnconsciousness) {
            record.redFlags.add("Loss of consciousness or fainting");
        }
        if (hasHeavyBleeding) {
            record.redFlags.add("Heavy or uncontrolled bleeding");
        }
        if (hasSevereBurn) {
            record.redFlags.add("Severe/extensive burn or burn on sensitive area");
        }
        if (hasFeverWithConfusion) {
            record.redFlags.add("High fever accompanied by confusion or altered mental state");
        }
        if (hasBleedingPregnancy) {
            record.redFlags.add("Pregnancy-related bleeding");
        }
        if (hasSeizure) {
            record.redFlags.add("Seizure activity");
        }

        // Triage Level Determination
        if (!record.redFlags.isEmpty()) {
            record.triageLevel = "Urgent";
            record.recommendedAction = "Seek immediate medical attention / Go to Emergency Room";
            record.confidence = 0.95;
            
            // Tailor First Aid based on the specific red flags
            if (hasHeavyBleeding) {
                record.firstAid.add("Apply firm, direct pressure to the wound with a clean cloth.");
                record.firstAid.add("Elevate the bleeding limb above the heart if possible.");
                record.firstAid.add("Keep the patient warm and lying down.");
            } else if (hasSevereBurn) {
                record.firstAid.add("Cool the burn immediately under cool running water for 10-20 minutes.");
                record.firstAid.add("Do not apply ice, butter, or ointments.");
                record.firstAid.add("Cover the burn loosely with a clean, non-stick dressing or plastic wrap.");
            } else if (hasChestPain) {
                record.firstAid.add("Have the patient sit in a comfortable, relaxed position (semi-recumbent).");
                record.firstAid.add("Loosen tight clothing around the neck and chest.");
                record.firstAid.add("Keep the patient calm. If aspirin is prescribed for heart conditions, assist them in taking it.");
            } else if (hasBreathingDifficulty) {
                record.firstAid.add("Help the patient sit upright in a comfortable position.");
                record.firstAid.add("Loosen tight clothing.");
                record.firstAid.add("Help the patient use their prescribed rescue inhaler if they have one.");
            } else {
                record.firstAid.add("Keep the patient calm and comfortable.");
                record.firstAid.add("Do not leave the patient unattended.");
                record.firstAid.add("Loosen tight clothing and ensure a clear airway.");
            }
        } else {
            // Check for High / Medium levels
            boolean hasFever = lowercaseNotes.contains("fever");
            boolean hasDurationLong = false;
            
            // Check if duration > 3 days
            Pattern numPat = Pattern.compile("([0-9]+)");
            Matcher numMat = numPat.matcher(record.duration);
            if (numMat.find()) {
                int val = Integer.parseInt(numMat.group(1));
                if (record.duration.contains("day") && val >= 3) {
                    hasDurationLong = true;
                } else if (record.duration.contains("week") || record.duration.contains("month")) {
                    hasDurationLong = true;
                }
            }

            if (hasFever && hasDurationLong) {
                record.triageLevel = "High";
                record.recommendedAction = "Visit Primary Health Centre (PHC) / Clinic within 24 hours";
                record.redFlags.add("Fever lasting 3 or more days");
                record.firstAid.add("Drink plenty of fluids (water, ORS, soups).");
                record.firstAid.add("Rest in a cool room.");
                record.firstAid.add("Tepid sponging to help reduce temperature.");
                record.confidence = 0.88;
            } else if (lowercaseNotes.contains("burn")) {
                // Minor burn
                record.triageLevel = "Medium";
                record.recommendedAction = "Consult a health worker or clinic for evaluation";
                record.firstAid.add("Cool the burn with cool running water.");
                record.firstAid.add("Apply aloe vera gel or burn ointment if skin is intact.");
                record.firstAid.add("Do not pop blisters.");
                record.confidence = 0.85;
            } else if (lowercaseNotes.contains("cut") || lowercaseNotes.contains("wound") || lowercaseNotes.contains("scratch")) {
                // Minor cut
                record.triageLevel = "Low";
                record.recommendedAction = "Clean and monitor symptoms at home";
                record.firstAid.add("Clean the wound with mild soap and clean running water.");
                record.firstAid.add("Apply an antiseptic cream and cover with a sterile bandage.");
                record.firstAid.add("Watch for signs of infection (redness, pus, increased pain).");
                record.confidence = 0.90;
            } else {
                // Default fallback triage
                record.triageLevel = "Low";
                record.recommendedAction = "Monitor symptoms at home. Visit a clinic if they worsen.";
                record.firstAid.add("Ensure adequate rest and hydration.");
                record.firstAid.add("Monitor temperature and symptoms.");
                record.confidence = 0.75;
            }
        }

        // Generate recommended supportive medications (OTC)
        record.recommendedMedications = new ArrayList<>();
        
        List<String> lowercaseSyms = new ArrayList<>();
        for (String s : record.symptoms) {
            lowercaseSyms.add(s.toLowerCase());
        }

        if (lowercaseSyms.contains("fever") || lowercaseSyms.contains("headache") || lowercaseNotes.contains("fever") || lowercaseNotes.contains("headache") || lowercaseNotes.contains("pain") || lowercaseNotes.contains("body pain")) {
            record.recommendedMedications.add("Paracetamol (500mg) - Take 1 tablet every 4-6 hours as needed for fever/pain (Max 4 tablets/day)");
        }
        if (lowercaseSyms.contains("cough") || lowercaseNotes.contains("cough") || lowercaseNotes.contains("cold")) {
            record.recommendedMedications.add("Cough Lozenges or Cough Syrup - symptomatic relief for throat irritation");
        }
        if (lowercaseSyms.contains("diarrhea") || lowercaseSyms.contains("vomiting") || lowercaseSyms.contains("dehydration") || lowercaseNotes.contains("diarrhea") || lowercaseNotes.contains("vomiting")) {
            record.recommendedMedications.add("Oral Rehydration Salts (ORS) - Dissolve 1 packet in 1L clean water, drink slowly");
        }
        if (lowercaseSyms.contains("cut") || lowercaseSyms.contains("wound") || lowercaseNotes.contains("cut") || lowercaseNotes.contains("wound") || lowercaseNotes.contains("scratch")) {
            record.recommendedMedications.add("Antiseptic Cream / Ointment - Apply locally to clean wound twice daily");
        }
        if (lowercaseSyms.contains("burn") || lowercaseNotes.contains("burn")) {
            record.recommendedMedications.add("Soothing Aloe Vera Gel or Burn Ointment - Apply locally for minor burns");
        }
        if (lowercaseNotes.contains("chest pain") && record.triageLevel.equals("Urgent")) {
            record.recommendedMedications.add("Aspirin (325mg) - Chew 1 tablet immediately if advised by emergency services");
        }

        return record;
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return "";
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
