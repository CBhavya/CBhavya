# VoicePrompt Studio — Demo Guide

## 2-Minute Demo Flow

1. **Load demo idea** → Click to pre-fill a fitness app teaser prompt.
2. **Generate Shoot Plan** → Wait for AI to generate (or use **Load demo plan** if quota is exhausted).
3. **Walk through output:**
   - **Recommended for your shoot** — Tone, style, lighting, equipment.
   - **References & trends** — Nike, Peloton, Apple examples + breakdown.
   - **Full script** — Production-ready script format.
   - **Shoot day bible** — Props, people, permissions, safety. Tick off items.
   - **Shot plan** — 4 scenes with shot type, angle, action, notes.
4. **Save plan** → Name it (e.g. "Fitness teaser").
5. **Print shoot plan** → Take it on set.

## Version Control Demo

1. Load a saved plan from **Saved plans** dropdown.
2. Edit **Schedule**, **Weather**, or **Scene notes** (fields become editable).
3. Click **Save as new version** → Add note (e.g. "Shooting outside - weather good").
4. Use version dropdown to switch between versions.

## When Quota Is Exhausted

- Click **Load demo plan (no API)** — Full plan without API calls.
- Or add `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` and switch provider.

## Voice Recording

- Works on **localhost** or **HTTPS**.
- On HTTP (e.g. `10.x.x.x:3000`), mic is disabled — type your idea instead.
