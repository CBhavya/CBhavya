# VoicePrompt Studio

**Voice in, shoot plan out.** Record your idea, add context — get a full production plan with shot lists, camera angles, full script, and a shoot-day checklist. Built for directors, line producers, and content creators. Powered by **Gemini 3.1 Pro**.

![VoicePrompt Studio](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Gemini](https://img.shields.io/badge/Gemini-3.1%20Pro-blue?logo=google)

## Features

- **Voice recording** — Record or type your idea. Transcribed via Gemini (requires HTTPS or localhost).
- **Shoot plan** — 4 production-ready scenes with shot type, camera angle, action, dialogue, notes.
- **References & trends** — AI suggests trending examples and breakdown to inform your plan.
- **Full script** — Production-ready script adjoining the shot plan.
- **Shoot day bible** — Props, people, permissions, safety, schedule, weather, budget. Tick off as you go.
- **Version control** — Save plans, edit (schedule, weather, scene notes), save as new version.
- **Print** — One-click print for on-set use.
- **Multi-provider** — Switch between Gemini, GPT, Claude when quota hits.

## Quick Start

1. **Clone and install**

   ```bash
   git clone https://github.com/CBhavya/CBhavya.git
   cd human-agent-dashboard  # or your repo folder
   npm install
   ```

2. **Set up API keys**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```
   GEMINI_API_KEY=your_key          # Required (voice + storyboard)
   OPENAI_API_KEY=sk-...            # Optional (switch to GPT)
   ANTHROPIC_API_KEY=sk-ant-...     # Optional (switch to Claude)
   ```

3. **Run**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Demo

- **Load demo idea** — Pre-fills a fitness app teaser prompt.
- **Load demo plan (no API)** — Full shoot plan without API calls (use when quota is exhausted).
- **Generate Shoot Plan** — Creates recommendations, references, script, checklist, and shot cards.

## Project Structure

```
app/
  page.tsx                 # Main UI
  api/
    storyboard/route.ts     # Shoot plan generation
    transcribe/route.ts     # Audio → text
    providers/route.ts      # Available AI providers
components/
  VoiceRecorder.tsx        # MediaRecorder + transcription
  PromptForm.tsx           # Reference, tone, provider, generate
  StoryboardViewer.tsx     # Recommendations, script, bible, shot cards
lib/
  ai-providers.ts          # Gemini, OpenAI, Anthropic abstraction
  gemini.ts                # Gemini client, transcription, images
  demo-plan.ts             # Demo data (no API)
  saved-plans.ts           # Versioned plans (localStorage)
  error-utils.ts           # User-friendly error handling
```

## Deploy

[Vercel](https://vercel.com) (recommended):

1. Push to GitHub.
2. Import repo at [vercel.com/new](https://vercel.com/new).
3. Add env vars: `GEMINI_API_KEY` (and optionally `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
4. Deploy.

## Hackathon

Built for Google DeepMind hackathon. Uses **Gemini 3.1 Pro** for shoot recommendations, scenes, script, production checklist, and reference inspiration.

## License

MIT
