# Micro-Neuron 2.2 – Blink-Once Manual

_(90 s read, English only)_

A single SVG badge = one living neuron.  
Story loop: **charge → flash → brief darkness → recharge**.  
Everything you see is just light cycling through those four states.

| Part                 | Role in the loop | What you actually see                                                                                                                                                          | 1-line code cost                                                                         | Biology-fidelity tip                  |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------- |
| Soma                 | Charge reservoir | Deep-sea-blue (−70 mV) warms to lavender (−30 mV) while integrating input; when Vm > +30 mV the whole body snaps to hot-white, then fades back in 300 ms—one complete “blink”. | 60×80 px hippocampal pyramid path, 3-stop radial gradient, one CSS filter for after-glow | Izhikevich 2-D + nuclear shadow bulge |
| Axon spike           | The flash itself | A 120 px colour-coded heat-map does 3 saltatory jumps along myelinated beads in 0.25 s, white→red→transparent; the photograph that tells the world “I just fired”.             | 40-point path, RGB interp per node, staggered setTimeout                                 | Saltatory + colour heat-map           |
| Dendrite Ca-fireball | Trigger drop     | Click → 80 ms vesicle growth, then 200 ms orange fireball (#ff9933 → transparent) — the stone thrown into the reservoir.                                                       | single requestAnimationFrame chain                                                       | L-System 2-level fractal              |
| Ion sticks           | Charge meter     | 20 white (Na⁺) or orange (K⁺) 1.5×(6…12) px lines; each frame stochastic gate opens with P_open(Vm), sudden lengthen + noisy twitch, visual countdown to flash.                | per-frame y2 jitter + rand()                                                             | 4-state Markov gate                   |
| Temperature arc      | Metronome        | 90° bottom arc, 3 px; period 2 s → 0.5 s, colour cobalt-blue (6 °C) → lemon-yellow (40 °C); hotter = faster charge = faster blink cadence.                                     | slider drives stroke & dur                                                               | Q10 on Izhikevich a,d                 |
| Background particles | Thermal wind     | 40 gray 1 px dots, Brownian + convective drift; 4× speed at 40 °C; you feel the water getting restless.                                                                        | 10-line particle loop                                                                    | same                                  |
| Post-spike afterglow | Refractory ghost | Whole-soma brightness 1→2→1 in 300 ms (GCaMP-like) — bulb is off but glass still glows, signalling “do not disturb”.                                                           | one variable, CSS filter                                                                 | linked to Na-inactivation (d-param)   |
| Astrocyte Ca-wave    | Ambient breath   | 2-layer radial gradient 0→100 % r in 8 s→2 s, 20 % opacity; slow inhale/exhale of the bath itself.                                                                             | pure SVG <animate> tag                                                                   | plus RyR Ca-sparks × temperature      |

---

### Core equation = “Izhikevich 2-D”

```js
// 0.5 ms time-step
v += 0.04 * v * v + 5 * v + 140 - u + I;
u += a * (b * v - u);
if (v > 30) {
  // 30 mV threshold
  v = c;
  u += d; // reset
  spike(); // launch axon heat-wave
}
afterGlow = afterGlow > 0 ? afterGlow - 0.03 : 0;
```

Na-influx (I) comes from stochastic gates, K-efflux from u-variable, temperature slider multiplies a and d (Q10≈2).

---

### Three sliders — ignore the rest

| Slider | 6 → 40 °C                                       | 0.5 → 4 mM Ca                                         | 0 → 100 % NaBlock                                   |
| ------ | ----------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Feel   | Film playback speed ×4                          | Extra drain-hole in pool                              | Inlet valve cemented shut                           |
| Visual | Faster charge, faster particles, faster Ca-wave | Ca-fireball shrinks 30 %, background K-lines brighter | Na-sticks gray & half-length, axon flash disappears |

Done.
