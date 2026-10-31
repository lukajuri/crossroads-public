# Release verification

Checked on 31 October 2026.

- 98 Node tests passed: content contracts, save/restart integrity, randomised choices, canonical requests, all eight mission flows and the final assessment interface.
- 62 PHP mentor checks passed with a mock transport, including required writing, canonical submission context, all eight mission contracts, the expanded assessment schema, origin checks, response parsing, caching and request limits.
- JavaScript and PHP syntax checks passed for the changed files.
- All answer, source, evidence and career groups can take all six permutations. Orders remain stable during selection and reload, and selections are submitted by stable identifiers.
- The new required-writing flow was played through in the browser for the Koper mission. Whitespace-only writing leaves submission disabled. The form clearly names OpenAI before submission. Submitting automatically starts assessment; the local static preview then exercises the saved-briefing fallback because it cannot run PHP. All eight automatic submission and successful assessment paths are also covered by DOM tests with mocked responses.
- DOM tests cover waiting, safe full assessment rendering, cached reload, failure/retry, timeout, cancellation on restart, career browsing during assessment and older-save migration without automatic transmission.
- The assessment view was checked at 390, 320 and 768 pixels. A 320-pixel iframe (305-pixel content width with a desktop scrollbar) has no horizontal overflow after adjusting the retry button.
- The soundtrack remains enabled by default, loops at 30%, and preserves pause/resume and saved preferences. Existing audio regression tests passed.
- The ZIP was independently opened and CRC-checked using Python’s zipfile. It includes 26 files; public and private mission data match the canonical JSON. No live config.php, cache or local QA wrapper is included. The MP3 matches the supplied soundtrack byte-for-byte.

A live OpenAI response has not been tested: the owner’s private cPanel credentials are not available in this workspace. Replace the public files and private mentor.php together, keep the existing config.php, and verify a real assessment after installation. The old five-field private mentor is incompatible with this release’s eight-field assessment. The frontend preserves submitted writing and offers an explicit retry if AI is unavailable.

The [preview](preview.jpg) shows the implemented final contribution form with example writing entered during a browser play-through. It is not an AI-generated assessment. Scene generation prompts and asset provenance are in [ASSETS.md](ASSETS.md).
