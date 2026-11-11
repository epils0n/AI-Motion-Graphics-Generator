---
name: what-if-animation
description: Make a "What If" animated episode from one topic line ("What if you could rewind 10 seconds?"), in the house Ink Stick look - flat black stick figures cut from the same two-ink print as their world (Night Print), told apart by size, hair, eyes and voice, with one pink for the power. Writes the script on the seven-beat What If formula, voices it with ElevenLabs (the narrator, plus their own voice for any character who speaks), lays out a shot list at the genre's pace, renders a storyboard of stills and self-checks it before animating, animates every frame in code (Remotion and SVG, with an original cast that trails, breathes and blinks, rooms in perspective and light from lamps and windows), generates and syncs the sound, and masters a finished episode (15-25 s at 16:9, or a vertical Short up to 60 s) to -14 LUFS. Use when someone asks for a What If episode, animation or cartoon, "make a what if video about X", a stick-figure explainer in this style, or to run the free What If skill.
---

# What If animation

One topic line in, a finished episode out: 15-25 seconds at 1920 x 1080, or a YouTube Short up to 60 seconds at
1080 x 1920. Every frame is SVG that Claude writes (rendered by Remotion); the voice and the sound come from
ElevenLabs.

**The house look is Ink Stick on Night Print** (`references/ink-stick.md`). The world is printed in two inks on
paper, lit by its own lamps and windows, with one fluorescent pink that belongs only to the power. The cast are stick
figures cut from the same ink, told apart by size, hair, eyes and voice. They move more than the world: limbs bend,
heads and hair trail and overshoot, and they breathe and blink. Use it for every new episode unless the person asks
for something else.

Four examples ship in `studio/src/episodes/`, all ready to render:

| Example | What it is | Look |
|---|---|---|
| `shrink60` | "What if you could shrink anything?", a 56 s vertical Short, 34 shots. **The reference for the house look:** render `Shrink60Stick`. The suit speaks in his own voice. | Ink Stick (plus the four other looks tried on the way) |
| `shrink` | The same topic as a 20 s 16:9 episode, where Night Print was first built | Night Print, with the original 2D rig as cut cards |
| `rewind` | "What if you could rewind 10 seconds?", the proof clip: shots played backwards as the power | the original dusk look (Pip rig) |
| `copy-paste` | "What if you could copy and paste anything?": a kitchen set, a science schematic, a cliffhanger blackout | the original dusk look (Pip rig) |

Read `shrink60` before you start, and whichever other example is closest to your topic.

| File | What's in it |
|---|---|
| `references/ink-stick.md` | **The house look:** the cast, the world, the power, camera, animation and mix, with every number |
| `references/formula.md` | The seven-beat What If formula, the 15-25 s shape, script rules, choosing a topic |
| `references/look.md` | The measured look, pace, shot vocabulary, and the storyboard and motion checklists |
| `references/kit.md` | The building blocks: the Ink Stick kit, the engine, sets, room kit, light, UI, looks, and how to add each |
| `references/sound.md` | Writing sound events, prompts, levels, character voices, costs |
| `references/traps.md` | Everything that cost time on the example episodes |
| `studio/` | The Remotion project: copy it once, then every episode lives in it |
| `scripts/` | voice, castvoice, plan, stills, board, sfx, mixcheck, motiongrid, master (Python 3.9+ and Node) |

## Rules

- **The house look by default.** New episodes are Ink Stick on Night Print, drawn with `src/kit/ink.tsx`. Only use
  the original dusk look (the Pip rig) or one of the 3D looks in `shrink60` if the person asks for it.
- **Original characters only.** The house cast are ours: Juno (the hero, the "you" of the narration), his little
  sister Bea, and the man in the suit. So are Pip, Mo, the sister, mum and the suit on the original rig. Never a
  channel's own hero, and nothing that resembles a famous cartoon character: check every new character on the model
  sheet (Mo's first hat was dropped for drifting toward one).
- **Original stories.** The formula is shared; the episode isn't anyone else's. Don't remake a channel's title.
- **Never claim the viral channels are made with Claude** or any other tool. Nobody has said how they're made.
- **Keys by name only.** `ELEVENLABS_API_KEY`, from the environment or a `.env`
  above the studio. Never print, paste or hardcode a key.
- **Report the ElevenLabs credits** of every run: the scripts log them to `out/<slug>/costs.json` and `master.py`
  totals them in `report.json`. The voice's cost is read from the account's history (exact); sound clips don't show
  there, so their cost comes from the account counter, which can lag: re-read it before you report. Say the number
  when you hand the episode over. The copy-paste run cost 152 credits (78 for the voice, 74 for 12 new clips); the
  60 s shrink Short cost 1,253 (842 for the voice, 362 for 7 new clips, 49 for the suit's own lines).
- **Storyboard before animation.** No video render until the stills pass the self-check (step 5) and, when the person
  is in the loop, they've seen the board.
- **Every fact is real.** A number in the script is worked out and sourced in the episode's `science` field first.

## Setup (once per machine)

Needs Node 18+, ffmpeg and ffprobe on the PATH, Python 3.9+ with `numpy` and `Pillow`, and an ElevenLabs key.

```bash
cp -r <skill>/studio ./what-if-studio && cd what-if-studio && npm install
```

Everything below runs from that studio folder; `<skill>` is this skill's folder. To work offline or in your own
brand face, put a display font in `public/fonts/` and set `titleFont` in `src/studio.config.ts` (the default title
face, Bricolage Grotesque, and the UI faces load from Google Fonts at render time). To update an existing studio to
a newer engine, copy `<skill>/studio/src/engine`, `kit`, `designs` and `engine3d` over its own (and `Root.tsx`, for
the vertical format and the design sheets).

## The pipeline

Work through the steps in order. Each ends on something you look at before the next.

### 1. Script

Read `references/formula.md`. Search YouTube for the premise first: if a What If channel already has that exact
episode, change the power or the rule. From the topic line, decide the power's word, its rule, three escalating
demos and the turn (one real fact with a number). Write `src/episodes/<slug>/episode.json` with `id` (PascalCase,
the composition name), `slug`, `topic`, `title` (two lines), `script` (one entry per beat) and `science` (each fact:
the claim, the working, the source). 45 to 65 words for a 15-25 s episode; about 150 for a 60 s Short (the shrink
Short's script is 151). Read it aloud at pace: every line must be a picture.

Decide the format with the person: 1920 x 1080 (the default) or a 1080 x 1920 Short (pass `width` and `height` to
`defineEpisode`, as `shrink60/index.tsx` does). When a character speaks, write the quote and then tag it in the
narration ("'Our lab can make her big again,' he says."): the quote gets the character's own voice in step 2.

### 2. Voice

```bash
python <skill>/scripts/voice.py <slug>
```

One ElevenLabs take with character timestamps (the 356-character copy-paste take cost 78 credits), then the pauses
cut to the genre's pace: `public/<slug>/voice.wav` and `src/episodes/<slug>/words.json`. Check the length (15-25 s)
and the word times it prints. Retune pauses with `gaps` in `episode.json` and re-run: the take is cached, so that's free. Change a word
and it calls the API again.

If a character speaks, give them their own voice: add `cast_voices` to `episode.json` (their ElevenLabs voice, and
each line with the first and last word of the narrator's reading of it; see `references/sound.md`), then:

```bash
python <skill>/scripts/castvoice.py <slug>
```

It writes `public/<slug>/voice-cast.wav`: the narration with each quote swapped for the character's voice, fitted to
the same slot and matched to the narrator's level. The length doesn't change, so nothing downstream moves, and every
later script uses it as the voice. The suit's two lines in the shrink Short ("Daniel", `onwK4e9ZLuTAKqWW03F9`) cost
49 credits. Re-run it whenever you re-run `voice.py`.

### 3. Shot list

Design one shot per picture in the script (usually 9 to 14), varying the size and angle every cut (wide, insert,
medium, close-up, over the shoulder, high, low; see `references/look.md`). Add to `episode.json`:

- `shots`: `{ "id": "S1", "size": "medium", "set": "kitchen", "key": 14, "note": "what we see" }` (`key` is the
  frame of the shot's own clock the storyboard shows)
- `edit`: `{ "shot": "S1", "at": "cookie" }` per cut, cued on the word it lands on (`plan.py` lists the cue forms;
  `reverse`, `from`, `to` and `look` for powers that bend a shot's clock)
- `fx`: one-frame flashes and shakes, `{ "at": "S3+2", "kind": "flash" }`

```bash
python <skill>/scripts/plan.py <slug>
```

It writes `timeline.json` and `out/<slug>/shotlist.md` and prints the pace. Aim for 27+ cuts a minute in the
opening and no static shot over about 3 s; fix what it flags before drawing anything.

### 4. Storyboard

Read `references/ink-stick.md` for the look and `references/kit.md` for the building blocks. Write
`src/episodes/<slug>/shots.tsx`, one component per shot, each a pure function of its clock `t`, and `index.tsx` (the
episode and its power look), then add the episode to `src/episodes/index.ts`. Draw in the house look with the kit,
copying the patterns in `shrink60/shots.tsx`:

- `import { InkFrame, InkFig, inkStand, camV, Print, pose3At, face3At, handAt, ... } from '../../kit/ink'`.
- Wrap each shot in `<InkFrame>`, and print every set and prop through `<Print>`.
- Draw the cast with `<InkFig who="juno" | "bea" | "suit">`, after the set and before anything in front of them.
- Pin props to hands with `handAt`.
- Pink is for the power only (`Caliper`, `Squeeze`, `npMarked`).

At this step each shot only needs to be right at its `key` frame. When a topic needs a place the library lacks, build
it with the room kit and add it to `src/engine/sets/` (and to the skill's copy) so the next episode has it, as the
copy-paste run did with the kitchen and the schematic. A new character: add them to the stick rig (`kit.md`), then
check them on the model sheet from every side:

```bash
npx remotion still src/index.ts Designs out/model-sheet.png --frame=11
```

```bash
npx tsc --noEmit
node <skill>/scripts/stills.mjs <slug>
python <skill>/scripts/board.py <slug>
```

`out/<slug>/storyboard.jpg`: one captioned still per shot.

### 5. Self-check the stills

Look at the storyboard, then open every still in `out/<slug>/board/` at full size, and run the storyboard checklist
in `references/look.md` honestly, shot by shot. Write down what fails, fix it, re-render just those shots
(`stills.mjs <slug> S3 S7`), rebuild the sheet and look again. Repeat until it passes. Check `references/traps.md`
for the failure you're seeing before inventing a fix. If the person is in the loop, show them the board now and
take their notes before animating.

### 6. Animate

Bring each shot to life from its key pose. Use `pose3At` keys with anticipation, holds and contact poses, and
`face3At` for expressions (they swap through a blink). Walks use `walkInk`; camera moves use `kf`; then add the
power's look and the `fx`.

The rig adds the rest by itself: the head, hair and elbows trail and overshoot on springs, the figures breathe,
sway and blink, landings squash, and the head pops on each change of face. So don't key those yourself, and keep
the cast moving more than the world. Then render a draft and check the motion:

```bash
python <skill>/scripts/master.py <slug>
python <skill>/scripts/motiongrid.py <slug> S2 S5
node <skill>/scripts/stills.mjs <slug> --frames 120 240
```

Read the grids like a flipbook against the motion checklist in `references/look.md`; fix and re-render until it
reads. Check the eyelines especially: when the line says someone looks at something, their heads go there. Also check
that no limb reads as a stub or hangs off the body.

### 7. Sound

Read `references/sound.md`. Add `sound` to `episode.json`: the clips (prompt and length), one event per visible
action cued to its shot, ambiences per location, the music bed and the levels. Check what the library already has,
then generate:

```bash
python <skill>/scripts/sfx.py <slug> --dry
python <skill>/scripts/sfx.py <slug>
```

It prints the credits it used and sets the stem volumes in `timeline.json`. Then check that every word stays clear:

```bash
python <skill>/scripts/mixcheck.py <slug>
```

It lists the moments, while a word is being spoken, where effects or music come within 3 dB of the voice. A hit that
illustrates a word lands in the pause just after it, never on it; a bed (a hum, a drone) under a key line comes down;
if most of the stem crowds the voice, lower `sfx_lu`. Re-run sfx.py and the check until only deliberate overlaps
remain (a title boom, a turn).

### 8. Master and hand over

```bash
python <skill>/scripts/master.py <slug>
```

Renders, brings the mix to -14 LUFS with peaks under -1 dBTP, and writes `out/<slug>/report.json` (length, loudness,
pace, credits). It renders the composition named by `id` in `episode.json`. An episode built in several versions
(like `shrink60`) has one composition per version: set `id` to the one you want, render it, and copy the final
somewhere safe before the next one overwrites it. Watch the final file once through with sound. Hand over
`out/<slug>/<slug>-final.mp4` and `out/<slug>/storyboard.jpg`, with the length, the ElevenLabs credits used, and
anything you'd still improve.

## Where an episode lives

| Path | What |
|---|---|
| `src/episodes/<slug>/episode.json` | Everything you write: script, science, shots, edit, fx, sound |
| `src/episodes/<slug>/shots.tsx`, `index.tsx` | The drawing: one component per shot, the power's look |
| `src/episodes/<slug>/words.json`, `timeline.json` | Written by voice.py and plan.py (sfx.py adds the volumes) |
| `public/<slug>/` | voice.wav, voice-cast.wav (with the characters' own voices), sfx.wav, music.wav |
| `out/<slug>/` | board stills, storyboard.jpg, shotlist.md, motion grids, renders, costs.json, report.json |
| `library/sfx/` | Every generated sound clip, shared by all episodes |
