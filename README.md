Version: v18 certificate watermark uses user-supplied bed+tower image

Version: v17 certificate watermark = bed and tower

Version: v16 certificate watermark blended / text box artifact removed

Version: v15 certificate watermark changed to oncothermia machine

Version: v14 QR opens real verification page

Version: v13 certificate cleanup (no score, QR code active, lower area rebalanced)

Version: v12 certificate font size fixed

Version: v11 certificate uses supplied luxury source template

Version: v10 balanced luxury certificate layout

Version: v9 luxurious certificate + custom signature

Version: v8 Certificate redesign

Version: v7 Fixed interactive build — Sign-in, progress, exam, certificate, light theme.

Version: v6 Light Hormone-style theme

# Oncothermia WMC e-Learning — GitHub Pages

Static e-Learning site generated from the completed WMC Oncothermia presentation.

## Included
- 5 lessons / 90 learning screens
- Progress saved in the learner browser (`localStorage`)
- Full-screen slide viewer and keyboard navigation
- Final Exam: 15 questions, pass mark 80%
- Certificate after 100% completion + exam ≥80%
- Slides 19–20 autoplay their original PowerPoint animation
- Replay / Pause controls for the two animation screens
- No server, Node, database, or build step required

## Slides 19–20 animation
The source PowerPoint stores these two demonstrations as animated GIFs. For GitHub Pages they were converted to MP4 while preserving the animation sequence/timing. This reduces the files from about 17 MB + 54 MB to about 1 MB + 4 MB and makes autoplay much faster.

- `assets/video/slide-019.mp4` — Auto-focusing / egg-white demonstration
- `assets/video/slide-020.mp4` — Liver-in-water demonstration

They autoplay, loop, and restart when the learner re-enters the screen, matching PowerPoint slideshow behavior closely. The videos are muted because the original embedded GIFs contain no audio.

## Publish on GitHub Pages
1. Create a GitHub repository.
2. Upload all contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Open the Pages URL GitHub provides.

## Note
Progress and certificates are stored in each learner's browser only. Central learner accounts, SCORM/xAPI tracking, or an admin dashboard require an LMS or backend.


## v4 display fix
- Slide 12 restored with the complete apoptosis figure (no left-edge crop).
- Slides 19–20 animation videos are encoded on a 16:9 canvas.
- Viewer uses strict `object-fit: contain` so slides/videos are never cropped.
- Asset URLs are cache-busted for GitHub Pages.
