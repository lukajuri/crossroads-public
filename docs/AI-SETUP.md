# Final AI assessment

At the end of each mission, the player must write a contribution. The opening and final form explain that submitting sends the contribution and recorded choices to OpenAI. Clicking Submit to your AI mentor immediately requests the assessment, with no second opt-in dialog. The mentor considers choices and writing together, explains possible impacts and trade-offs, and connects professional analytical work to EMUNI’s MA in Mediterranean Geopolitics and Geoeconomics. It gives constructive coaching without an aptitude score or an admissions assessment.

## cPanel installation

1. Upload the contents of `public/` into the game's public web folder. Keep this game in a separate folder from the classroom game.
2. Create `/home/margar38/crossroads-public-private` outside `public_html`. Upload `server/mentor.php` there as `mentor.php`, and `data/missions.json` there as `missions.json`.
3. Upload `server/config.example.php` there and rename it `config.php`. The example reads only the API key and model from your existing `/home/margar38/crossroads-private/config.php`. It does not change that file or share the classroom cache or request limits.
4. Ensure PHP 8.1 or later and the cURL extension are enabled for this domain. PHP must be able to read the private files and create its `cache` subfolder. A private directory owned by the cPanel account with permissions `700` is usually appropriate when PHP runs as that account; do not use `777`.
5. Open your game's `api/mentor.php?status=1`. `"configured":true` confirms the readable private mission data, key, model and cURL extension. It does not test API credentials, model access or billing.
6. Complete a mission, write a short contribution and submit it. Check that the assessment starts automatically and covers the choices, written judgement, possible impact, professional work and the MA connection. Empty or whitespace-only writing must not submit.

`CROSSROADS_PUBLIC_PRIVATE_DIR` can override the private directory. `OPENAI_API_KEY` and `CROSSROADS_PUBLIC_MODEL` can override key and model on the server. Keep credentials out of HTML, JavaScript and GitHub. This game uses your configured model; it does not silently substitute a different model. The model must support the Responses API and strict JSON-schema output.

If TLS terminates at a host proxy and same-origin requests are rejected, set `'public_origin' => 'https://lukajuri.eu'` in the private config (use your actual origin, including a non-default port if applicable). Forwarding headers from requests are not trusted automatically.

## Updating an existing installation

Replace the public files and the PRIVATE mentor.php together. Retain your existing private config.php, API key and model. The updated ZIP has the private implementation under crossroads-public-private/mentor.php. Merely replacing app.js leaves the old five-field mentor incompatible with the new assessment. Older completed saves return to the final writing form with their choices and draft preserved, and send nothing until the player submits. Choice orders remain stable on reload; new source and career order groups are filled in for older saves.

## Behaviour and limits

- Only submitting the final briefing or explicitly retrying a submitted assessment sends data to OpenAI: the canonical mission context, initial source judgement, both attached sources, recommendation, response to the new evidence, required written contribution, career examples and relevant programme courses. No name or email is requested. Writing is limited to 1,200 characters and cannot be blank. Do not enter personal or confidential information. Viewing the opening, writing a draft and browsing career tabs do not send an assessment request.
- The endpoint uses `store: false`, asks for structured output, validates all submitted choices against private mission data and treats learner writing as untrusted data. There are no model tools or browser-provided prompts.
- Defaults: 8 fresh requests per IP per UTC hour and 100 fresh requests per UTC day across the game. Retrieving an identical cached response does not consume another request. API failures consume a slot because they can still incur upstream usage.
- The response has eight validated text sections: headline, choices, written judgement, possible impact, practical next step, professional work, MA study connection and a question to explore. Existing cached assessments are invalidated by the new mentor version. Feedback is cached for up to 24 hours. Request hashes and IP rate-limit identifiers use an HMAC; raw recommendation text and raw IP addresses are not saved in this game's cache. Feedback may refer to the player's reasoning. Hosting or provider logs and retention are governed separately by their own settings.
- API secrets and raw upstream errors are never included in public error responses. Submission automatically starts the first request. No automatic paid retries occur. A completed assessment is restored on reload without sending it again. An interrupted submission can be explicitly retried from its saved briefing; changing career tabs never triggers another assessment. If mentoring is unavailable, the authored mission debrief remains available.
- GitHub Pages and ordinary static hosting cannot run PHP. They can serve the authored missions and reflections, but the final AI assessment requires the cPanel PHP endpoint or another server implementing the same contract. Do not expose a key to make static hosting call OpenAI directly.

## Local verification

With PHP CLI installed, run:

```sh
php tests/mentor-test.php
php -l server/mentor.php
php -l public/api/mentor.php
```

Tests use a private injected mock transport and never contact OpenAI. They cover required and whitespace-only writing, canonical choice lookup, complete assessment context and schema, unknown or duplicate evidence, Unicode limits, origin checks, response refusals, malformed output, caching and hourly/daily request caps. The injection is a private function argument; the public endpoint does not accept a transport from configuration or requests.

API contract checked against the official [Responses API reference](https://platform.openai.com/docs/api-reference/responses/create): `POST /v1/responses`, `text.format` with `type: "json_schema"`, strict schema and `store: false`.
