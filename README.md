# CROSSROADS: Your First Briefing

**Read the signals. Make the call. See what changes.**

A mobile-first geopolitical adventure from EMUNI. Eight short stories introduce the work of analysts, advisers and strategists through concrete decisions. No prior knowledge or registration is required.

## Play

Upload the contents of `public/` to a web server, or run a local static server with `public/` as its document root. The entry point is `public/index.html`. Opening the HTML directly from disk does not load the mission data.

The [cPanel download](dist/crossroads-cpanel.zip) contains public game files, a separate private AI folder, and installation instructions. See [installation](docs/INSTALL.txt) and [AI setup](docs/AI-SETUP.md).

## Eight missions

| Mission | A window into the work |
| --- | --- |
| The Koper Warning | Investigate a drone plot, protect traffic and advise public communication |
| The Borrowed Bulletin | Check manipulated information while recognising legitimate concerns |
| The Neretva Bargain | Compare water needs across drinking supplies, farming and energy |
| The Silent Canal | Follow how a maritime disruption affects connected places |
| The Paper Frontier | Discover why a built route may not yet be a usable connection |
| The Broken Frequency | Investigate an outage without jumping to conclusions about its cause |
| The Grain Shadow | Distinguish available stocks from food that can reach households |
| The Lahore File | Separate established identities and conduct from unproven sponsorship |

Each mission includes three sources, a source judgement, three response branches with costs, new evidence, a guided briefing and three professional perspectives. Written recommendations and AI mentoring are optional. Fictional scenarios use real geographic settings; the game never presents invented incidents as news. [Scenario notes](docs/SCENARIOS.md).

## Design and behaviour

- Navy #01153E cinematic openings with eight original scene illustrations, warm reading cards, restrained gold and teal feedback.
- Responsive phone, tablet and desktop layouts; tap controls, keyboard access, reduced-motion support and opt-in sound cues.
- A geographic locator based on Natural Earth coastlines, plus all eight locations to explore.
- Independent device-local progress, shuffled choices kept stable within each run, restart confirmation and briefing export.
- Every answer gives feedback and permits progress. No countdown or career aptitude score.
- Optional AI mentor connects recorded choices and writing to a selected professional perspective. Feedback uses a separate PHP endpoint and the server's configured model. All authored feedback remains available when AI is unavailable.
- Programme connections use verified course titles from [EMUNI's MA in Geopolitics and Geoeconomics](https://emuni.si/mgg/).

## Development

No runtime JavaScript dependencies, build framework or database are required. Node 20+ is used for checks, optional UI regression tests and the reproducible ZIP builder.

```sh
npm ci
npm test
npm run check
npm run build
php tests/mentor-test.php
```

`data/missions.json` is the canonical content. `npm run build` refreshes its public copy and packages the cPanel ZIP. Server deployment uses the same canonical data in the private directory. Do not edit the two deployed JSON copies independently.

`public/api/mentor.php` is the only publicly served PHP file. `server/mentor.php` and `config.php` belong in `/home/margar38/crossroads-public-private`, with `missions.json`. The example config reads only the key and model from the existing classroom private configuration. No credentials are shipped or committed. The complete authored game also works on static hosting; PHP is required for AI mentoring.

The AI mentor uses the OpenAI Responses API with strict structured output, canonical server-owned mission data, `store:false`, private caching and request limits. Tests use mock responses; a live response must be tested after installation with the owner's server configuration.

See [asset provenance and generation prompts](docs/ASSETS.md) and [verification](docs/VERIFICATION.md).
