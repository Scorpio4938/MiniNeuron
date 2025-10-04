class NeuronSimulator {
    constructor() {
        this.V = -70;  // Membrane potential (mV)
        this.I = 0;    // Input current
        this.Na = 0;   // Sodium channel activation
        this.K = 0;    // Potassium channel activation
        this.Noise = 0; // Noise component
        this.Pulse = false; // Pulse input
        this.Ca = 2.0; // Calcium concentration (mM)
        this.NaBlock = 0; // Sodium block percentage
        this.temperature = 23; // Temperature (°C)

        this.isRunning = false;
        this.animationId = null;

        this.initializeElements();
        this.setupEventListeners();
        this.startSimulation();
    }

    initializeElements() {
        this.voltageDisplay = document.getElementById('voltage-value');
        this.tempSlider = document.getElementById('temperature');
        this.caSlider = document.getElementById('calcium');
        this.naBlockSlider = document.getElementById('na-block');
        this.tempValue = document.getElementById('temp-value');
        this.caValue = document.getElementById('ca-value');
        this.naBlockValue = document.getElementById('na-block-value');
        this.pulseBtn = document.getElementById('pulse-btn');
        this.soma = document.querySelector('.soma');
        this.naGates = document.querySelectorAll('.na-gate');
        this.kGates = document.querySelectorAll('.k-gate');
        this.thermalArc = document.querySelector('.thermal-arc');
    }

    setupEventListeners() {
        this.tempSlider.addEventListener('input', (e) => {
            this.temperature = parseFloat(e.target.value);
            this.tempValue.textContent = this.temperature.toFixed(1);
            this.updateThermalArc();
        });

        this.caSlider.addEventListener('input', (e) => {
            this.Ca = parseFloat(e.target.value);
            this.caValue.textContent = this.Ca.toFixed(1);
        });

        this.naBlockSlider.addEventListener('input', (e) => {
            this.NaBlock = parseFloat(e.target.value) / 100;
            this.naBlockValue.textContent = e.target.value;
        });

        this.pulseBtn.addEventListener('click', () => {
            this.triggerPulse();
        });
    }

    sigmoid(x, slope) {
        return 1 / (1 + Math.exp(-x / slope));
    }

    updateChannels() {
        // Sigmoid functions for channel activation
        this.Na = (1 - this.NaBlock) * this.sigmoid(this.V + 20, 6);
        this.K = this.sigmoid(this.V - 10, 4);
        this.Noise = (Math.random() - 0.5) * 2; // Random noise between -1 and 1
        this.I = (this.Pulse ? 100 : 0) + this.Noise * (1 - this.Ca / 5);
    }

    updateMembranePotential() {
        // Electro-plank equation from spec
        // V += 0.02 * (I - (V + 55) + 30 * Na - 25 * K); // mV, 1 ms step
        const dt = 0.1; // Time step (ms)
        const dV = 0.02 * (this.I - (this.V + 55) + 30 * this.Na - 25 * this.K);
        this.V += dV * dt;

        // Clamp voltage to reasonable range
        this.V = Math.max(-90, Math.min(50, this.V));
    }

    updateVisualization() {
        // Update voltage display
        this.voltageDisplay.textContent = this.V.toFixed(1);

        // Update soma color based on membrane potential
        const normalizedV = (this.V + 90) / 140; // Normalize from -90 to 50 mV
        const gradient = this.soma.style;

        // Update gradient stops based on voltage
        const stops = this.soma.parentElement.querySelectorAll('stop');
        if (stops.length >= 3) {
            stops[0].style.stopColor = this.getVoltageColor(this.V);
            stops[1].style.stopColor = '#ffffff';
            stops[2].style.stopColor = this.getVoltageColor(this.V);
        }

        // Update gate stick lengths based on channel activation
        this.naGates.forEach((gate, index) => {
            const length = 1 + (this.Na * 0.6);
            const currentLength = parseFloat(gate.getAttribute('y1')) - parseFloat(gate.getAttribute('y2'));
            const newLength = 8 * length;

            if (index === 0) { // Top gate
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) - newLength);
            } else if (index === 1) { // Top-right gate
                const dx = newLength * Math.cos(Math.PI/4);
                const dy = newLength * Math.sin(Math.PI/4);
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) + dx);
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) - dy);
            } else if (index === 2) { // Right gate
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) + newLength);
            } else if (index === 3) { // Bottom-right gate
                const dx = newLength * Math.cos(Math.PI/4);
                const dy = newLength * Math.sin(Math.PI/4);
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) + dx);
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) + dy);
            } else if (index === 4) { // Bottom gate
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) + newLength);
            } else if (index === 5) { // Bottom-left gate
                const dx = newLength * Math.cos(Math.PI/4);
                const dy = newLength * Math.sin(Math.PI/4);
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) - dx);
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) + dy);
            }
        });

        this.kGates.forEach((gate, index) => {
            const length = 1 + (this.K * 0.6);
            const newLength = 8 * length;

            if (index === 0) { // Left gate
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) - newLength);
            } else if (index === 1) { // Top-left gate
                const dx = newLength * Math.cos(Math.PI/4);
                const dy = newLength * Math.sin(Math.PI/4);
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) - dx);
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) - dy);
            } else if (index === 2) { // Top gate
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) - newLength);
            } else if (index === 3) { // Top-right gate
                const dx = newLength * Math.cos(Math.PI/4);
                const dy = newLength * Math.sin(Math.PI/4);
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) + dx);
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) - dy);
            } else if (index === 4) { // Right gate
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) + newLength);
            } else if (index === 5) { // Bottom-right gate
                const dx = newLength * Math.cos(Math.PI/4);
                const dy = newLength * Math.sin(Math.PI/4);
                gate.setAttribute('x2', parseFloat(gate.getAttribute('x1')) + dx);
                gate.setAttribute('y2', parseFloat(gate.getAttribute('y1')) + dy);
            }
        });
    }

    getVoltageColor(voltage) {
        if (voltage < -70) return '#0000ff'; // Blue for hyperpolarized
        if (voltage < -55) return '#4444ff'; // Light blue
        if (voltage < -40) return '#8888ff'; // Very light blue
        if (voltage < -20) return '#ccccff'; // Almost white
        if (voltage < 0) return '#ffffff';   // White
        if (voltage < 20) return '#ffcccc'; // Light red
        return '#ff0000'; // Red for depolarized
    }

    updateThermalArc() {
        // Update thermal arc animation speed based on temperature
        const speed = this.mapTemperatureToSpeed(this.temperature);
        this.thermalArc.style.animationDuration = `${speed}s`;
    }

    mapTemperatureToSpeed(temp) {
        // Map temperature (6-40°C) to animation speed (2s to 0.5s)
        return 2 - ((temp - 6) / 34) * 1.5;
    }

    triggerPulse() {
        this.Pulse = true;
        this.pulseBtn.classList.add('pulsing');

        setTimeout(() => {
            this.Pulse = false;
            this.pulseBtn.classList.remove('pulsing');
        }, 50);
    }

    step() {
        this.updateChannels();
        this.updateMembranePotential();
        this.updateVisualization();
    }

    startSimulation() {
        this.isRunning = true;
        const simulationLoop = () => {
            if (this.isRunning) {
                this.step();
                this.animationId = requestAnimationFrame(simulationLoop);
            }
        };
        simulationLoop();
    }

    stopSimulation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NeuronSimulator();
});