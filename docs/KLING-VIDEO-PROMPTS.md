# CROSSROADS — Kling video production guide

These are fictional scenarios in real places. Produce four separate, silent cinematic clips, approximately 8–10 seconds each. Each should be a single coherent shot with slow, natural motion, designed to remain legible on a phone. Use a 16:9 landscape frame, ideally 1920 × 1080, with the most important action near the centre. Export as MP4 (H.264 video, yuv420p; web-optimised / fast start). Avoid soundtracks or narration: the game supplies its own controls. Add titles and factual text in the game, not in the video.

The ending is a common atmospheric conclusion for every player. Do not depict a completed outcome, successful capture, resolution or proven attribution; those depend on the player's choices and are explained in the personalised assessment.

## 1. The Koper Warning — opening

Save as `public/assets/videos/koper-opening.mp4`.

**Prompt:**

> A realistic cinematic aerial tracking shot of a busy Adriatic container port resembling Koper, Slovenia, at blue hour just before sunrise. Container cranes, a cargo ship alongside the quay and a freight train moving slowly between the terminals; low coastal hills and calm sea in the distance. Warm operational lights cut through cool navy dawn. As the camera glides steadily towards the port, a small cordoned-off section and a few distant safety vehicles suggest that an urgent security warning has interrupted the morning routine, while activity continues elsewhere. Tense but restrained, grounded European maritime setting, natural light, high-end geopolitical thriller, believable scale and movement. Leave the centre clear enough to read the scene on a phone. No explosion, no drone attack, no weapons, no visible casualties, no identifiable real people, no flags, no logos, no signs, no readable text, no subtitles, no watermark.

## 2. The Koper Warning — closing

Save as `public/assets/videos/koper-closing.mp4`.

**Prompt:**

> A realistic cinematic closing shot at an Adriatic container port resembling Koper, Slovenia, in the soft light of early morning. Viewed from a quiet elevated position, a freight train moves slowly along a terminal track while cranes and a ship stand by the quay. In the foreground, an operations team seen only as small, indistinct silhouettes examines a port layout on a table. A distant safety cordon remains visible; the investigation is still ongoing. The camera slowly pulls back, linking people, port and sea. Thoughtful, hopeful but unresolved, restrained navy and warm gold palette, natural motion, premium geopolitical thriller. The scene must work after several different decisions: do not show a suspect being caught, an attack, a port-wide closure, or a definitive outcome. No identifiable people, flags, logos, readable writing, subtitles or watermark.

## 3. The Lahore File — opening

Save as `public/assets/videos/punjab-opening.mp4`.

**Prompt:**

> A realistic cinematic early-evening scene in Lahore, Punjab, Pakistan. A slow camera move from a contemporary government-district exterior into a professional analysis room: beyond a window, recognisable but non-specific Lahore urban architecture and warm city lights; in the foreground, two analysts' hands carefully arrange sealed folders, a generic access card and blank documents on a desk. A phone lights up silently, creating a sense of an urgent investigation. Respectful contemporary Pakistani setting, natural South Asian representation if people appear, dark navy and warm amber lighting, understated geopolitical thriller, believable human movement. Suggest that restricted documents have been transferred without showing who ordered it. No arrests, violence, weapons, stereotypes, foreign flags, identifiable real people, official seals, logos, readable text, subtitles or watermark.

## 4. The Lahore File — closing

Save as `public/assets/videos/punjab-closing.mp4`.

**Prompt:**

> A realistic cinematic closing shot in Punjab, Pakistan, at dawn. In a modern analysis room overlooking a Lahore city street, an analyst's hands place a closed case folder beside a plain, unlabelled map and a cup of tea. Through the window, ordinary traffic moves and the city begins its day. A colleague enters the edge of the frame and the camera gently pulls back, suggesting continuing investigation and careful cooperation. Quietly hopeful but unresolved; nuanced, respectful contemporary setting; navy shadows with warm dawn light; natural movement; premium geopolitical thriller. The footage must fit different player decisions. Do not imply the case is solved, that any government sponsored it, or that people outside the case were implicated. No arrests, violence, weapons, identifiable real individuals, flags, logos, readable writing, subtitles or watermark.

## Installation and behaviour

Upload the four files to the game's `assets/videos/` directory, using the names above exactly. Upload `index.html`, `app.js`, `video.js`, `styles.css` and `data/missions.json` from this update as well. Existing server-side AI configuration is unchanged.

The game attempts the opening clip immediately after a story is selected and the closing clip after the final contribution is submitted, while the AI mentor prepares its assessment. Clips begin muted where autoplay is permitted; native controls allow playback, pausing and unmuting. With reduced motion selected, press play to start. The Continue button skips the clip. If a clip is absent or cannot be played, the game continues without it. The six other missions continue as before.

When designing future clips, add their opening and closing relative paths to the corresponding mission's `videos` object in `data/missions.json`. Use lowercase letters, numbers and hyphens in MP4 filenames under `assets/videos/`.
