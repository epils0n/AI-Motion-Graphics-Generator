# Traps

Every one of these cost real time on the proof clip, the copy-paste run or the shrink Short. Check the list before
building a set, a shot or a character.

## The house look (Ink Stick)

- **Don't offer 3D as the answer to "stiff".** The shrink Short was built in Cel 3D, Paper Fold, Plush and Painted
  2D first; the person wanted flat 2D figures that move more, cut from the world's own ink. Liveliness comes from the
  motion (springs, breathing, squash), not from rendering.
- **A flat figure can't foreshorten.** A limb pointing at the camera read as a stub (an "arm" poking into an eye).
  The stick rig keeps every segment at 80% of its length or more; if a pose still reads wrong flat, change the pose
  so the limb swings across the picture, not toward the lens.
- **Joints must sit inside the body.** Arms hung from the 3D body's shoulder width floated beside the thin stick
  torso, and the tops of the legs showed as knobs. Shoulders and hips sit inside the outline (`shoulderX`, `hipX` in
  `stick.tsx`).
- **A low camera put the head behind its own body,** and the neck crossed the face. Draw order comes from the turn
  only, and the neck is drawn with the head.
- **Eyelines aren't automatic.** "Then he looks at your sister" shipped first with both characters staring at the
  camera. Key `headNod`, `headTurn` and `look` toward whatever the line names, and stagger who looks first.
- **Labels collide with the power's chip.** A readout above a caliper sat right on the SHRINK chip in the top-left
  corner, and a tag covered a face. Keep readouts and tags clear of the chip (y 150 to 230 on a Short) and off
  faces; lower the camera or move the caliper's top rather than shrink the text.
- **A tag's punched hole covers its last letter** if the tag is sized only for the text: `SpecimenTag` leaves room
  for it now. Check any new label with a hole or an icon.
- **Props follow the drawn hand.** Use `handAt` with exactly the figure's pose, yaw, position, scale and pitch: it
  includes the springs and the flat layout, so a prop placed from the raw pose drifts off the hand.
- **The halftone moirés in small previews.** A still rendered at 0.3 scale showed a grid on the faces that isn't in
  the full-size frame. Check textures at full size before fixing them.
- **One episode, several versions, one `id`.** `master.py` renders whatever `episode.json`'s `id` names and writes
  the same output file; copy each final out before the next render overwrites it.
- **`remotion render --sequence` wants a folder,** not a file pattern, as its output.

## Drawing

- **Dark limbs vanish on dark sets.** Navy limbs on a navy wall disappeared. Limbs are light with a dark outline, or
  the body is dark and catches a rim light (look B, the hoodie) with the head the brightest thing.
- **Stair sides are one continuous piece:** a sawtooth top and a stringer board along the underside. Alternating
  fills per step read as stacked boxes.
- **Wall texture stays faint.** The `g3wall` filter at its set strength; stronger reads as mould.
- **Furniture needs legs and contact shadows.** Desks without legs floated; every standing thing gets an ellipse of
  shadow where it meets the floor.
- **Mid-ground characters must sit inside the crop** of every shot that uses the set, not just the wide.
- **LightVeil strength:** about 0.28 in a wide that must show the floor, 0.42 to 0.5 elsewhere. At 0.52 the first
  wide went so dark the floor vanished.
- **The raised hand is the near one.** With `yaw < 0` the far arm hides behind the hood: raise `armL`.
- **Over-the-shoulder needs a big foreground figure,** about a third of the frame, dark and blurred (`blur16`). A
  small one reads as a mistake.
- **Characters must stay ours.** Mo's first hat (a teal beanie with a yellow pom-pom) drifted toward a famous
  cartoon's; it became curly hair and headphones. Check every new look's silhouette on the cast sheet.
- **Props near a hand get read as the hand.** In copy-paste's top-down desk shot a ruler sat where the arm came in
  and read as a thin beige arm. Keep a clear space round hands, and scale an arm that enters an insert up hard (a
  sleeve 100 to 130 wide, the mitten at 4.5 to 5).
- **Hands come from where the character is.** In an insert, the arm enters from the side of frame where that
  character stands in the neighbouring shots (the far side of the desk is the top of a top-down frame).
- **A big room's light holes must be small.** A LightVeil hole the size of the back wall lights it evenly and the
  room goes flat and grey; keep each hole about the size of its pool of light (the kitchen window: 430, not 720).
- **Nothing bright competes with the face.** A light-grey fridge was as bright as Pip's head; props sit a step
  darker than the character.
- **A blackout needs lights to switch off.** The rooftop's city has few lit windows by default; raise `cityLit`
  (about 2.5) or the sweep is invisible.
- **Long titles:** line 2 over about 20 characters needs `size` 88 to 100 to keep margins (more if you set a
  wider title face than the default).
- **Things that count must match the night.** A calendar's crosses, a clock, a pile that grows: the first demo of
  "skip sleep" showed nine crossed days on night one. Set the count per shot (`crossed={0}`).
- **Front-on sitting doesn't read.** Legs swing in the facing direction, so a seated figure facing camera looks like
  it's standing in front of the furniture. Seat characters in profile: thighs forward (`a` about 80), shins back
  down (`b` about -80), hips on the edge.
- **Focus rings scale with the camera.** At zoom 2 they fill the frame; wrap them in a `scale(0.4)` about the head.
- **Unique ids.** A set that draws gradients, masks or clip paths takes an `id` prop; give each shot its own (`sh4`),
  and a different one again if the same set renders twice in one frame (a blurred copy behind a close-up).
- **A hand can't touch the head.** The head is drawn after the arms, so a mitten raised to a temple or a mouth
  disappears behind it, and an arm raised beside the head reads as a wave. In a close-up, leave the rig's arms down
  and draw the arm yourself after the character: a sleeve path from off frame and a mitten at the prop, as the inserts
  in `episodes/copy-paste/shots.tsx` do (that's how the preview run fed Mo a slice and put a phone to Pip's ear). In a
  medium, act it with the head and a jolt instead.
- **A grade on a whole shot needs a screen-sized filter box.** Filter the outer group with `filterUnits="userSpaceOnUse"`
  and a 0..1920 x 0..1080 region: the default box is the content's, and sets draw far past the frame.
- **A colour grade lifts black.** The preview look's matrix turned a black screen navy; draw true black outside the
  graded group.

## Motion

- **Everything derives from the shot's clock `t`.** No `Math.random`, no state, no global frame inside a shot: a
  reversed or held segment must draw the same frame for the same `t`. Scatter with `rnd(seed, i)`.
- **Faces swap, they don't morph.** Use `faceAt` keys; `poseAt` holds the earlier face until its key lands.
- **A walk on stairs uses `hipGround`,** not `stepTop`, or the hips jump step by step.
- **Lands and catches** need the prop to follow the hand exactly: compute the hand with `toWorld(pose,
  joints(pose).armR.end)` and attach the prop there (the proof clip's catch).

## Sound

- **A pop on a word covers the word.** Land illustrative hits in the pause after their word (see `sound.md`).
- **Beds bury facts.** A rising hum under the science line masked it; beds under key lines stay low (0.1 to 0.15).
- **A hit's tail runs into the next word.** A 0.6 s beep after "Midnight" still sounded under "Skip": give short
  hits an `until` cue at the next shot. Time the picture's action into the pause too (the skip episode snaps awake
  about 10 frames into each skip shot, after the word).
- **Levelling is per stem.** `sfx.py` levels the whole effects stem, so lowering one event raises the rest.
- **mixcheck's windows are 0.4 s,** longer than most pauses, so a hit placed correctly in the 0.3 s after a word
  still gets flagged with it. When a flag sits on a word's last syllable, check that word in 0.1 s windows before
  moving anything: a fricative tail ("face", "catch") under a bed or a hit that follows it is not a covered word.

## Pipeline

- **Storyboard first.** A still renders in about two seconds, a full 23 s episode in about two and a half minutes.
  Iterate on stills.
- **Never cut to an empty frame.** Whatever a shot builds, something is already on at its first frame (start a pop at
  `t + 3`, not `t - 1`).
- **plan.py lists only audio that exists:** a missing `staticFile` fails the render.
- **Cue words can't contain a hyphen or a plus:** cue the next word, or use `s:` / `f:`.
- **Google Fonts need a connection** at render time. Set a local title face in `studio.config.ts` to work offline.
- **Windows:** `master.py` calls `npx.cmd`; Remotion downloads its own headless Chrome on the first render (about
  110 MB, once).
- **ElevenLabs costs:** the voice's exact cost is in the history; sound clips only move the account counter, which
  can lag. Re-read it before reporting.
- **Remotion Studio can't drag these shots around:** they're computed from the timeline, so retime in
  `episode.json` and re-run `plan.py`.
