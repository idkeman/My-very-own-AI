# My Very Own AI

A personal AI assistant hosted as a static GitHub Pages site with a Supabase Edge Function protecting the model API key.

## Architecture
- GitHub Pages: `index.html`, `style.css`, `app.js`
- Supabase Auth: anonymous sessions identify each browser session
- Supabase Edge Function: `ai-chat`
- OpenAI Responses API: model inference
- LocalStorage: conversation history and settings stay in the browser

## One-time setup
1. In the Supabase project used by this app, enable **Anonymous Sign-Ins** under Authentication.
2. In **Edge Functions → Secrets**, create `OPENAI_API_KEY` with your OpenAI API key.
3. Enable GitHub Pages for this repository using the `main` branch and `/ (root)`.

The OpenAI key must never be put in `app.js`, HTML, or another public file.

## Current capabilities
- Multi-turn chat
- Three model choices
- Optional web search
- Custom AI name and personality
- Local conversation memory
- Export conversation
- Mobile-friendly UI
- Server-side API-key protection
- Basic per-session request throttling

## Next upgrades
The architecture is ready for persistent memory, accounts, file/image input, voice, tools, and a database-backed conversation system.