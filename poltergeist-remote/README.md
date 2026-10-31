# Poltergeist Remote

A Halloween hackathon project: a ghost can't touch a light switch, so everything is controlled without touching anything: hand gestures, your voice, or head and face movements. Built with plain HTML, CSS, JavaScript, [Three.js](https://threejs.org) for the 3D room, [MediaPipe](https://developers.google.com/mediapipe) (Hands and Face Mesh) and the browser's Web Speech API. No build step. An optional zero-dependency Node server (`server.js`) adds free-form AI voice commands; everything else runs in the browser.

## Controls

| Action | Hand | Voice (say) | Head & face |
| --- | --- | --- | --- |
| Flick the lights | Pinch (thumb + index) | "Lights" (or "Flick") | Nod |
| Next / previous on whatever has focus (TV or jukebox) | Swipe hand sideways | "Next", "Previous" or "Back" | Tilt head right = next, left = previous |
| Change the TV channel, whatever has focus | | "Next channel", "Previous channel", "Channel" | |
| Change the song, whatever has focus | | "Next song", "Previous song", "Skip" | |
| Switch between TV and jukebox | Horns 🤘 (index and pinky up, held briefly) | "TV" / "Television", "Music" / "Jukebox", "Switch" | Raise your eyebrows for a moment |
| Play / pause music | Open palm, held still for 1 second | "Play", "Pause", "Stop", "Music on", "Music off", "Spooky music" | |
| Slam the door (and trigger the smart plug) | Fist | "Slam" (or "Door") | Open mouth wide for a moment |

Keyboard fallbacks: `L` lights, `←` `→` next / previous, `D` door, `M` switch TV / jukebox, `Space` play / pause.

All inputs share one cooldown per action, so a nod plus a spoken "Lights" at the same moment only flicks the lights once.

## Fright Academy (monster builder)

The page opens on a carousel where you build a monster: species (ghost or vampire), colour and accessory. The build sets three stats: **scare** (more fear per action), **stealth** (slows a vampire's sunlight burn) and **stamina** (shorter cooldowns). The **Instructor** panel then trains your monster with a short course of objectives. Ghosts learn to flick, swipe and slam, then scare a visitor. Vampires must switch the lights off, close the **blinds** (key `B`, button, or say "blinds") and keep their **sunlight exposure** low while scaring. **Change monster** reopens the carousel; your last build is remembered.

## Rooms and visitors

There are three rooms: living room, bedroom and kitchen. Every so often a visitor walks in through the door of a random room, an alert pops up with a **Go there** button and a red dot appears on that room's tab. Switch rooms and haunt them: flicking the lights or changing the channel adds a little fear, slamming the door scares them off at once. Points: +10 per fright, +60 when a visitor flees. Visitors who aren't scared leave on their own after about 30 seconds.

Switch rooms with the tabs, keys `1` `2` `3`, a **peace sign** (index and middle finger up) or by saying "living room", "bedroom" or "kitchen". Each room remembers its own lights and TV channel.

## Haunted Jukebox (Spotify)

The ghost possesses one thing at a time, shown by the **Possessing** pill on the screen. Next and previous go to whichever has focus, so with the jukebox possessed a swipe, a head tilt or saying "next" changes the song and leaves the TV alone, and the reverse. Play and pause work whatever has focus. Changing the song or playing and pausing in a room with a visitor scares them too, and the ambience drops to about 25% while music plays.

The site controls Spotify on a device you already have; it doesn't play audio itself. It logs in from the browser (Authorization Code with PKCE), so there's no client secret and `server.js` isn't involved. Until a Client ID is added, the panel says "Spotify isn't set up yet" and everything else works as normal.

Set it up:

1. Create an app at [developer.spotify.com](https://developer.spotify.com/dashboard). When asked which APIs you'll use, tick **Web API**.
2. Add these redirect URIs, exactly as written: `https://<app>.onrender.com/` and `http://127.0.0.1:8000/`. Spotify doesn't accept `localhost`, so open the site at `127.0.0.1` when running it locally.
3. Paste the Client ID into `SPOTIFY_CLIENT_ID` at the top of `spotify.js`. Optionally set `HAUNT_PLAYLIST` to a `spotify:playlist:...` URI, which starts when you say "spooky music" or ask the AI for something spooky.
4. A new app is in development mode: add each person who will use it (up to 5) to the app's allowlist under **User Management**. The app's owner needs Spotify Premium.
5. Start playing something in Spotify on any device, then click **Connect Spotify** in the jukebox panel.

## Look and sound

The page is a neon graveyard: the 3D room plays on a dark crypt-green CRT TV in the middle, with cyan, magenta and acid-green neon outlines, tombstone-shaped panels and blinking string lights along the top. A glowing floor-plan minimap sits in the top right of the screen: a cyan dot marks your room, a magenta dot marks a visitor, and a pulsing ring shows where one just arrived. Click a room on the minimap to go there.

All sounds are generated in the browser with the Web Audio API, so there are no audio files and nothing to license:

- a low drone, wind and the odd creak in the background
- a spooky "whoo" and a chime when a visitor walks in
- a heartbeat that speeds up the longer a visitor is in your room, and jumps when you scare them
- a sting plus a gasp or scream when you frighten someone, and a longer scream when they flee
- a door-slam boom, a click for the lights and a burst of TV static for channel changes

Browsers only allow sound after a click or key press, so audio starts at your first click or key press (Start camera and Start voice both count). The **Mute** button and **Volume** slider are on the TV's bottom edge and are remembered between visits. Sound is paused while the tab is hidden.

## Command history

Open **Command history** under the room to see every action so far (newest first), with the time and the input that triggered it: hand, voice, head, face, button or keyboard. The last 200 entries are saved in your browser (localStorage) so they survive a reload. **Clear history** wipes them.

## AI voice commands (free-form)

Say things like "set the mood for a scary movie night" or "scare whoever is in the kitchen" and Gemini turns the phrase into a short list of actions (lights, TV channel, door slam, room switch, music when Spotify is connected, with dramatic pauses). Short keyword commands such as "Lights" or "Slam" still work instantly.

How it works: the browser sends the finished phrase to `server.js` (`/api/interpret`), which calls the Gemini API with your key and a fixed set of allowed actions. The key never reaches the browser, the server only accepts known actions in range from the model's answer, and requests are rate-limited to 20 per minute per address. If the server or the API is unavailable, voice falls back to the keywords. Spoken phrases are only sent when the **AI voice** checkbox is on, and the server doesn't log them.

Set it up:

1. Get a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`. `.env` is git-ignored, so don't rename it or commit the key anywhere else.
3. Run `node server.js` (Node 18 or newer), open http://127.0.0.1:8000 and click **Start voice**. The **AI voice** checkbox turns on by itself when the server has a key.

With AI voice on, the app acts on finished phrases only (after you pause), so a spoken command takes about a second to land. Turn the checkbox off for instant keyword-only voice.

Deploying: GitHub Pages can't run `server.js`, so there the site works but the AI voice checkbox stays disabled. To host it with AI voice, deploy this folder to any Node host (Render, Railway, Fly.io and similar) and set `GEMINI_API_KEY` and `HOST=0.0.0.0` as environment variables there. Anyone who can open that site can spend your API credit, up to the rate limit, so keep it for demos.

## Accessibility angle

Hands-free, contact-free control of lights, TV and appliances for people with limited mobility or fine motor control. Someone who can't use their hands can use voice or head movement; someone who can't speak can use hands or head. The head and face tracking can be switched off with the checkbox.

## Run it

Browsers only allow camera and microphone access on `127.0.0.1` or HTTPS, so use a local server:

```bash
node server.js
```

(or `python3 -m http.server 8000` if you don't need AI voice)

Then open http://127.0.0.1:8000, click **Start camera** for hand and head tracking, and **Start voice** for voice commands. An internet connection is needed to load MediaPipe from a CDN.

Notes:

- Voice recognition needs Chrome or Edge. In Chrome, speech recognition sends audio to a cloud service. Hand and face tracking run locally in the browser.
- Voice works without the camera, and the camera works without voice.

## Customize

- Hand sensitivity: thresholds in `detect()` in `script.js`
- Horns and open-palm hold times and wrist drift: the `HOLD` object above `detect()`
- Head and face sensitivity: the `FACE` object above `detectFace()` (`nod`, `tilt` degrees, `mouth`, `brow`, `hold` milliseconds)
- Cooldowns: the millisecond values in `ready('lights', 1200)` and similar
- Voice words: the patterns in `voiceCmd()`
- Sounds: each effect is a short function in `audio.js` (`slam()`, `whoo()`, `scream()` and so on); the heartbeat range is in `beat()`
- Monsters: species, colours, accessories and training courses are plain objects at the top of `academy.js`
- Colours: `--cyan`, `--mag` and `--acid` at the top of `style.css`
- AI voice: the model (`GEMINI_MODEL` environment variable) and the instructions in `SYSTEM` in `server.js`; add a new action by extending `TOOL`, `clean()` and `runPlan()`
- TV channels: the `CH` array at the top of `script.js`
- Real smart plug: add a `fetch('YOUR_WEBHOOK_URL')` call inside `slam()` (Home Assistant, IFTTT, Shelly, etc.)

## Project structure

```
index.html   page markup
style.css    styling
script.js    hand, voice and head/face detection, plus controls and the minimap
academy.js   monster builder, stats and the instructor's training course
audio.js     all sound effects and ambience (Web Audio), plus mute and volume
spotify.js   Spotify login and controls (PKCE, no secret), plus the jukebox's now-playing display
room3d.js    3D haunted room (Three.js)
server.js    optional Node server: serves the site and powers AI voice
package.json `npm start` runs server.js (no dependencies)
.env.example copy to .env and add your API key (.env is git-ignored)
```

## License

MIT
