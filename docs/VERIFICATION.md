# Release verification

Checked on 30 October 2026.

- 90 Node tests passed: content contracts, save/restart integrity, randomised choices, canonical requests, and DOM play-throughs of all eight missions.
- 50 PHP mentor checks passed with a mock transport, including all eight mission contracts, origin checks, schema parsing, refusals, malformed output, caching and request limits.
- JavaScript syntax checks passed; PHP syntax checks passed for the endpoint, private implementation and example configuration.
- All eight missions were also played through in the browser from opening to career debrief, including weaker answers and skipping written recommendations.
- Browser checks covered saved-progress recovery, restart confirmation, career switching, the geographic locator and phone/tablet layouts. A 320-pixel iframe (305-pixel content width with a desktop scrollbar) had no horizontal overflow after the final layout adjustment.
- The ZIP was independently opened and CRC-checked using Python's zipfile. It includes 26 files; public and private mission data match the canonical JSON. No live config.php, cache or local QA wrapper is included.
- The soundtrack update passed browser playback, pause/resume and navigation checks. Five audio regression tests cover default-on playback at 30%, looping, saved preferences and autoplay recovery. The packaged MP3 is byte-for-byte identical to the supplied file. The EMUNI vector lettering was visually checked against the supplied reference.
- DOM tests exercise AI waiting, success, fallback, retry, timeout, cancellation, safe string rendering and saved feedback. These use mocked network responses.

A live OpenAI request has NOT been tested: the owner's private cPanel credentials are not available in this workspace. The mentor must be checked after installation. The authored game and career debrief do not depend on that integration.

The [preview](preview.jpg) shows the implemented desktop opening, not a generated UI mockup. Scene generation prompts and third-party asset provenance are in [ASSETS.md](ASSETS.md).
