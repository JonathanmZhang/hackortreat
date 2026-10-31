# Poltergeist Remote

A Halloween hackathon project: a ghost can't touch a light switch, so everything is controlled with hand gestures through a webcam. Built with plain HTML, CSS, JavaScript and [MediaPipe Hands](https://developers.google.com/mediapipe). No build step, no backend.

## Gestures

| Gesture | Action |
| --- | --- |
| Pinch (thumb + index) | Flick the lights |
| Swipe hand sideways | Change the TV channel |
| Fist | Slam the door (and trigger the smart plug) |

Keyboard fallbacks: `L` lights, `←` `→` channel, `D` door.

## Accessibility angle

Hands-free, contact-free control of lights, TV and appliances for people with limited mobility or fine motor control.

## Run it

Browsers only allow camera access on `localhost` or HTTPS, so use a local server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 and click **Start camera**. An internet connection is needed to load MediaPipe from a CDN.

## Customize

- Gesture sensitivity: thresholds in `detect()` in `script.js`
- Cooldowns: the millisecond values in `ready('pinch', 1200)` and similar
- TV channels: the `CH` array at the top of `script.js`
- Real smart plug: add a `fetch('YOUR_WEBHOOK_URL')` call inside `slam()` (Home Assistant, IFTTT, Shelly, etc.)

## Project structure

```
index.html   page markup
style.css    styling
script.js    gesture detection and room logic
```

## License

MIT
