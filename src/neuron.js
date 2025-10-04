class RealisticNeuron {
    constructor() {
        // Hodgkin-Huxley style model parameters
        this.V = -70;           // Membrane potential (mV)
        this.m = 0.05;          // Na+ activation gate
        this.h = 0.6;           // Na+ inactivation gate
        this.n = 0.3;           // K+ activation gate
        this.I_stim = 0;        // Stimulation current
        this.Ca_ext = 2.0;      // Extracellular calcium (mM)
        this.temperature = 37;  // Temperature (°C)
        this.firingRate = 0;    // Current firing rate
        this.lastSpikeTime = 0; // Last spike timestamp
        this.spikeTimes = [];   // Array of spike times for rate calculation

        // Membrane potential visualization
        this.membraneState = 'resting'; // resting, depolarizing, repolarizing, hyperpolarizing
        this.actionPotentialActive = false;
        this.apPropagationProgress = 0;
        this.synapticActivity = [];
        this.calciumTransients = [];

        // Ion channel states
        this.naChannelStates = [];
        this.kChannelStates = [];
        this.caChannelStates = [];

        // Animation control
        this.isRunning = false;
        this.animationId = null;
        this.timeStep = 0.05; // 0.05 ms timestep
        this.time = 0;

        this.initializeElements();
        this.setupEventListeners();
        this.initializeIonChannels();
        this.startSimulation();
    }

    initializeElements() {
        this.voltageDisplay = document.getElementById('voltage-value');
        this.firingRateDisplay = document.getElementById('firing-rate');
        this.tempSlider = document.getElementById('temperature');
        this.stimSlider = document.getElementById('stimulation');
        this.caSlider = document.getElementById('ca-concentration');
        this.tempValue = document.getElementById('temp-value');
        this.stimValue = document.getElementById('stim-value');
        this.caValue = document.getElementById('ca-value');
        this.stimBtn = document.getElementById('stim-btn');

        // Neuron morphology elements
        this.soma = document.querySelector('.soma');
        this.nucleus = document.querySelector('.nucleus');
        this.axonHillock = document.querySelector('.axon-hillock');
        this.initialSegment = document.querySelector('.initial-segment');
        this.myelinSegments = document.querySelectorAll('[class^="myelin-segment-"]');
        this.nodesOfRanvier = document.querySelectorAll('[class^="node-ranvier-"]');
        this.synapticBoutons = document.querySelectorAll('[class^="synaptic-bouton-"]');
        this.dendrites = document.querySelectorAll('[class$="-dendrite"], [class$="-branch-"]');
        this.spines = document.querySelectorAll('[class^="spine-"]');

        // Membrane potential visualization elements
        this.membranePotentialGroup = document.querySelector('.membrane-potential');
        this.actionPotentialWave = document.querySelector('.action-potential-wave');
        this.dendriticPotentials = document.querySelectorAll('[class^="dendritic-potential-"]');

        // Ion channel elements
        this.naChannelsAxon = document.querySelectorAll('.na-channels-axon circle');
        this.naChannelsNodes = document.querySelectorAll('.na-channels-nodes circle');
        this.kChannels = document.querySelectorAll('.k-channels circle');
        this.caChannels = document.querySelectorAll('.ca-channels circle');

        // Synaptic and calcium elements
        this.synapticTransmission = document.querySelector('.synaptic-transmission');
        this.calciumDynamics = document.querySelector('.calcium-dynamics');
        this.neurotransmitters = document.querySelectorAll('[class^="neurotransmitter-"]');
        this.postsynapticResponses = document.querySelectorAll('[class^="postsynaptic-response-"]');
        this.calciumInflux = document.querySelectorAll('[class^="calcium-influx-"]');
        this.calciumWave = document.querySelector('.calcium-wave');
    }

    setupEventListeners() {
        this.tempSlider.addEventListener('input', (e) => {
            this.temperature = parseFloat(e.target.value);
            this.tempValue.textContent = this.temperature.toFixed(1);
            this.updateTemperatureEffects();
        });

        this.stimSlider.addEventListener('input', (e) => {
            const frequency = parseFloat(e.target.value);
            this.stimValue.textContent = frequency;
            this.updateStimulation(frequency);
        });

        this.caSlider.addEventListener('input', (e) => {
            this.Ca_ext = parseFloat(e.target.value);
            this.caValue.textContent = this.Ca_ext.toFixed(1);
            this.updateCalciumEffects();
        });

        this.stimBtn.addEventListener('click', () => {
            this.triggerSinglePulse();
        });
    }

    initializeIonChannels() {
        // Initialize Na+ channel states
        this.naChannelsAxon.forEach((channel, index) => {
            this.naChannelStates.push({
                type: 'na',
                location: 'axon-hillock',
                open: false,
                activation: 0.05,
                inactivation: 0.6,
                element: channel
            });
        });

        this.naChannelsNodes.forEach((channel, index) => {
            this.naChannelStates.push({
                type: 'na',
                location: 'node-ranvier',
                open: false,
                activation: 0.05,
                inactivation: 0.6,
                element: channel
            });
        });

        // Initialize K+ channel states
        this.kChannels.forEach((channel, index) => {
            this.kChannelStates.push({
                type: 'k',
                location: 'dendrite-soma',
                open: false,
                activation: 0.3,
                element: channel
            });
        });

        // Initialize Ca2+ channel states
        this.caChannels.forEach((channel, index) => {
            this.caChannelStates.push({
                type: 'ca',
                location: 'presynaptic',
                open: false,
                activation: 0.1,
                element: channel
            });
        });
    }

    updateTemperatureEffects() {
        // Q10 temperature coefficient effects on channel kinetics
        const q10 = Math.pow(3, (this.temperature - 37) / 10);

        // Update channel kinetics
        this.naChannelStates.forEach(channel => {
            channel.temperatureFactor = q10;
        });
        this.kChannelStates.forEach(channel => {
            channel.temperatureFactor = q10;
        });
        this.caChannelStates.forEach(channel => {
            channel.temperatureFactor = q10;
        });
    }

    updateStimulation(frequency) {
        if (frequency > 0) {
            // Convert frequency to current (rough approximation)
            this.I_stim = frequency * 0.2;
        } else {
            this.I_stim = 0;
        }
    }

    updateCalciumEffects() {
        // Calcium affects neurotransmitter release probability
        const releaseProbability = Math.min(1, this.Ca_ext / 2.0);
        this.caChannels.forEach((channel, index) => {
            channel.style.opacity = 0.3 + (releaseProbability * 0.7);
        });
    }

    triggerSinglePulse() {
        // Single synaptic stimulation
        this.I_stim = 5; // nA
        this.triggerSynapticTransmission();

        setTimeout(() => {
            this.I_stim = 0;
        }, 2); // 2 ms pulse
    }

    // Hodgkin-Huxley channel gating equations
    alpha_m(V) { return 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10)); }
    beta_m(V) { return 4 * Math.exp(-(V + 65) / 18); }
    alpha_h(V) { return 0.07 * Math.exp(-(V + 65) / 20); }
    beta_h(V) { return 1 / (1 + Math.exp(-(V + 35) / 10)); }
    alpha_n(V) { return 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10)); }
    beta_n(V) { return 0.125 * Math.exp(-(V + 65) / 80); }

    updateIonChannelGates() {
        // Update Na+ channel gates
        const m_inf = 1 / (1 + Math.exp(-(this.V + 40) / 10));
        const h_inf = 1 / (1 + Math.exp((this.V + 65) / 10));
        const tau_m = 0.05; // ms
        const tau_h = 0.5;  // ms

        this.m += (m_inf - this.m) * (this.timeStep / tau_m);
        this.h += (h_inf - this.h) * (this.timeStep / tau_h);

        // Update K+ channel gates
        const n_inf = 1 / (1 + Math.exp(-(this.V + 55) / 10));
        const tau_n = 0.5; // ms

        this.n += (n_inf - this.n) * (this.timeStep / tau_n);

        // Update channel visualizations
        this.updateChannelVisualization();
    }

    updateChannelVisualization() {
        // Update Na+ channel visualization
        this.naChannelStates.forEach((channel, index) => {
            channel.activation = this.m;
            channel.inactivation = this.h;
            const openProbability = channel.activation * channel.inactivation;

            if (openProbability > 0.5) {
                channel.element.style.opacity = '1';
                channel.element.style.fill = '#ff0000';
                channel.element.style.filter = 'url(#actionPotentialGlow)';
            } else {
                channel.element.style.opacity = '0.6';
                channel.element.style.fill = '#ffffff';
                channel.element.style.filter = 'none';
            }
        });

        // Update K+ channel visualization
        this.kChannelStates.forEach((channel, index) => {
            channel.activation = this.n;

            if (channel.activation > 0.5) {
                channel.element.style.opacity = '1';
                channel.element.style.fill = '#ffa500';
                channel.element.style.filter = 'url(#glow)';
            } else {
                channel.element.style.opacity = '0.4';
                channel.element.style.fill = '#ffa500';
                channel.element.style.filter = 'none';
            }
        });

        // Update Ca2+ channel visualization
        this.caChannelStates.forEach((channel, index) => {
            if (this.V > -20) { // Ca2+ channels open at more positive potentials
                channel.element.style.opacity = '1';
                channel.element.style.fill = '#fdcb6e';
                channel.element.style.filter = 'url(#synapticGlow)';
            } else {
                channel.element.style.opacity = '0.3';
                channel.element.style.fill = '#fdcb6e';
                channel.element.style.filter = 'none';
            }
        });
    }

    updateMembranePotential() {
        // Hodgkin-Huxley model
        const g_Na = 120; // mS/cm²
        const g_K = 36;   // mS/cm²
        const g_L = 0.3;  // mS/cm²
        const E_Na = 50;  // mV
        const E_K = -77;  // mV
        const E_L = -54.4; // mV
        const C_m = 1.0;   // μF/cm²

        const I_Na = g_Na * Math.pow(this.m, 3) * this.h * (this.V - E_Na);
        const I_K = g_K * Math.pow(this.n, 4) * (this.V - E_K);
        const I_L = g_L * (this.V - E_L);

        const dV = (-I_Na - I_K - I_L + this.I_stim) / C_m;
        this.V += dV * this.timeStep;

        // Detect action potential
        if (this.V > -20 && this.membraneState !== 'depolarizing') {
            this.triggerActionPotential();
        }

        // Update membrane state
        if (this.V > 0) {
            this.membraneState = 'depolarizing';
        } else if (this.V > -60) {
            this.membraneState = 'repolarizing';
        } else if (this.V < -75) {
            this.membraneState = 'hyperpolarizing';
        } else {
            this.membraneState = 'resting';
        }

        this.updateMembraneVisualization();
    }

    updateMembraneVisualization() {
        // Update soma color based on membrane potential
        let gradientId;
        if (this.V > -20) {
            gradientId = 'depolarizedGradient';
        } else if (this.V < -75) {
            gradientId = 'hyperpolarizedGradient';
        } else {
            gradientId = 'restingGradient';
        }

        // Update all membrane elements
        [this.soma, this.axonHillock, this.initialSegment, ...this.nodesOfRanvier, ...this.dendrites]
            .forEach(element => {
                if (element) {
                    element.setAttribute('fill', `url(#${gradientId})`);

                    if (this.membraneState === 'depolarizing') {
                        element.style.filter = 'url(#actionPotentialGlow)';
                    } else {
                        element.style.filter = 'url(#glow)';
                    }
                }
            });

        // Update voltage display
        this.voltageDisplay.textContent = this.V.toFixed(1);
    }

    triggerActionPotential() {
        // Record spike time
        const now = Date.now();
        this.spikeTimes.push(now);

        // Keep only recent spikes (last 2 seconds)
        this.spikeTimes = this.spikeTimes.filter(time => now - time < 2000);

        // Calculate firing rate
        this.firingRate = (this.spikeTimes.length / 2.0); // spikes per second
        this.firingRateDisplay.textContent = this.firingRate.toFixed(1);

        // Trigger visual effects
        this.triggerSynapticTransmission();
        this.triggerCalciumDynamics();
        this.triggerActionPotentialPropagation();
    }

    triggerSynapticTransmission() {
        // Show neurotransmitter release
        this.synapticTransmission.style.opacity = '1';
        this.synapticBoutons.forEach(bouton => {
            bouton.style.fill = 'url(#depolarizedGradient)';
        });

        // Animate neurotransmitter release
        this.neurotransmitters.forEach((vesicle, index) => {
            setTimeout(() => {
                vesicle.style.opacity = '1';
                vesicle.style.transform = 'scale(1.5)';

                setTimeout(() => {
                    vesicle.style.opacity = '0';
                    vesicle.style.transform = 'scale(1)';
                }, 100);
            }, index * 50);
        });

        // Show postsynaptic responses
        this.postsynapticResponses.forEach((response, index) => {
            setTimeout(() => {
                response.style.opacity = '1';
                response.style.transform = 'scale(1.2)';

                setTimeout(() => {
                    response.style.opacity = '0';
                    response.style.transform = 'scale(1)';
                }, 200);
            }, 150 + index * 100);
        });

        // Hide after animation
        setTimeout(() => {
            this.synapticTransmission.style.opacity = '0';
            this.synapticBoutons.forEach(bouton => {
                bouton.style.fill = 'url(#restingGradient)';
            });
        }, 500);
    }

    triggerCalciumDynamics() {
        // Show calcium influx
        this.calciumDynamics.style.opacity = '1';

        // Animate calcium influx at terminals
        this.calciumInflux.forEach((influx, index) => {
            setTimeout(() => {
                influx.style.opacity = '1';
                influx.style.transform = 'scale(1.5)';

                setTimeout(() => {
                    influx.style.opacity = '0';
                    influx.style.transform = 'scale(1)';
                }, 150);
            }, index * 30);
        });

        // Show calcium wave in soma
        setTimeout(() => {
            this.calciumWave.style.opacity = '1';
            this.calciumWave.style.transform = 'scale(1.2)';

            setTimeout(() => {
                this.calciumWave.style.opacity = '0';
                this.calciumWave.style.transform = 'scale(1)';
            }, 200);
        }, 100);

        // Hide after animation
        setTimeout(() => {
            this.calciumDynamics.style.opacity = '0';
        }, 600);
    }

    triggerActionPotentialPropagation() {
        // Show action potential wave
        this.membranePotentialGroup.style.opacity = '1';
        this.actionPotentialWave.style.opacity = '1';

        // Animate propagation along axon
        const wave = this.actionPotentialWave;
        const length = wave.getTotalLength();
        wave.style.strokeDasharray = length;
        wave.style.strokeDashoffset = length;

        // Animate the wave
        let progress = 0;
        const animateWave = () => {
            progress += 0.05;
            const offset = length * (1 - progress);
            wave.style.strokeDashoffset = offset;

            if (progress < 1) {
                requestAnimationFrame(animateWave);
            } else {
                // Reset and hide
                setTimeout(() => {
                    this.membranePotentialGroup.style.opacity = '0';
                    wave.style.opacity = '0';
                    wave.style.strokeDashoffset = length;
                }, 100);
            }
        };

        animateWave();
    }

    step() {
        // Update ion channel gates
        this.updateIonChannelGates();

        // Update membrane potential
        this.updateMembranePotential();

        // Update time
        this.time += this.timeStep;

        // Update displays
        this.updateDisplays();
    }

    updateDisplays() {
        this.voltageDisplay.textContent = this.V.toFixed(1);
        this.firingRateDisplay.textContent = this.firingRate.toFixed(1);
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
    new RealisticNeuron();
});