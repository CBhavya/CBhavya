/**
 * Demo shoot plan — loads without API calls when quota is exhausted
 */

import type {
  ProductionChecklist,
  ReferenceInspiration,
} from "@/lib/ai-providers";
import type { ShootRecommendations, StoryboardScene } from "@/components/StoryboardViewer";

export const DEMO_PROMPT =
  "I want to create a 60-second product teaser for a fitness app. Show someone doing a quick workout at home, morning light streaming in, energetic and motivational vibe. End with the app logo and a clear 'Download now' call to action.";

export const DEMO_RECOMMENDATIONS: ShootRecommendations = {
  tone: "Energetic, motivational, and aspirational",
  style: "Clean, modern vlog-style with cinematic moments",
  lighting: "Natural morning light, soft shadows, warm golden hour feel",
  pacing: "Quick cuts, upbeat rhythm, builds to CTA",
  equipment: "Smartphone or mirrorless, natural light, optional ring light for close-ups",
  locationTips: "Bright room near window, minimal clutter, fitness mat",
  otherNotes: "Keep it authentic — real sweat, real effort sells the app",
};

export const DEMO_SCENES: StoryboardScene[] = [
  {
    sceneNumber: 1,
    shotType: "Wide",
    cameraAngle: "Eye level",
    action: "Person wakes up, stretches, grabs phone — opens fitness app",
    dialogue: "",
    notes: "Morning light from window left, warm tones",
    description: "Bedroom, morning, aspirational start",
  },
  {
    sceneNumber: 2,
    shotType: "Medium",
    cameraAngle: "Low angle",
    action: "Quick workout montage — burpees, jumping jacks, high knees",
    dialogue: "",
    notes: "Dynamic movement, handheld feel, energetic",
    description: "Living room, fitness mat, sweat visible",
  },
  {
    sceneNumber: 3,
    shotType: "Close-up",
    cameraAngle: "Eye level",
    action: "Person checks phone — app shows progress, smile of satisfaction",
    dialogue: "",
    notes: "Screen glow on face, motivational moment",
    description: "Satisfied expression, app UI visible",
  },
  {
    sceneNumber: 4,
    shotType: "Wide",
    cameraAngle: "Straight on",
    action: "App logo fills screen, 'Download now' CTA",
    dialogue: "",
    notes: "Clean, bold, 2–3 second hold",
    description: "Logo animation, clear call to action",
  },
];

export const DEMO_SCRIPT =
  "A 60-second fitness app teaser that opens with an aspirational morning wake-up, cuts to an energetic workout montage, shows the user's satisfaction with their progress, and ends with a clear 'Download now' CTA.";

export const DEMO_FULL_SCRIPT = `INT. BEDROOM - MORNING

A person wakes, stretches, and grabs their phone. They open the fitness app with a smile.

CUT TO:

INT. LIVING ROOM - MORNING

Quick montage: burpees, jumping jacks, high knees. Sweat, effort, energy. The person pushes through.

CUT TO:

CLOSE-UP - PHONE SCREEN

Progress tracked. The person smiles, satisfied. The app has delivered.

CUT TO:

LOGO - APP BRANDING

"Download now" — bold, clear, 2-3 second hold.`;

export const DEMO_REFERENCE_INSPIRATION: ReferenceInspiration = {
  references: [
    {
      name: "Nike Training Club App Launch",
      type: "Fitness app ad, 60s, vertical",
      whyItWorks:
        "Opens with real sweat and effort — authenticity over polish. Quick cuts match workout intensity. App UI reveal at peak moment.",
      keyElements: ["Hook in first 3s", "Before/after energy", "App UI reveal", "CTA at end"],
      searchHint: "Nike Training Club app ad 2024",
    },
    {
      name: "Peloton 'The Gift' Campaign",
      type: "Fitness brand spot, 30–60s",
      whyItWorks:
        "Emotional arc from struggle to breakthrough. Morning light, intimate home setting. Music drives pacing.",
      keyElements: ["Emotional arc", "Morning light", "Home setting", "Music-driven"],
      searchHint: "Peloton The Gift ad",
    },
    {
      name: "Apple Fitness+ Workout Teaser",
      type: "Product teaser, 15–30s",
      whyItWorks:
        "Minimal, clean. Focus on movement and device. No dialogue — visuals and music only.",
      keyElements: ["Minimal", "Movement focus", "No dialogue", "Device integration"],
      searchHint: "Apple Fitness+ workout ad",
    },
  ],
  trendSummary:
    "Fitness ads in 2024 favor authenticity over polish: real sweat, home settings, morning light. Quick cuts and upbeat music. App UI reveals at peak moments. Vertical/social-first formats dominate.",
  breakdown:
    "Hook (0–3s): Wake-up or first rep — grab attention fast.\nMontage (3–45s): Quick cuts, varied angles (wide to close-up). Show effort, not perfection.\nPeak moment (45–50s): App UI or progress reveal — payoff.\nCTA (50–60s): Logo, 'Download now' — 2–3 second hold. Clean, bold.",
};

export const DEMO_CHECKLIST: ProductionChecklist = {
  props: ["Fitness mat", "Smartphone with app", "Water bottle", "Towel"],
  peopleRequired: ["Talent (fitness enthusiast)", "Camera op", "Director"],
  permissions: ["Location release (if filming at home)", "Talent release form"],
  safety: ["Clear floor space for movement", "Hydration on set", "Warm-up before intense shots"],
  scheduleNotes: "Call 7am for morning light. Setup 30 min. Shoot 2–3 hours.",
  weatherNotes: "Indoor shoot — no weather dependency.",
  budgetNotes: "Minimal: phone, natural light, single talent.",
};
