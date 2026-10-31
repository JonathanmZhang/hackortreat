# Poltergeist Remote

A Halloween hackathon project: a ghost can't touch a light switch, so everything is controlled without touching anything: hand gestures, your voice, or head and face movements. Built with plain HTML, CSS, JavaScript, [Three.js](https://threejs.org) for the 3D room, [MediaPipe](https://developers.google.com/mediapipe) (Hands and Face Mesh) and the browser's Web Speech API. No build step. An optional zero-dependency Node server (`server.js`) adds free-form AI voice commands; everything else runs in the browser.

## Controls

| Action | Hand | Voice (say) | Head & face |
| --- | --- | --- | --- |
| Flick the lights | Pinch (thumb + index) | "Lights" (or "Flick") | Nod |
| Change the TV channel | Swipe hand sideways | "Channel" (or "Next"; "Previous" / "Back" goes backwards) | Tilt head right = next, left = previous |
| Slam the door (and trigger the smart plug) | Fist | "Slam" (or "Door") | Open mouth wide for a moment |

Keyboard fallbacks: `L` lights, `←` `→` channel, `D` door.

All inputs share one cooldown per action, so a nod plus a spoken "Lights" at the same moment only flicks the lights once.

## Rooms and visitors

There are three rooms: living room, bedroom and kitchen. Every so often a visitor walks in through the door of a random room, an alert pops up with a **Go there** button and a red dot appears on that room's tab. Switch rooms and haunt them: flicking the lights or changing the channel adds a little fear, slamming the door scares them off at once. Points: +10 per fright, +60 when a visitor flees. Visitors who aren't scared leave on their own after about 30 seconds.

Switch rooms with the tabs, keys `1` `2` `3`, a **peace sign** (index and middle finger up) or by saying "living room", "bedroom" or "kitchen". Each room remembers its own lights and TV channel.

## Command history

Open **Command history** under the room to see every action so far (newest first), with the time and the input that triggered it: hand, voice, head, face, button or keyboard. The last 200 entries are saved in your browser (localStorage) so they survive a reload. **Clear history** wipes them.

## AI voice commands (free-form)

Say things like "set the mood for a scary movie night" or "scare whoever is in the kitchen" and Gemini turns the phrase into a short list of actions (lights, TV channel, door slam, room switch, with dramatic pauses). Short keyword commands such as "Lights" or "Slam" still work instantly.

How it works: the browser sends the finished phrase to `server.js` (`/api/interpret`), which calls the Gemini API with your key and a fixed set of allowed actions. The key never reaches the browser, the server only accepts known actions in range from the model's answer, and requests are rate-limited to 20 per minute per address. If the server or the API is unavailable, voice falls back to the keywords. Spoken phrases are only sent when the **AI voice** checkbox is on, and the server doesn't log them.

Set it up:

1. Get a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`. `.env` is git-ignored, so don't rename it or commit the key anywhere else.
3. Run `node server.js` (Node 18 or newer), open http://localhost:8000 and click **Start voice**. The **AI voice** checkbox turns on by itself when the server has a key.

With AI voice on, the app acts on finished phrases only (after you pause), so a spoken command takes about a second to land. Turn the checkbox off for instant keyword-only voice.

Deploying: GitHub Pages can't run `server.js`, so there the site works but the AI voice checkbox stays disabled. To host it with AI voice, deploy this folder to any Node host (Render, Railway, Fly.io and similar) and set `GEMINI_API_KEY` and `HOST=0.0.0.0` as environment variables there. Anyone who can open that site can spend your API credit, up to the rate limit, so keep it for demos.

## Accessibility angle

Hands-free, contact-free control of lights, TV and appliances for people with limited mobility or fine motor control. Someone who can't use their hands can use voice or head movement; someone who can't speak can use hands or head. The head and face tracking can be switched off with the checkbox.

## Run it

Browsers only allow camera and microphone access on `localhost` or HTTPS, so use a local server:

```bash
node server.js
```

(or `python3 -m http.server 8000` if you don't need AI voice)

Then open http://localhost:8000, click **Start camera** for hand and head tracking, and **Start voice** for voice commands. An internet connection is needed to load MediaPipe from a CDN.

Notes:

- Voice recognition needs Chrome or Edge. In Chrome, speech recognition sends audio to a cloud service. Hand and face tracking run locally in the browser.
- Voice works without the camera, and the camera works without voice.

## Customize

- Hand sensitivity: thresholds in `detect()` in `script.js`
- Head and face sensitivity: the `FACE` object above `detectFace()` (`nod`, `tilt` degrees, `mouth`, `hold` milliseconds)
- Cooldowns: the millisecond values in `ready('lights', 1200)` and similar
- Voice words: the patterns in `voiceCmd()`
- AI voice: the model (`GEMINI_MODEL` environment variable) and the instructions in `SYSTEM` in `server.js`; add a new action by extending `TOOL`, `clean()` and `runPlan()`
- TV channels: the `CH` array at the top of `script.js`
- Real smart plug: add a `fetch('YOUR_WEBHOOK_URL')` call inside `slam()` (Home Assistant, IFTTT, Shelly, etc.)

## Project structure

```
index.html   page markup
style.css    styling
script.js    hand, voice and head/face detection, plus controls
room3d.js    3D haunted room (Three.js)
server.js    optional Node server: serves the site and powers AI voice
package.json `npm start` runs server.js (no dependencies)
.env.example copy to .env and add your API key (.env is git-ignored)
```

## License

MIT
