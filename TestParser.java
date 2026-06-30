package com.helio.app;

import org.json.JSONObject;
import org.json.JSONArray;

public class TestParser {
    public static void main(String[] args) {
        String[] cases = {
            "Patient Rajesh, age 52, male. Complaining of severe crushing chest pain radiating to his left arm and heavy sweating since 2 hours. Extremely anxious.",
            "Baby Meera, 3 years old, female. High fever of 101 F and mild cough for 2 days. Rest of the physical exam is normal, drinking fluids and active.",
            "Suresh, 28 years old, male. Sustained a small superficial cut on his right thumb while slicing vegetables this morning. Bleeding stopped, minor pain.",
            "Lakshmi, 42yo, female. Accidental hot water burn on her face and neck 1 hour ago. Skin is blistering and red with severe pain.",
            "Elderly patient Joseph, 78yo, male. Running high fever and showing severe confusion. Not recognizing family members since yesterday.",
            "Sita, 25 years old, female, 6 months pregnant. Presenting with sudden onset of moderate vaginal bleeding and mild abdominal cramping for 3 hours."
        };

        System.out.println("=========================================");
        System.out.println("       HELIO AI OFFLINE PARSER TEST      ");
        System.out.println("=========================================");

        for (int i = 0; i < cases.length; i++) {
            System.out.println("\n--- CASE " + (i + 1) + " ---");
            System.out.println("Input: " + cases[i]);
            
            HelioParser.StructuredRecord record = HelioParser.parseNotes(cases[i]);
            System.out.println("Output JSON:");
            System.out.println(record.toJSONString());
            
            System.out.println("\nTriage Assessment:");
            System.out.println("Triage Level: " + record.triageLevel);
            System.out.println("Recommended Action: " + record.recommendedAction);
            System.out.println("Red Flags: " + record.redFlags);
            System.out.println("First Aid Tips: " + record.firstAid);
            System.out.println("-----------------------------------------");
        }
    }
}
