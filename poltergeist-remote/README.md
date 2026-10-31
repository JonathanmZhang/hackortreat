# Poltergeist Remote

A Halloween hackathon project: a ghost can't touch a light switch, so everything is controlled without touching anything: hand gestures, your voice, or head and face movements. Built with plain HTML, CSS, JavaScript, [MediaPipe](https://developers.google.com/mediapipe) (Hands and Face Mesh) and the browser's Web Speech API. No build step, no backend.

## Controls

| Action | Hand | Voice (say) | Head & face |
| --- | --- | --- | --- |
| Flick the lights | Pinch (thumb + index) | "Lights" (or "Flick") | Nod |
| Change the TV channel | Swipe hand sideways | "Channel" (or "Next"; "Previous" / "Back" goes backwards) | Tilt head right = next, left = previous |
| Slam the door (and trigger the smart plug) | Fist | "Slam" (or "Door") | Open mouth wide for a moment |

Keyboard fallbacks: `L` lights, `←` `→` channel, `D` door.

All inputs share one cooldown per action, so a nod plus a spoken "Lights" at the same moment only flicks the lights once.

## Accessibility angle

Hands-free, contact-free control of lights, TV and appliances for people with limited mobility or fine motor control. Someone who can't use their hands can use voice or head movement; someone who can't speak can use hands or head. The head and face tracking can be switched off with the checkbox.

## Run it

Browsers only allow camera and microphone access on `localhost` or HTTPS, so use a local server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000, click **Start camera** for hand and head tracking, and **Start voice** for voice commands. An internet connection is needed to load MediaPipe from a CDN.

Notes:

- Voice recognition needs Chrome or Edge. In Chrome, speech recognition sends audio to a cloud service. Hand and face tracking run locally in the browser.
- Voice works without the camera, and the camera works without voice.

## Customize

- Hand sensitivity: thresholds in `detect()` in `script.js`
- Head and face sensitivity: the `FACE` object above `detectFace()` (`nod`, `tilt` degrees, `mouth`, `hold` milliseconds)
- Cooldowns: the millisecond values in `ready('lights', 1200)` and similar
- Voice words: the patterns in `voiceCmd()`
- TV channels: the `CH` array at the top of `script.js`
- Real smart plug: add a `fetch('YOUR_WEBHOOK_URL')` call inside `slam()` (Home Assistant, IFTTT, Shelly, etc.)

## Project structure

```
index.html   page markup
style.css    styling
script.js    hand, voice and head/face detection, plus room logic
```

## License

MIT
