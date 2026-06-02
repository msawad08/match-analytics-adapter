# Task: Build an AI Highlight Curation Pipeline (Node.js/TypeScript)

Hey Claude, help writing a Node.js script (TypeScript preferred) for an AI highlight curation pipeline. 

I have a file called `raw_events.json` which contains a list of 142 raw sports events from a U12 football match. The schema includes player IDs, timestamps, event types (like shot, goal, save, key_pass, turnover), coordinates, and a confidence score.

Here is exactly what I need the script to do:

### 1. Rule-Based Clustering (Stage 1)
First, read the `raw_events.json` file. Don't just dump all 142 events into the LLM because it's messy and wastes tokens. Write a deterministic heuristic function to group these events into logical chronological "moments" or "clips" using a sliding time window (say, around 30-35 seconds apart). Filter out any low-confidence noise (anything under 0.60 confidence). If a couple of passes, a dribble, and a shot happen close together, they should form one candidate clip.

### 2. LLM Semantic Curation via Claude API (Stage 2)
Take those clustered moments and pass them to the Anthropic API using the official `@anthropic-ai/sdk` library. Use the latest Claude Sonnet 4.6 model. 

I want you to write the prompt that our script will send to the API. The prompt needs to tell the LLM that it's an expert youth sports curator. Its job is to look at these candidate clips, resolve the player names using the `players_in_match` metadata array, and pick the absolute best 6 to 10 clips that a parent would love to share. Tell it to prioritize action in the box, high-confidence shots, big saves, or great team build-ups. 

### 3. Strict JSON Output
Force Claude to return a clean, structured JSON object. Use standard system instructions or Anthropic's JSON mode/system prompts so it doesn't return conversational prose. The final output written to a file or logged by our Node script should look like this:
- `match_id`
- `total_clips_curated`
- An array of `clips`, where each clip has: `clip_id`, `start_timestamp_seconds`, `end_timestamp_seconds`, a catchy `headline` (like "Great Save by Omar Al-Sayed"), a `curator_score` (0-10), an array of `primary_players` (using real names, not IDs), and a quick one-sentence `justification` for the parents.

### Technical Requirements
- Use the official `@anthropic-ai/sdk`.
- Assume the API key is retrieved via `process.env.ANTHROPIC_API_KEY`.
- Keep the code clean, modular, and easy to read since a hiring manager is going to look at this. 
- Show me both the script code and a breakdown of how the prompt layout looks. Let's build this.