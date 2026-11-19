# Checking the Khareef Rally build on your Windows PC

The cloud container renders with software WebGL at under two frames per second, so nothing measured there says how the game
runs on a real GPU. This is the check that counts. It takes about five minutes and touches nothing in production.

## 1. Get the file
Either the file attached in the chat (`Slot-9-Khareef-Rally.html`), or from the branch:
`feat/rally-performance` → `rally3d/index.html` (same content). Save it anywhere, for example the Desktop.

## 2. Open it
Double-click it, or drag it into **Chrome** or **Edge**. Opening it as a plain file is safe: without a Studio session in the
address there is no login, the game uses its built-in question pack, and nothing is sent to the class server. Textures are
fetched from the public texture worker, so the PC needs internet.

If the page shows "Khareef Rally needs 3D graphics (WebGL)", hardware acceleration is off in the browser: Settings → System →
"Use graphics acceleration when available" → on, then relaunch the browser. Tell me if that was the case.

## 3. Read the numbers
1. Click **Drive**, wait for "Building the Dhofar road…" to finish, then **Start driving**.
2. Press **F**. A small black box appears bottom left with: tier, fps, ms per frame, draw calls, triangles, pixel ratio, shadow
   size, scenery distance, cars.
3. Drive for one minute with W/↑ along the coast road and through Taqah (the first town). Note the fps while driving and whether
   the tier changes by itself (Auto steps down when frames stay slow; the HUD toast says why).
4. Press **G** to cycle tiers: Minimal → Low → Medium → High → Ultra. Note the fps at each one after ~10 s of driving.
5. Press **F** again to hide the box.

Please send me, for each tier: fps, ms, draw calls (from the box), plus your screen resolution and Windows display scaling
(Settings → System → Display → Scale), the browser name and version, and whether the game felt smooth.

## 4. Compare with the shipped game (optional, one minute)
Add `#gfx=ultra&merge=0` to the end of the file address in the address bar and press Enter, then reload: that is the shipped
page's rendering (no merge, pixel ratio up to 2, 2048² shadows, all scenery). Press F and read the same numbers.

## 5. Things to look at while driving
Buildings in Taqah, palms, dhows on the coast, the checkpoint hut and barrier, road signs, the fort, the guardrails and the
other cars' wheels turning. If anything is missing, floating, black or flickering, say where (the HUD shows "To Mirbat … km"
and the town names on the route bar).
