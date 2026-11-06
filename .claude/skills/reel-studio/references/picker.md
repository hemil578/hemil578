# Picking music and sound effects in the chat

The user hears and picks everything inside the chat, never in a browser page.

1. **Clips.** `music.mjs clips <project> <id1..id5>` (music) or
   `music.mjs clips <project> <id1..id5> --kind sfx --cue <cue>` (one call per sound-effect cue). It prints the
   details and the clip paths as JSON.
2. **Play.** Send the clips with SendUserFile (`display: render`) so they play in the chat:
   - Music: the five clips `picks/music/N-<id>.mp3` in one call, in option order.
   - Sound effects: one joined file per cue, `picks/sfx/<cue>.mp3`. It plays option 1 to 5 in order, with a second
     of silence between them. Send all cues in one call.
3. **Pick.** Show one picker with `show_widget` (call `read_me` with `elicitation` first). Always **5 options**
   per list: put your pick first, marked **Recommended** and already selected (`aria-pressed="true"`). The
   user clicks an option, or keeps the recommended one, and presses Continue.
   - Music: one group of cards (title, author, BPM, length, why it fits).
   - Sound effects: one group per cue (plain pills `1 Recommended`, `2`, … `5`, with the effect names as a short
     subtitle row under the question), so every cue is chosen in one submit.
   - The answer arrives as one line, for example `Music details — Track: A7UWZ9T` or
     `Sound effect details — Hook: LBTZJA6 · Tap: WN5E9WG`. Use the `data-value` ids it returns.
4. More options on request: five new ones, same way.

The widget sandbox cannot load audio from Envato or local files, so the clips go through SendUserFile and the
widget only collects the choice.

## Widget shape

```html
<form class="elicit">
  <div class="elicit-header"><svg …the fixed File icon from read_me…></svg><span>Music details</span></div>
  <div class="elicit-body">
    <div class="elicit-group">
      <label class="elicit-question">Which track should play under the reel?</label>
      <div class="elicit-pills" data-name="track" data-multi="false">
        <button type="button" class="elicit-pill" data-value="A7UWZ9T" aria-pressed="true"
          style="border-radius:12px; padding:14px 16px; display:flex; gap:12px; align-items:flex-start; text-align:left; min-width:180px; box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <i class="ti ti-music" style="font-size:20px" aria-hidden="true"></i>
          <span><span style="font-size:13px; font-weight:500">1. Funny Quirky Humor Pizzicato · Recommended</span><br>
          <span style="font-size:11px; color:var(--text-muted)">eitan-ep · 110 BPM · 78 s · playful, fits the skit</span></span>
        </button>
        <!-- options 2–5 the same, without aria-pressed and without "Recommended" -->
      </div>
    </div>
  </div>
  <div class="elicit-footer"><button type="button" class="elicit-skip">Skip</button><button type="button" class="elicit-submit">Continue</button></div>
</form>
```

If `show_widget` is not available, ask in plain text: list the 5 options numbered with the recommended one first,
and the user replies with a number.
