# Micro-Neuron Sandbox – One-liner Manual

A fun, lite repo for neuron activation, simulations, etc.

_(EN only, 120 s to read)_

---

### 1. Display = 1 neuron-badge

- Soma: 80 px SVG circle, radial gradient blue(-70 mV) → white(0 mV) → red(+30 mV)
- Outer glow: same tint, 8 px blur, 40 % opacity
- 12 gate-sticks on rim: 6×2 px lines, white=Na⁺, orange=K⁺; length 1-1.6× = open probability
- 90 ° bottom-arc breath: 3 px, cobalt-blue(6 °C) → lemon-yellow(40 °C), period 2 s→0.5 s  
  (hue shift avoids red-to-gray thermal scale, reserving red for depolarization flash)

---

### 2. One-line electro-plank

```js
V += 0.02 * (I - (V + 55) + 30 * Na - 25 * K); // mV, 1 ms step
```

- Na = (1-NaBlock)\*sigmoid(V+20,6);
- K = sigmoid(V-10,4);
- I = (Pulse?100:0) + Noise\*(1-Ca/5);

---

### 3. Three sliders only—ignore the rest

| Slider           | Feel                     |
| ---------------- | ------------------------ |
| Temp 6–40 °C     | hotter = fires faster    |
| Ca 0.5–4 mM      | higher = harder to spike |
| Na-block 0–100 % | slide right = silenced   |



Go play.
