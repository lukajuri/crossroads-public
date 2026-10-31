# Artwork, typography and map provenance

## Scene artwork

Eight original atmospheric scene images were created with the built-in image generation tool for this game, then resized and encoded as 1024-pixel-wide WebP assets. The artwork is scenery, never a source card or evidence of an event. HTML supplies all interface labels; images contain no intentional text.

Files: `public/assets/koper.webp`, `fimi.webp`, `water.webp`, `canal.webp`, `frontier.webp`, `signal.webp`, `grain.webp`, `punjab.webp`.

Shared generation prompt (applied to each scene below):

> Use case: illustration-story. Asset type: production background art for mobile geopolitical adventure CROSSROADS. Generate one landscape 16:9 composition. [Scene description.] Style: sophisticated cinematic editorial photoillustration, photorealistic textures with subtle painterly polish, deep #01153E navy shadows, sea-glass teal water/lights, muted warm gold, atmospheric luminous light, premium travel magazine photography. Visually enticing for university-age adults. Scene focal detail predominantly upper and middle frame, lower quarter darker calm negative space for HTML overlay. Must work cropped to portrait center. No text, no letters, no labels, no UI, no logos, no borders, no watermark, no weapons, no explosions. This is fictional scenario illustration, not evidence.

Scene descriptions:

- **koper:** A cinematic elevated view over the port of Koper on the Slovenian Adriatic at blue hour, container cranes lit warm gold, a container vessel and turquoise sea, soft coastal hills, beautiful realistic environment, subtle tension but a working peaceful port.
- **fimi:** A cinematic editorial scene in a Mediterranean newsroom at twilight: a young analyst's hands compare a printed port notice with a smartphone showing abstract unreadable shapes, through large windows coastal city lights and harbor water. Human curiosity, source investigation, no legible text, no sinister spy tropes.
- **water:** A breathtaking cinematic aerial view of the Neretva valley in the Western Balkans at golden blue hour: emerald river, a hydropower reservoir in middle distance, fields and orchards and a small town, limestone mountains, human livelihoods connected by water, geographical realism without claiming an exact real viewpoint.
- **canal:** A cinematic aerial view of a large container ship near a narrow canal through Egyptian desert, waiting vessels in wider water, warm sand, deep turquoise water and delicate golden twilight. Logistics as beautiful connected landscape, no disaster, geographically evocative Suez shipping scene.
- **frontier:** A cinematic editorial wide scene of a busy truck and railway border terminal between distant markets, mountains in the distance, dusk, shipping containers and a modest modern customs building, long queue of cargo vehicles with warm lights. Show physical connection and administrative crossing, no flags or readable signs.
- **signal:** A cinematic editorial scene of global communications infrastructure at blue hour: a peaceful coastal data landing station with a slim fiber cable conduit, city lights reflected in sea, foreground young technician looking at abstract network lights in a glass control room. Elegant realistic photoillustration, no futuristic holograms, no sabotage.
- **grain:** A cinematic editorial scene at a Mediterranean grain port: warm sun just setting behind wheat silos, cargo ship unloading bulk grain in background, foreground sacks of grain and a small civilian market stall, vivid but restrained colors, make supply chain and food livelihoods visually tangible, no famine spectacle.
- **punjab:** A beautiful cinematic editorial cityscape of Lahore Punjab Pakistan at dusk, distinctive Badshahi Mosque and Mughal skyline in distance with modern glass office foreground, on foreground desk folders and a muted desk light, no readable documents, sense of careful research and diplomacy, warm human working city, no stereotypes or armed agents.

## Typography

Self-hosted DM Sans and Newsreader are distributed with their SIL Open Font License files in `public/assets/`. They were downloaded from the Google Fonts distribution. System fonts and Georgia are fallbacks. No external font service is contacted by the game.

- [DM Sans source and licence](https://github.com/google/fonts/tree/main/ofl/dmsans)
- [Newsreader source and licence](https://github.com/google/fonts/tree/main/ofl/newsreader)

## Geographic locator

`public/assets/land-path.js` contains projected vector coastlines from [Natural Earth 1:110m land](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson). Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). This is an equirectangular locator, not an operational navigation map. It shows no political borders. Mission markers indicate geographic settings, not the positions of invented incidents or installations.

## Interface and sound

Icons, favicon and the CROSSROADS symbol are small code-native SVG graphics. The EMUNI wordmark (`public/assets/emuni-wordmark.svg`) uses vector letterforms matched to the reference supplied by the project owner.

`public/assets/ticking-clock.mp3` is the soundtrack supplied by the project owner, included unchanged. It loops at 30% volume while Sound is on. Sound is enabled for a first visit, and an explicitly saved preference is respected. The browser may defer playback until the first pointer or keyboard interaction. Turning sound off pauses the track; turning it on resumes playback without restarting it. The soundtrack continues through mission navigation and replaces the synthesized selection and completion cues.
