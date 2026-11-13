# Hero portraits

The home hero shows an editorial portrait that switches from an illustrated
version to the real photograph (hover on desktop, tap on touch, Enter/Space
with the keyboard). Until both files exist, it shows a deliberate placeholder.

Add the two images here — no code changes needed:

| File | What it is |
| --- | --- |
| `portrait-illustrated.webp` | The illustrated / pixel-style portrait (shown by default) |
| `portrait-real.webp` | The photograph (revealed on hover / tap) |

- Any of `.avif`, `.webp`, `.jpg`, `.jpeg`, `.png` works; the build picks the
  first it finds in that order.
- Use the **same crop and size** for both (4:5 portrait, at least
  1200 × 1500 px) so the faces line up exactly during the transition.
- Optional `focus.json` next to them sets the crop focus in percent, e.g.
  `{ "x": 50, "y": 30 }`.
- With only one of the two files, that image is shown on its own, without
  the switch.
- Strip EXIF location data before committing.

Then commit, push and merge; the next production build picks them up.
The About page uses `portrait-real.*` too (or the older `public/portrait/sree.*`).
