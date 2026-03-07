# VoicePrompt Studio

A multimodal prompt playground where you can record voice ideas, add reference material and tone, and generate structured content scripts using Google Gemini.

## Quick Start

1. **Set up your API key**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):

   ```
   GEMINI_API_KEY=your_key_here
   ```

2. **Run the app**

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Features

- **Voice Recording** — Record audio in the browser via MediaRecorder, transcribed to text by Gemini
- **Reference Material** — Optional text/article input for context
- **Tone/Style** — Optional instructions (e.g. professional, conversational)
- **Generate Script** — Creates Title, Hook, Outline, and Full script via Gemini 1.5 Pro
- **Improve Prompt** — Rewrites the prompt for higher quality, then regenerates

## Project Structure

```
app/
  page.tsx              # Main VoicePrompt Studio UI
  api/
    generate/route.ts    # Script generation + improve prompt
    transcribe/route.ts  # Audio → text via Gemini
components/
  VoiceRecorder.tsx      # MediaRecorder + transcription
  PromptForm.tsx         # Reference, tone, generate buttons
lib/
  gemini.ts              # Gemini API client
```

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- Google Gemini API (@google/genai)
- Browser MediaRecorder API
