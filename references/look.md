# The look: what the genre does, and the self-check

Measured on 21 Oct 2026, frame by frame, from the leading channel's most-viewed episode (4.2M views, 24 fps) with
ffmpeg scene detection. We learn the technique (timing, camera grammar, light); every character, set and story stays
our own. Nothing confirms how the viral channels make their videos, so never say or imply they're made with Claude
or any other tool.

The pace and the shot grammar here hold for every look. How the house look (Ink Stick on Night Print) draws the
world and the cast is in `ink-stick.md`; where the two differ, `ink-stick.md` wins.

## Pace

| | The genre | Our target for 15-25 s |
|---|---|---|
| Cuts per minute, opening | about 27 (first 90 s) | 27 or more; the cold open can run 40-70 with reversals |
| Median shot | 2.7 s in the opening | 0.7 to 3 s |
| Long holds | up to about 12 s, always with action inside | nothing static over about 3 s |

- Cuts come from **changing shot size**, not from motion: wide, then a macro insert, then a medium, then a close-up
  of a hand, then a reaction. No two neighbouring shots share a size and angle.
- The opening runs about twice as fast as the rest. Cut on the word: `plan.py` lands each cut 2 frames before its
  cue word.

## Light does most of the work

- **Every light comes from something you can see:** a window with the sun or the moon in it, a pendant, a wall
  light, a desk lamp, string lights, a lit doorway, city windows. Pools of light, dark corners.
- Muted, mid-dark walls, so the practicals read; then `LightVeil` sinks the mid-tones further and leaves holes where
  the light falls.
- **The house look prints it:** each set goes through `<Print>`, which maps its brightness onto two inks and paper
  (ink, deep teal, teal, mist, paper). Dark rooms land in deep teal, the light in mist and paper, and the only other
  colour on screen is the power's pink. Story props that must read as the hero object (the pizza, the folder) can
  stay unprinted.
- **The cast catches the light as cut paper:** a paper edge on the side facing the light and a hard ink shadow on
  the other (built into `InkFig`). In the original dusk look it's a warm rim light instead (`rimId="rimR"`/`"rimL"`).
- Haze, dust in the beams (`Dust`), soft bokeh. Depth of field: foreground objects blurred dark (`Foreground`),
  the middle sharp, the background soft on close-ups (`blur16` on a scaled-up set).
- The frame is finished per shot by `PaperFinish` (a vignette, a paper mottle and a fine halftone) in the house look,
  and by the engine's `Grade` (grain on twos and a vignette) in the dusk look.

## Shot vocabulary

- **Establishing wide:** the whole lit room, the character small in it.
- **Medium** (waist up, camera zoom about 1.6 to 2) and **close-up** (head; 3 to 4.5 for an extreme close-up).
- **Macro insert:** an object huge in frame, shallow focus (a mug, a cookie, a hand), often a high or top-down angle.
- **Over the shoulder:** a big, dark, blurred foreground figure filling a third of the frame.
- **High angle / top-down** (looking down at a desk, a landing) and **low angle** (looking up at a character against
  the sky: the rooftop's `low` prop).
- **Schematic** for the science beat: a dark grid, line icons, labels in the mono face, numbers counting.
- **Title card:** a wide establishing shot with the title over it, small first line, big second line.

## Characters

- Mostly three-quarter or profile (`yaw`), rarely face-on; the face slides toward the side they face.
- Expressions swap instantly through a blink (`face3At`, `faceAt` on the old rig), never morph.
- **The house look animates the cast more than the genre does.** The genre's characters hold near-still. Ours never
  freeze: limbs bend in curves, heads and hair trail every move and overshoot, they breathe and sway in holds, blink
  on their own and squash on landings. The world around them stays slow, so the cast is always the liveliest thing
  in frame. (The person who set the house look found near-still figures stiff.)
- Life also comes from around them: a one-frame flash on an impact, a readout, a tag, dust, a swaying lamp, a slow
  push-in.
- **Told apart without colour:** the cast are all the same black ink, so each has a different height, hair, eyes and
  one telling shape, and the ones who speak have their own voices.
- One hero who never changes, drawn by one rig, so nothing can drift.

## On-screen text

Almost none. The title card, and small UI readouts in the mono face (a timer, a chip naming the power, a short
label, a specimen tag). No speech bubbles, no "HA HA", no captions of the voice. On a vertical Short, keep text out
of the right edge and the bottom quarter (YouTube's buttons and captions sit there) and clear of the power's chip.

## The storyboard self-check (step 5)

Look at `storyboard.jpg`, then open every still at full size. Fix anything that fails, re-render those shots, look
again. Only a board that passes goes to animation.

1. **One read in a second.** At phone size the subject and the action are clear. If it needs the voice to make
   sense, reframe it.
2. **Sizes change.** No two neighbours share a size and angle; the board has wides, inserts, mediums, close-ups and
   at least one high or low angle.
3. **Light from a source.** Every shot has a visible practical or sunlight, and the subject sits in or against a
   pool of it. Mid-tones are dark; nothing is evenly lit.
4. **The character pops.** In the house look, the black figure sits against a lit area (a window, a lamp's pool, a
   lit wall), its paper edge is on the lit side, and its paper eyes are the brightest thing on it. In the dusk look,
   the face is the brightest, sharpest thing in its area and the rim light is on the lit side. Either way, no dark
   limb on a dark wall.
4a. **Two inks and one pink.** Every set is printed; pink appears only on the power (the caliper, the squeeze, the
   glow round shrunk things, its flash) and nowhere else.
4b. **Flat limbs read.** No arm or leg shrinks into a stub, joints sit inside the body, and no neck or arm crosses a
   face unless the action puts it there.
5. **Depth.** A blurred dark foreground in about a third of the shots; soft backgrounds on close-ups.
6. **The world is full.** Wides show 20 or more designed objects; no empty wall, no floating furniture. Everything
   that stands has legs and a contact shadow.
7. **Perspective holds.** Objects sit on their surfaces, at the right scale for the character, toward the room's
   vanishing point.
8. **Acting matches the line.** The expression and pose say the line without the voice; the hand that moves is the
   near one (with `yaw < 0` the far arm hides behind the body). **Eyelines:** when the line says someone looks at
   something or someone, their head and eyes point there (in the shrink Short, both of them look down at Bea on
   "he looks at your sister").
9. **Continuity.** Same costume, same set layout, same props in the same places across shots of one place.
10. **Only the title and readouts as text,** spelled right, inside the frame, and not colliding with each other (a
    readout over the power's chip, a tag over a face).
11. **Ours.** Nothing resembles a famous character, a channel's hero or a brand.

## The motion check (step 6)

Pull frame grids of every action shot with `motiongrid.py` and read them like a flipbook.

- Anticipation before a big move (a crouch before a step, a wind-up before a grab), a hold of 2 frames on the beat
  where the character realises, overshoot and settle on landings and catches.
- Follow-through reads: after a big move the head and hair (Juno's spikes, Bea's bunches) lag, overshoot and settle
  within about half a second. If a move looks rigid, its keys are too close together for the springs to show.
- Nothing static for more than about a second: something always moves (dust, steam, a sway, a push-in), and the
  cast are always breathing and blinking.
- Heads and eyes go where the line says; props stay pinned to the hand through the whole move.
- The action lands on its word, within about 3 frames.
- Reversals read backwards (every move derives from `t`, so it does).
- No pops: a prop never jumps between frames unless it's meant to (a paste, a flash).
