# Task 3 Reflection

---

## Q1 What did you cut to ship inside the time budget, and what would you add first if you had a full week?

Given the 3-hour constraint, I prioritised a functional core architecture over perfect optimisation. For Task 1, I cut the multi-pass sliding window — what shipped is a deterministic chronological time-gap threshold that builds the event buckets cleanly, but it doesn't know anything about pitch position or team transition dynamics. It works, but it's naive. For Task 2, I skipped global state management or React Context for user sessions entirely. The cascading fetch logic lives inside the service adapter layer, tied to the hero component's lifecycle. That's clean enough for a single-component demo, but it doesn't scale to a full app. Auth is mocked, multi-child support is a hardcoded `data[0]`, and there's no SWR caching — every page load fires three sequential fetches from scratch. Conscious trade-offs, not oversights.

With a full week, my first priority would be **prompt engineering robustness and output predictability**. Right now, if Claude returns malformed JSON the whole pipeline crashes. I'd wrap the LLM output in a Zod schema validator — structured guarantee, not just a try/catch. Beyond that, I'd decouple the clustering into an independent pipeline service that uses the coordinates to group clips around team transition dynamics rather than raw time proximity. A sequence that moves from deep defence to the opponent's box tells a story a 35-second window never will. That richer narrative structure going into the prompt would meaningfully improve the quality of what the model picks. Longer term, I'd evolve this into a proper tool-augmented pipeline with a retrieval-backed feedback loop where parent engagement signals continuously refine what "good" means, rather than keeping that definition frozen at whatever the prompt said on day one.

---

## Q2 How would you evaluate whether your top 8 picks are actually good, beyond "it looks right"?

"It looks right" isn't a metric. The first thing I'd do is run the same clips through real humans — a coach, a parent, and someone with no football context and have them rate independently. Then compare that against what the model picked. If the model's choices line up with the coach but not the neutral rater, you've confirmed it's actually reading the game rather than just reacting to visual noise. The real question is simpler than it sounds: out of the 8 clips the model surfaces, how many would a parent actually share? That's the number you track, and that's the number you optimise against over time.

The harder problem is that "good" shifts. A clip that felt impressive in April might look ordinary once the same kid is scoring every week in June. So I'd log every curation run what got picked, what got dropped, what the confidence levels were and build a lightweight view to catch when the model starts drifting, like consistently ignoring defensive plays or only ever surfacing goals. What you cut matters as much as what you keep. If certain event types keep getting left out, you want to know whether that's the model making a smart call or just a gap in the prompt you never noticed.

---

## Q3 If you joined Fairplai tomorrow, what's the first thing you'd ship in week 1, and what would you specifically NOT touch?

First thing I'd ship: something small but parent-visible. Probably a notification — push or email — when a new highlight is ready, not the curation engine itself. Tight scope, immediate parent impact, and it forces me to understand the full data flow end-to-end before touching anything heavier. It also gives me a reason to talk to actual parents in week 1, which will sharpen my instincts about what the product actually needs vs. what looks good in a spec.

What I'd specifically NOT touch: the CV pipeline and video processing. That's the core of the product and I don't yet know where the edge cases live, what the confidence thresholds were calibrated against, or what a "bad" detection looks like vs. a genuine model limitation. Going in blind and shipping a change there is how you introduce a subtle bug that doesn't surface until a parent asks why their kid's goal didn't show up. I'd spend the first week reading, asking questions, and mapping failure modes — not writing production code against it. Same applies to auth and anything currently running in prod.

---

## On AI tool usage

**Where it helped:**
- Scaffolding: tsconfig splits, jest config, Next.js route handler boilerplate — the model got the shape right fast and I focused on the logic
- The adapter layer: generating the field mapping table first, then the code, surfaced two mismatches (`event_label` casing, `analysis.status` vocabulary) I'd have caught later in testing
- Test fixtures: turning the v1 response spec into realistic mock data was instant

**Where it didn't:**
- I had to step in on the clustering approach. My first instinct was to just pass all 142 events to Claude and let it figure things out and honestly the model would have gone along with that without questioning it. I made the call to pre-cluster first, filter the noise, and send structured moments instead. That decision came from me, not the tool
- Same with the overall architecture. I had to define the Anti-Corruption Layer pattern explicitly before anything clean came out. Once I named it, the model executed it well — but it wasn't going to suggest that structure on its own
- UI needed a few tweaks. The model got me most of the way there but I had to adjust the spacing, colours, and layout to get it feeling right
