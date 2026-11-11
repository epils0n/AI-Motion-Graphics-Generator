"""Character voices: the lines a character speaks, in their own voice, dropped into the narration in the narrator's place.

python <skill>/scripts/castvoice.py <slug>
Reads  src/episodes/<slug>/episode.json "cast_voices", and words.json (the narration's word times, from voice.py)
Writes public/<slug>/voice-cast.wav: the narration with every character line swapped in, the same length, so the
       timeline and every cut stay where they are. plan.py, sfx.py, mixcheck.py and master.py use it as the voice
       from then on. Re-run it after every voice.py run.

episode.json "cast_voices":
  [{"who": "suit", "voice": "onwK4e9ZLuTAKqWW03F9",
    "settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.18, "use_speaker_boost": true},
    "lines": [{"text": "Our lab can make her big again", "from": "'Our", "to": "again"},
              {"text": "If you help us.", "from": "'If", "to": "us"}]}]
  text      what the character says
  from, to  the first and last word of the narrator's reading of that line (word, or word#2 for its second time)
Write the narration so it reads the quote and then tags it ("'Our lab can make her big again,' he says."): the tag
stays in the narrator's voice. Each character's lines go to ElevenLabs in one call, cached by text and settings in
library/voices/, so re-running is free. A line longer than its slot is sped up to fit (up to 1.3x, a warning past
1.15x); its level is matched to the narrator's on the same words.
"""
import base64, hashlib, json, re, subprocess, sys, time

import numpy as np

from wi import SR, STUDIO, api, decode, ep_dir, load_episode, load_json, log_cost, norm, pub_dir, save_json, spent_since, write_wav

slug = sys.argv[1]
ep = load_episode(slug)
cast = ep.get('cast_voices') or []
if not cast:
    raise SystemExit('No "cast_voices" in episode.json: nothing to do.')
words = load_json(ep_dir(slug) / 'words.json')
if not words:
    raise SystemExit('No words.json yet: run voice.py first.')
narr_path = next((pub_dir(slug) / f'voice.{e}' for e in ('wav', 'mp3') if (pub_dir(slug) / f'voice.{e}').exists()), None)
if narr_path is None:
    raise SystemExit('No public/<slug>/voice.wav: run voice.py first.')
VOX = STUDIO / 'library' / 'voices'
VOX.mkdir(parents=True, exist_ok=True)
MODEL = 'eleven_multilingual_v2'
real = [i for i, w in enumerate(words) if re.search(r'\w', w['w'])]  # skip stray quote marks


def find(target, start):
    t, nth = (target.split('#') + ['1'])[:2]
    seen = 0
    for i in real:
        if i >= start and norm(words[i]['w']) == norm(t):
            seen += 1
            if seen == int(nth):
                return i
    raise SystemExit(f'"{target}" not found in the narration after word {start}.')


narr = decode(narr_path)
out = narr.copy()
cursor = 0
fade = int(0.015 * SR)
rms = lambda x: float(np.sqrt(np.mean(x ** 2)) + 1e-9)
speech = lambda x: x[np.abs(x) > np.percentile(np.abs(x), 50)]

for c in cast:
    S = {'stability': 0.55, 'similarity_boost': 0.8, 'style': 0.18, 'use_speaker_boost': True}
    S.update(c.get('settings', {}))
    lines = c['lines']
    text = '... '.join(l['text'].strip() for l in lines)
    sig = hashlib.sha1(json.dumps([c['voice'], MODEL, S, text], sort_keys=True).encode()).hexdigest()[:12]
    cache = VOX / f"{c.get('who', 'cast')}-{sig}.json"
    if cache.exists():
        res = json.loads(cache.read_text(encoding='utf-8'))
        print(f"{c.get('who')}: reusing the cached take (no credits)")
    else:
        print(f"{c.get('who')}: {len(text)} characters to ElevenLabs (voice {c['voice']})")
        t0 = time.time()
        res = json.loads(api(f"/v1/text-to-speech/{c['voice']}/with-timestamps?output_format=mp3_44100_128", {'text': text, 'model_id': MODEL, 'voice_settings': S}))
        cache.write_text(json.dumps(res), encoding='utf-8')
        used, n = spent_since(t0, expect=1)
        log_cost(slug, f"voice: {c.get('who')}", used, f'{len(text)} characters' + ('' if n else '; not in the history yet, check the usage page'))
    mp3 = VOX / f"{c.get('who', 'cast')}-{sig}.mp3"
    if not mp3.exists():
        mp3.write_bytes(base64.b64decode(res['audio_base64']))
    take = decode(mp3)
    al = res['alignment']
    chars = ''.join(al['characters'])
    pos = 0
    for l in lines:
        # the line in the take, by its characters
        t = l['text'].strip()
        i = chars.index(t, pos)
        j = i + len(t) - 1
        pos = j + 1
        a = max(0.0, al['character_start_times_seconds'][i] - 0.03)
        b = al['character_end_times_seconds'][j] + 0.1
        clip = take[int(a * SR):int(b * SR)]
        # its slot: where the narrator read it, up to the next word
        wi0 = find(l['from'], cursor)
        wi1 = find(l['to'], wi0)
        cursor = wi1 + 1
        nxt = [k for k in real if k > wi1]
        s0 = words[wi0]['s'] - 0.08
        s1 = words[nxt[0]]['s'] - 0.06 if nxt else words[wi1]['e'] + 0.4
        room = s1 - s0 - 0.1
        if len(clip) / SR > room:
            tempo = (len(clip) / SR) / room
            if tempo > 1.3:
                raise SystemExit(f'"{t}" is {len(clip) / SR:.2f} s for a {room:.2f} s slot: shorten it, or give the narrator a longer pause there.')
            if tempo > 1.15:
                print(f'  warning: "{t}" sped up x{tempo:.2f} to fit')
            src = VOX / '_in.wav'
            dst = VOX / '_out.wav'
            write_wav(src, clip)
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(src), '-filter:a', f'atempo={tempo:.4f}', str(dst)], check=True)
            clip = decode(dst)
            src.unlink()
            dst.unlink()
        A = int(s0 * SR)
        B = int(s1 * SR)
        g = rms(speech(narr[A:B])) / rms(speech(clip))
        clip = clip * g
        seg = np.zeros(B - A)
        k = int(0.06 * SR)  # the character comes in a beat after the narrator would have
        seg[k:k + len(clip)] = clip[: B - A - k]
        ramp = np.linspace(0, 1, fade)
        out[A - fade:A] *= ramp[::-1]
        out[B:B + fade] *= ramp
        out[A:B] = seg
        print(f'  {s0:6.2f}-{s1:6.2f} s  "{t}"  ({len(clip) / SR:.2f} s, level {20 * np.log10(g):+.1f} dB)')

write_wav(pub_dir(slug) / 'voice-cast.wav', out)
print(f'wrote public/{slug}/voice-cast.wav ({len(out) / SR:.2f} s, the same length as voice.wav)')
