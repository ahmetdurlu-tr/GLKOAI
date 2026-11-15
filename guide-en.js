// Fixed English content for the guide. User data is never translated here.
const APP_GUIDE_EN = [
  {
    "title": "MENU",
    "desc": "Quick analysis, doctor reports, backup, restore, and reset.",
    "features": [
      "Settings: View the introduction, save or import a backup, reset foods, or delete data.",
      "Print: Save health records as a PDF or print them. Select the detailed view in Records.",
      "Copy report: Create a doctor report from your profile and records, then copy it to the clipboard.",
      "Paste analysis: Save a copied report or AI response for later review."
    ],
    "scenarios": [
      "Records are stored locally in the browser; external AI services receive data when you choose to share it.",
      "Back up regularly.",
      "Make a backup before changing devices.",
      "A compatible backup can be imported on another device.",
      "Change the Records view to print summaries or details."
    ]
  },
  {
    "title": "SETTINGS & DATA",
    "desc": "Manage backups, restores, resets, and offline use.",
    "features": [
      "Watch introduction: Open the introduction cards.",
      "Save backup: Download your data as a JSON file.",
      "Import backup: Restore data from a compatible backup.",
      "Reset foods: Remove the custom food library and restore defaults.",
      "Delete everything: Permanently delete the listed application data.",
      "Offline mode: Previously cached parts of the app can work without an internet connection.",
      "Add to Home Screen: Install the app for quick access and a full-screen view."
    ],
    "scenarios": [
      "Use the introduction cards to learn the app.",
      "Add frequently eaten foods to build your personal list.",
      "Local data is stored unencrypted in the browser.",
      "Offline availability depends on successful prior caching.",
      "After installation the app icon appears on your home screen."
    ]
  },
  {
    "title": "CLINICAL PROFILE & MEDICAL HISTORY",
    "desc": "Personal details, medical history, laboratory results, and the doctor report.",
    "features": [
      "Body measurements: BMI, body fat, muscle mass, and basal metabolic rate.",
      "Medication management: Record diabetes, blood pressure, anticoagulant, and other medications.",
      "Trauma and intensive care: Record injuries, fractures, implants, and care history.",
      "Risk history: Record smoking, alcohol, insulin resistance, and hypertension details.",
      "Laboratory and screening: Record laboratory results, checks, and vaccinations.",
      "Diet wizard: Prepare a food-list request for an AI service.",
      "Target mode: Change between the displayed glucose target modes.",
      "Doctor report: Generate a PDF with clinical details and recent measurements."
    ],
    "scenarios": [
      "Complete your profile accurately.",
      "Set your activity, water, and calorie goals; body composition may be entered manually.",
      "Record diagnoses and medications in the appropriate sections.",
      "Add other medications under clinical details.",
      "Update laboratory results and history before a medical appointment.",
      "Keep allergy, implant, and chronic-condition details current.",
      "Track changes in body fat and muscle mass if relevant."
    ]
  },
  {
    "title": "PRINT",
    "desc": "Prepare reports for printing.",
    "features": [
      "Print to an available printer.",
      "Only visible Records are printed; use category filters as needed.",
      "Choose the desired date range in Records.",
      "Choose Save as PDF in the print dialog."
    ],
    "scenarios": [
      "Review the selected date range before a medical appointment.",
      "Use the report option to generate a PDF."
    ]
  },
  {
    "title": "COPY REPORT",
    "desc": "Copy data for a doctor report or an AI analysis.",
    "features": [
      "A report combines profile data and selected statistics as text.",
      "The AI format prepares text for a language model.",
      "Use Menu > Copy report to copy the report."
    ],
    "scenarios": [
      "Paste the report into a message when you choose to share it.",
      "Paste the prepared text into an AI service if desired.",
      "Copied text is placed on your clipboard."
    ]
  },
  {
    "title": "PASTE ANALYSIS",
    "desc": "Store an AI response or report in the application.",
    "features": [
      "Paste or enter the analysis text.",
      "Save analyses for later review.",
      "Use the clipboard or paste manually.",
      "Show or print saved analyses when needed."
    ],
    "scenarios": [
      "Copy an AI response and paste it here.",
      "Use Menu > Paste analysis.",
      "Open past analyses from the history.",
      "Review the saved text with your clinician."
    ]
  },
  {
    "title": "QUICK ANALYSIS",
    "desc": "Summary statistics and graphs.",
    "features": [
      "A clinician should evaluate health measurements.",
      "The displayed analysis is not a diagnosis.",
      "Glucose average: Mean of valid entered readings; it is not a laboratory HbA1c.",
      "Variation (CV): A measure of variation in glucose readings.",
      "Blood pressure burden: Percentage of readings above the displayed threshold.",
      "Trend chart: Changes in recorded glucose and blood pressure over time.",
      "Zoom and pan using the mouse wheel or touch gestures.",
      "Press and hold the chart for its legend."
    ],
    "scenarios": [
      "Review the overall pattern of saved measurements.",
      "Zoom to inspect shorter periods.",
      "Press and hold for the line legend.",
      "Continue treatment and follow-up with a clinician.",
      "These summaries provide information, not a diagnosis.",
      "Ask your clinician to interpret the results."
    ]
  },
  {
    "title": "REORDER ENTRY CARDS",
    "desc": "Arrange the glucose, blood pressure, nutrition, activity, and symptom cards.",
    "features": [
      "Drag a card using the six-dot handle.",
      "The chosen order is saved in the browser.",
      "Move frequently used cards to the top."
    ],
    "scenarios": [
      "For example, move blood pressure to the top if you use it frequently.",
      "The order is saved when cards are moved."
    ]
  },
  {
    "title": "NUTRITION",
    "desc": "Track meals and calories.",
    "features": [
      "Search the food database.",
      "Use the diet wizard to request a food list from AI.",
      "Estimated calories depend on the selected quantity.",
      "Record daily water and food intake."
    ],
    "scenarios": [
      "Search for a food, select a quantity, and confirm.",
      "Foods without known calorie information may not contribute to the estimate.",
      "Press and hold an item to remove it.",
      "Select a medication taken with a record if needed."
    ]
  },
  {
    "title": "ACTIVITY",
    "desc": "Record exercise and physical activity.",
    "features": [
      "Choose an activity such as walking, running, or swimming.",
      "Enter the duration in minutes.",
      "Add custom activities."
    ],
    "scenarios": [
      "Enter a duration and save the activity."
    ]
  },
  {
    "title": "GLUCOSE",
    "desc": "Record blood glucose measurements.",
    "features": [
      "Choose a fasting, before-meal, after-meal, or control category.",
      "Select a relevant medication from the profile.",
      "Color indicators reflect the configured ranges."
    ],
    "scenarios": [
      "Enter a reading, choose its category, and save.",
      "A before-meal entry may offer a calendar reminder for a later reading.",
      "Select any medication taken at the time of the reading.",
      "Discuss appropriate target ranges with your clinician."
    ]
  },
  {
    "title": "BLOOD PRESSURE",
    "desc": "Record blood pressure and pulse.",
    "features": [
      "Enter systolic and diastolic pressure.",
      "Enter pulse in beats per minute.",
      "Color indicators reflect the configured rules."
    ],
    "scenarios": [
      "Record medications taken with the reading.",
      "Select relevant medication when saving.",
      "Discuss concerning readings with your clinician."
    ]
  },
  {
    "title": "FEELINGS & SYMPTOMS",
    "desc": "Record symptoms and physical feelings.",
    "features": [
      "Select common symptoms such as headache or fatigue.",
      "Add a symptom not in the list.",
      "Select multiple symptoms."
    ],
    "scenarios": [
      "Symptoms can be recorded with measurements or food entries."
    ]
  },
  {
    "title": "SMART ASSISTANT",
    "desc": "Notes and reminder cards.",
    "features": [
      "Create reminder cards and export them to a calendar; notifications depend on the calendar application.",
      "Save notes and questions for your clinician.",
      "Export reminders as an ICS calendar file.",
      "Choose the days for each reminder.",
      "Cards are sorted by time."
    ],
    "scenarios": [
      "Create a recurring medication reminder card.",
      "Record nutrition and activity information in the app.",
      "Choose reminder days on each card.",
      "Use Export to Calendar to create an ICS file.",
      "Import the downloaded file into a compatible calendar."
    ]
  },
  {
    "title": "AI ANALYSIS",
    "desc": "Prepare information for an AI-assisted analysis.",
    "features": [
      "Choose an AI service.",
      "Prepare a prompt using application data.",
      "Open the selected service.",
      "Save analyses for later review.",
      "View a pasted response."
    ],
    "scenarios": [
      "You can request an analysis of recent data.",
      "Review previous analyses when needed."
    ]
  },
  {
    "title": "RECORDS",
    "desc": "Browse and filter saved records.",
    "features": [
      "Switch between hidden, daily summary, and detailed views.",
      "Use category filters for available record types.",
      "Choose the last 7, 15, or 30 days, or all records."
    ],
    "scenarios": [
      "Choose the view that suits your task.",
      "Use category filters to narrow the list."
    ]
  },
  {
    "title": "RECORD CARDS",
    "desc": "View and manage individual records.",
    "features": [
      "Daily headers summarize the date and recorded totals.",
      "Open a day to see its cards, medication markers, edit, and delete controls.",
      "Nutrition cards show foods and estimated calories.",
      "Glucose and blood pressure cards show readings and associated information.",
      "Activity and symptom cards show their details.",
      "Use the pencil icon to edit a record.",
      "Use the trash icon to delete a record.",
      "Colors help distinguish categories."
    ],
    "scenarios": [
      "Open a record and edit it to correct an entry."
    ]
  }
];
