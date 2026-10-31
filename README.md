# Fright-Academy

A Halloween hackathon project with four monsters and four classes. A ghost can't touch a light switch, so it controls the room without touching anything: hand gestures, your voice, or head and face movements. The other monsters have hands and paws, so they use the mouse, touch and the keyboard. Built with plain HTML, CSS, JavaScript, [Three.js](https://threejs.org) for the 3D room, [MediaPipe](https://developers.google.com/mediapipe) (Hands and Face Mesh) and the browser's Web Speech API. No build step. An optional zero-dependency Node server (`server.js`) adds free-form AI voice commands; everything else runs in the browser.

## Controls

Hands-free input is the Ghost's mode. Camera, face tracking, voice and AI voice only exist while you play the Ghost, and switching to another monster stops them and releases the camera and microphone. Each of the other classes shows its own controls on the page.

**Ghost:**

| Action | Hand | Voice (say) | Head & face |
| --- | --- | --- | --- |
| Flick the lights | Pinch (thumb + index) | "Lights" (or "Flick") | Nod |
| Change the TV channel | Swipe hand sideways | "Channel" (or "Next"; "Previous" / "Back" goes backwards) | Tilt head right = next, left = previous |
| Slam the door (and trigger the smart plug) | Fist | "Slam" (or "Door") | Open mouth wide for a moment |
| Wail | Thumbs up | "Wail" | Turn your head for a moment |

Keyboard fallbacks: `L` lights, `←` `→` channel, `D` door, `B` blinds, `P` wail.

All inputs share one cooldown per action, so a nod plus a spoken "Lights" at the same moment only flicks the lights once.

**The other classes** (every class can be finished with the keyboard alone, or with mouse or touch alone):

| Class | Keyboard | Mouse / touch |
| --- | --- | --- |
| Witch: Potions | `1`-`6` pick up an ingredient, `A` add it to the cauldron, `S` stir, `B` brew, `E` empty | Click an ingredient in the room, click the cauldron to add it, drag circles over the cauldron to stir; Brew and Empty buttons |
| Werewolf: Dodging | `A` `D` or `←` `→` change lane, `W`, `↑` or `Space` jump, `S` or `↓` duck, `H` howl, `L` lights, `B` blinds | Click the left or right of the room to change lane; buttons for every move |
| Vampire: Scent Matching | Arrow keys or `W` `A` `D` float, `S` sniff, `F` bite, `L` lights, `B` blinds, `1` `2` `3` rooms | Move the pointer or drag to float, click a visitor to sniff; Sniff, Bite, Lights, Blinds and room buttons |

In Scent Matching `S` means sniff, so floating down is on the `↓` key only.

## Fright Academy (monster builder)

The page opens on a carousel where you build a monster: species, colour and accessory. Each species has its own 3D model in the room (the accessory and colour show on it too) and takes its own class, which the builder names next to the species note. **Change monster** reopens the carousel, and your last build is remembered. Switching monsters always starts from a clean house: nothing carries over from the last class, including the score.

The build sets three stats, **scare**, **stealth** and **stamina**. Each class uses them differently:

| Monster | Class | What you do | Scare | Stealth | Stamina |
| --- | --- | --- | --- | --- | --- |
| Ghost | Haunting 101 | Flick lights, change the channel, slam the door and wail at visitors until they run | More fear per action | Nothing special | Shorter cooldowns |
| Witch | Potions | Brew at the cauldron: pick up ingredients, follow (or discover) recipes, stir, and fill the order card before the candle burns out | More points per potion | Fewer stirs needed | A longer candle |
| Werewolf | Dodging | Hunters at the window and door fire silver bullets. Change lane, jump or duck, keep your three hearts, then survive a full moon | Hunters hesitate longer between shots | Longer telegraphs | Faster lane changes |
| Vampire | Scent Matching | Sniff visitors to learn their scent, then bite only the one who matches the coven's order. Lit lamps burn, mirrors give you away, and garlic hides a scent and makes you recoil | More points per good bite | Faster sniffing, less chance of being noticed, slower burn | Faster floating on the keyboard, shorter time on guard |

The **Instructor** panel names your class ("Instructor · Potions") and gives goals, not instructions. Each goal says what to achieve ("Fill the order on the card"), never which key or gesture to use, and goals still to come show as `???`. Press **Hint** for a nudge written for your class (each press gives a stronger one), or wait: if you are stuck the instructor offers a hint on its own after about 25 seconds and a stronger one after about 60. The instructor also makes the odd remark when something goes wrong, like a garlic wearer or a burned-out candle.

**Potions.** About six named recipes need 2 or 3 ingredients. The book lists four. The other two start as `???` and join the book when you brew them, which takes hints or experimenting. Some recipes care about order (they show arrows) and some want stirring first. The liquid and light change colour as things go in. A good brew glows, chimes and puts a bottle on the shelf, and filling the order card pays double. A bad one goes up in smoke and resets the cauldron.

**Dodging.** A red line and a glint show where a hunter is aiming, and a cue on the TV names it. A shot down your lane means change lane, a high line means duck, a low line means jump. Each kind of shot also cocks at its own pitch. Shots get faster and double up as you go. A hit costs a heart, and losing all three starts the round over. In a dark room with the blinds open, a howl scares the hunters off for a few seconds.

**Scent Matching.** Each visitor has three notes out of sweet, iron, smoky, floral, salty and citrus. Stay close while you sniff and they show one at a time, and a visitor who is being sniffed stands still. Fangs need a dark room and open blinds. An exact match walks out as a vampire. A wrong bite makes you sick: the exposure bar jumps, the visitor runs and you lose points. The game always keeps a way to fill the order: if nobody in the house matches, the next visitor does.

## Rooms and visitors

The Ghost and the Vampire work the whole house; Potions and Dodging stay in one room with no visitors. There are three rooms: living room, bedroom and kitchen. Every so often a visitor walks in (some wear garlic) through the door of a random room, an alert pops up with a **Go there** button and a red dot appears on that room's tab. As the Ghost, switch rooms and haunt them: flicking the lights or changing the channel adds a little fear, slamming the door scares them off at once. Points: +10 per fright, +60 when a visitor flees. Visitors who aren't scared leave on their own after about 30 seconds (the Vampire's visitors stay about 25 seconds longer, so there is time to sniff around).

Switch rooms with the tabs, keys `1` `2` `3` or the minimap. The Ghost can also use a **peace sign** (index and middle finger up) or say "living room", "bedroom" or "kitchen". Each room remembers its own lights and TV channel.

## Look and sound

The page is a neon graveyard: the 3D room plays on a dark crypt-green CRT TV in the middle, with cyan, magenta and acid-green neon outlines, tombstone-shaped panels and blinking string lights along the top. A glowing floor-plan minimap sits in the top right of the screen: a cyan dot marks your room, a magenta dot marks a visitor, and a pulsing ring shows where one just arrived. Click a room on the minimap to go there.

All sounds are generated in the browser with the Web Audio API, so there are no audio files and nothing to license:

- a low drone, wind and the odd creak in the background
- a spooky "whoo" and a chime when a visitor walks in
- a heartbeat that speeds up the longer a visitor is in your room, and jumps when you scare them
- a sting plus a gasp or scream when you frighten someone, and a longer scream when they flee
- a door-slam boom, a click for the lights and a burst of TV static for channel changes
- plops, stirs, a rising chord for a good brew and a puff for a bad one
- rifle clicks, a silver whine and a thud for the hunters
- sniffing, and an unhappy stomach after the wrong bite

Browsers only allow sound after a click or key press, so audio starts at your first click or key press. The **Mute** button and **Volume** slider are on the TV's bottom edge and are remembered between visits. Sound is paused while the tab is hidden.

## Command history

Open **Command history** under the room to see every action so far (newest first), with the time and the input that triggered it: hand, voice, head, face, button, mouse or keyboard. The last 200 entries are saved in your browser (localStorage) so they survive a reload. **Clear history** wipes them.

## AI voice commands (free-form, Ghost only)

Say things like "set the mood for a scary movie night" or "scare whoever is in the kitchen" and Gemini turns the phrase into a short list of actions (lights, TV channel, door slam, room switch, a wail, with dramatic pauses). Short keyword commands such as "Lights" or "Slam" still work instantly.

How it works: the browser sends the finished phrase to `server.js` (`/api/interpret`), which calls the Gemini API with your key and a fixed set of allowed actions. The key never reaches the browser, the server only accepts known actions in range from the model's answer, and requests are rate-limited to 20 per minute per address. If the server or the API is unavailable, voice falls back to the keywords. Spoken phrases are only sent when the **AI voice** checkbox is on, and the server doesn't log them.

Set it up:

1. Get a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`. `.env` is git-ignored, so don't rename it or commit the key anywhere else.
3. Run `node server.js` (Node 18 or newer), open http://127.0.0.1:8000 and click **Start voice**. The **AI voice** checkbox turns on by itself when the server has a key.

With AI voice on, the app acts on finished phrases only (after you pause), so a spoken command takes about a second to land. Turn the checkbox off for instant keyword-only voice.

Deploying: GitHub Pages can't run `server.js`, so there the site works but the AI voice checkbox stays disabled. To host it with AI voice, deploy this folder to any Node host (Render, Railway, Fly.io and similar) and set `GEMINI_API_KEY` and `HOST=0.0.0.0` as environment variables there. Anyone who can open that site can spend your API credit, up to the rate limit, so keep it for demos.

## Accessibility angle

Hands-free play is the Ghost's mode, and only the Ghost's. As the Ghost you get hands-free, contact-free control of lights, TV and appliances, which is useful for people with limited mobility or fine motor control. Someone who can't use their hands can use voice or head movement; someone who can't speak can use hands or head. The head and face tracking can be switched off with the checkbox.

The Witch, Werewolf and Vampire classes are not hands-free: they need a keyboard, mouse or touch screen, so if you can't use those, play the Ghost. Each of those classes can be finished with the keyboard alone or with mouse or touch alone. Dodging is a reflex game with a short warning before each shot (about 0.8 seconds, less as it speeds up), so it is the hardest class if you have slow or limited movement, and the Stealth stat only lengthens the warning a little.

Important events are announced through live regions: the log line under the room, and the instructor's goal and hint. Dodging announces where each shot is aimed, but at this speed a screen reader may not keep up, and its pitch cues help there. With `prefers-reduced-motion` set, the ambience in the room stands still, there is no camera sway or shake, and bullets show as a fading line instead of a flying streak.

## Run it

Browsers only allow camera and microphone access on `127.0.0.1` or HTTPS, so use a local server:

```bash
node server.js
```

(or `python3 -m http.server 8000` if you don't need AI voice)

Then open http://127.0.0.1:8000 and build a monster. As the Ghost, click **Start camera** for hand and head tracking and **Start voice** for voice commands. If you switch away and come back, click them again. An internet connection is needed to load Three.js and MediaPipe from a CDN.

Notes:

- Voice recognition needs Chrome or Edge. In Chrome, speech recognition sends audio to a cloud service. Hand and face tracking run locally in the browser.
- Voice works without the camera, and the camera works without voice.

## Customize

- Hand sensitivity: thresholds in `detect()` in `script.js`
- Head and face sensitivity: the `FACE` object above `detectFace()` (`nod`, `tilt` degrees, `mouth`, `hold` milliseconds)
- Cooldowns: the millisecond values in `ready('lights', 1200)` and similar
- Voice words: the patterns in `voiceCmd()`
- Sounds: each effect is a short function in `audio.js` (`slam()`, `whoo()`, `scream()` and so on); the heartbeat range is in `beat()`
- Monsters: species, colours, accessories, each class's name, and its goals and hints (`COURSE`) are plain objects at the top of `academy.js`; the 3D models (`MON.Ghost`, `MON.Vampire`, `MON.Witch`, `MON.Werewolf`) are in `room3d.js`
- Ghost: the fear from room actions (`FEAR`) and the wail are in `monsters.js`
- Potions (`classes.js`): `RECIPES` and `ING`, plus `rushMs`, `potPts` and `stirsFor` for the stat mapping
- Dodging (`classes.js`): `teleMs`, `travelMs` and `gapMs` for the difficulty, `POSE`, `MOON_MS`, `CLEAN_MS` and `HOWL_QUIET`
- Scent Matching (`classes.js`): `NOTES`, `noteMs`, `noticeChance`, `bitePts`, `floatSp`, `waryMs`, `REACH` and `VISIT_MS`
- Per-class keys, buttons and the controls table: each class object in `classes.js` (`key()`, `enter()`, `legend`); which page elements a class shows: the `data-for` attributes in `index.html`
- Colours: `--cyan`, `--mag` and `--acid` at the top of `style.css`
- AI voice: the model (`GEMINI_MODEL` environment variable) and the instructions in `SYSTEM` in `server.js`; add a new action by extending `TOOL`, `clean()` and `runPlan()`
- TV channels: the `CH` array at the top of `script.js`
- Real smart plug: add a `fetch('YOUR_WEBHOOK_URL')` call inside `slam()` (Home Assistant, IFTTT, Shelly, etc.)

## Project structure

```
index.html   page markup
style.css    styling
script.js    hand, voice and head/face detection (Ghost only), shared room actions and the minimap
academy.js   monster builder, stats and the instructor (goals and hints for every class)
monsters.js  the Ghost's fear rules and wail
classes.js   Potions, Dodging and Scent Matching, and switching between classes
audio.js     all sound effects and ambience (Web Audio), plus mute and volume
room3d.js    3D haunted room and the four monster models (Three.js)
server.js    optional Node server: serves the site and powers AI voice
package.json `npm start` runs server.js (no dependencies)
.env.example copy to .env and add your API key (.env is git-ignored)
```

## License

MIT
