class AnimationController {
    constructor() {
        this.animations = new Map();
        this.currentAnimationId = null;
        this.animationQueue = [];
        this.isProcessingQueue = false;
    }

    // Register an animation with proper cleanup
    registerAnimation(name, animationFn, cleanupFn = null) {
        this.animations.set(name, { animationFn, cleanupFn });
    }

    // Execute animation with error handling
    async executeAnimation(name, ...args) {
        if (!this.animations.has(name)) {
            console.warn(`Animation '${name}' not found`);
            return;
        }

        const { animationFn, cleanupFn } = this.animations.get(name);

        try {
            // Clean up previous animation if exists
            if (this.currentAnimationId && cleanupFn) {
                cleanupFn();
            }

            this.currentAnimationId = name;
            await animationFn(...args);

        } catch (error) {
            console.error(`Animation '${name}' failed:`, error);
            // Execute cleanup on error
            if (cleanupFn) cleanupFn();
        } finally {
            // Clean up current animation after completion
            if (cleanupFn) {
                cleanupFn();
            }
            this.currentAnimationId = null;
        }
    }

    // Queue animation for sequential execution
    queueAnimation(name, ...args) {
        this.animationQueue.push({ name, args });
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }

    async processQueue() {
        this.isProcessingQueue = true;

        while (this.animationQueue.length > 0) {
            const { name, args } = this.animationQueue.shift();
            await this.executeAnimation(name, ...args);
        }

        this.isProcessingQueue = false;
    }

    // Cancel all animations
    cancelAllAnimations() {
        this.animationQueue = [];
        if (this.currentAnimationId) {
            const { cleanupFn } = this.animations.get(this.currentAnimationId) || {};
            if (cleanupFn) cleanupFn();
            this.currentAnimationId = null;
        }
    }

}

class ElementManager {
    constructor() {
        this.elements = new Map();
        this.elementStates = new Map();
    }

    // Register elements with validation
    registerElement(name, selector, isCollection = false) {
        try {
            const element = isCollection
                ? document.querySelectorAll(selector)
                : document.querySelector(selector);

            if (!element || (isCollection && element.length === 0)) {
                console.warn(`Element not found: ${selector}`);
                return false;
            }

            this.elements.set(name, element);
            this.elementStates.set(name, 'ready');
            return true;
        } catch (error) {
            console.error(`Failed to register element '${name}':`, error);
            return false;
        }
    }

    // Get element with validation
    getElement(name) {
        if (!this.elements.has(name)) {
            console.warn(`Element '${name}' not registered`);
            return null;
        }
        return this.elements.get(name);
    }

    // Safe element manipulation
    setElementStyle(name, styles, isCollection = false) {
        const element = this.getElement(name);
        if (!element) return false;

        try {
            if (isCollection && element.forEach) {
                element.forEach(el => {
                    Object.entries(styles).forEach(([prop, value]) => {
                        el.style[prop] = value;
                    });
                });
            } else {
                Object.entries(styles).forEach(([prop, value]) => {
                    element.style[prop] = value;
                });
            }
            return true;
        } catch (error) {
            console.error(`Failed to set styles for '${name}':`, error);
            return false;
        }
    }

    // Set element attribute safely
    setElementAttribute(name, attribute, value, isCollection = false) {
        const element = this.getElement(name);
        if (!element) return false;

        try {
            if (isCollection && element.forEach) {
                element.forEach(el => {
                    el.setAttribute(attribute, value);
                });
            } else {
                element.setAttribute(attribute, value);
            }
            return true;
        } catch (error) {
            console.error(`Failed to set attribute for '${name}':`, error);
            return false;
        }
    }

    // Update element state
    setElementState(name, state) {
        this.elementStates.set(name, state);
    }

    // Reset all elements to default state
    resetAllElements() {
        this.elementStates.forEach((_, name) => {
            this.elementStates.set(name, 'ready');
        });
    }
}

class TimingManager {
    constructor() {
        this.timings = {
            // Animation durations in milliseconds
            dendriticActivation: 300,
            dendriticPropagation: 50,
            somaDepolarization: 100,
            axonHillockActivation: 50,
            actionPotentialWave: 1500,
            nodeActivation: 400,
            synapticTransmission: 1500,
            calciumDynamics: 2000,
            neurotransmitterRelease: 100,
            postsynapticResponse: 200,

            // Delays between animations
            somaDelay: 20,
            axonHillockDelay: 30,
            fullAPDelay: 40,
            calciumDelay: 100,
            propagationDelay: 150
        };
    }

    getTiming(name) {
        return this.timings[name] || 0;
    }

    setTiming(name, value) {
        this.timings[name] = value;
    }

    // Create delay promise
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Animate with requestAnimationFrame
    animate(duration, updateFn, easingFn = null) {
        return new Promise(resolve => {
            const startTime = Date.now();

            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const easedProgress = easingFn ? easingFn(progress) : progress;

                updateFn(easedProgress);

                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    resolve();
                }
            };

            animateFrame();
        });
    }
}

class RealisticNeuron {
    constructor() {
        // Hodgkin-Huxley style model parameters (unchanged)
        this.V = -70;
        this.m = 0.05;
        this.h = 0.6;
        this.n = 0.3;
        this.I_stim = 0;
        this.Ca_ext = 2.0;
        this.temperature = 37;
        this.firingRate = 0;
        this.lastSpikeTime = 0;
        this.spikeTimes = [];

        // Initialize managers
        this.animationController = new AnimationController();
        this.elementManager = new ElementManager();
        this.timingManager = new TimingManager();

        // Enhanced animation state management
        this.animationState = {
            membranePotential: 'resting',
            apActive: false,
            apProgress: 0,
            synapticActive: false,
            calciumActive: false,
            buttonActive: false,
            currentPhase: 'idle',
            lastAnimationTime: 0
        };

        // Ion channel states (unchanged)
        this.naChannelStates = [];
        this.kChannelStates = [];
        this.caChannelStates = [];

        // Animation control (unchanged)
        this.isRunning = false;
        this.animationId = null;
        this.timeStep = 0.05;
        this.time = 0;

        // Parameter change tracking (unchanged)
        this.lastParameterChange = 0;
        this.parameterChangeCooldown = 100;
        this.isStimulating = false;
        this.continuousStimulation = false;
        this.stimulationInterval = null;
        this.nextStimulationTime = 0;

        // Parameter effect tracking
        this.temperatureFactor = 1.0; // Temperature scaling factor
        this.stimulationFrequency = 0; // Current stimulation frequency
        this.stimulationIntensity = 0; // Current stimulation intensity
        this.stimulationPattern = null; // Current stimulation pattern
        this.calciumFactor = 1.0; // Calcium scaling factor
        this.synapticStrength = 1.0; // Synaptic transmission strength
        this.neurotransmitterReleaseProbability = 0.3; // Release probability

        this.initializeElements();
        this.setupEventListeners();
        this.initializeIonChannels();
        this.registerAnimations();
        this.startSimulation();
    }

    initializeElements() {
        // Register all elements with proper validation
        const elementConfigs = [
            // Single elements
            ['voltageDisplay', '#voltage-value'],
            ['firingRateDisplay', '#firing-rate'],
            ['tempSlider', '#temperature'],
            ['stimSlider', '#stimulation'],
            ['caSlider', '#ca-concentration'],
            ['tempValue', '#temp-value'],
            ['stimValue', '#stim-value'],
            ['caValue', '#ca-value'],
            ['stimBtn', '#stim-btn'],
            ['soma', '.soma'],
            ['nucleus', '.nucleus'],
            ['axonHillock', '.axon-hillock'],
            ['initialSegment', '.initial-segment'],
            ['membranePotentialGroup', '.membrane-potential'],
            ['actionPotentialWave', '.action-potential-wave'],
            ['synapticTransmission', '.synaptic-transmission'],
            ['calciumDynamics', '.calcium-dynamics'],
            ['calciumWave', '.calcium-wave'],

            // Collections
            ['myelinSegments', '[class^="myelin-segment-"]', true],
            ['nodesOfRanvier', '[class^="node-ranvier-"]', true],
            ['synapticBoutons', '[class^="synaptic-bouton-"]', true],
            ['dendrites', '[class$="-dendrite"], [class$="-branch-"]', true],
            ['spines', '[class^="spine-"]', true],
            ['dendriticPotentials', '[class^="dendritic-potential-"]', true],
            ['naChannelsAxon', '.na-channels-axon circle', true],
            ['naChannelsNodes', '.na-channels-nodes circle', true],
            ['kChannels', '.k-channels circle', true],
            ['caChannels', '.ca-channels circle', true],
            ['neurotransmitters', '[class^="neurotransmitter-"]', true],
            ['postsynapticResponses', '[class^="postsynaptic-response-"]', true],
            ['calciumInflux', '[class^="calcium-influx-"]', true]
        ];

        elementConfigs.forEach(([name, selector, isCollection = false]) => {
            this.elementManager.registerElement(name, selector, isCollection);
        });
    }

    setupEventListeners() {
        // Event listeners remain unchanged
        this.tempSlider = this.elementManager.getElement('tempSlider');
        this.stimSlider = this.elementManager.getElement('stimSlider');
        this.caSlider = this.elementManager.getElement('caSlider');
        this.stimBtn = this.elementManager.getElement('stimBtn');

        if (this.tempSlider) {
            this.tempSlider.addEventListener('input', (e) => {
                this.temperature = parseFloat(e.target.value);
                this.tempValue.textContent = this.temperature.toFixed(1);
                this.updateTemperatureEffects();
                this.lastParameterChange = Date.now();
            });
        }

        if (this.stimSlider) {
            this.stimSlider.addEventListener('input', (e) => {
                const frequency = parseFloat(e.target.value);
                this.stimValue.textContent = frequency;
                this.updateStimulation(frequency);
                this.lastParameterChange = Date.now();
            });
        }

        if (this.caSlider) {
            this.caSlider.addEventListener('input', (e) => {
                this.Ca_ext = parseFloat(e.target.value);
                this.caValue.textContent = this.Ca_ext.toFixed(1);
                this.updateCalciumEffects();
                this.lastParameterChange = Date.now();
            });
        }

        if (this.stimBtn) {
            this.stimBtn.addEventListener('click', () => {
                this.triggerSinglePulse();
            });
        }
    }

    registerAnimations() {
        // Register all animations with proper cleanup
        this.animationController.registerAnimation(
            'stimulationEffect',
            () => this.executeStimulationEffect(),
            () => this.cleanupStimulationEffect()
        );

        this.animationController.registerAnimation(
            'dendriticActivation',
            () => this.executeDendriticActivation(),
            () => this.cleanupDendriticActivation()
        );

        this.animationController.registerAnimation(
            'somaDepolarization',
            () => this.executeSomaDepolarization(),
            () => this.cleanupSomaDepolarization()
        );

        this.animationController.registerAnimation(
            'axonHillockSpike',
            () => this.executeAxonHillockSpike(),
            () => this.cleanupAxonHillockSpike()
        );

        this.animationController.registerAnimation(
            'actionPotentialPropagation',
            () => this.executeActionPotentialPropagation(),
            () => this.cleanupActionPotentialPropagation()
        );

        this.animationController.registerAnimation(
            'synapticTransmission',
            () => this.executeSynapticTransmission(),
            () => this.cleanupSynapticTransmission()
        );

        this.animationController.registerAnimation(
            'calciumDynamics',
            () => this.executeCalciumDynamics(),
            () => this.cleanupCalciumDynamics()
        );
    }

    // Enhanced animation methods with proper sequencing
    async executeStimulationEffect() {
        this.animationState.currentPhase = 'stimulation';

        // Pause ion channel CSS animations during stimulation
        this.pauseIonChannelCSSAnimations();

        // Soma depolarization
        this.elementManager.setElementAttribute('soma', 'fill', 'url(#depolarizedGradient)');
        this.elementManager.setElementStyle('soma', { filter: 'url(#actionPotentialGlow)' });

        // Dendritic activation with proper sequencing
        const dendrites = this.elementManager.getElement('dendrites');
        if (dendrites && dendrites.length) {
            const activationPromises = Array.from(dendrites).map((dendrite, index) => {
                return this.timingManager.delay(index * this.timingManager.getTiming('dendriticPropagation'))
                    .then(() => {
                        dendrite.style.stroke = '#ffaa00';
                        dendrite.style.strokeWidth = '6';
                        dendrite.style.filter = 'url(#glow)';

                        return this.timingManager.delay(this.timingManager.getTiming('dendriticActivation'))
                            .then(() => {
                                dendrite.style.stroke = 'url(#restingGradient)';
                                dendrite.style.strokeWidth = '';
                                dendrite.style.filter = '';
                            });
                    });
            });

            await Promise.all(activationPromises);
        }

        // Reset soma after delay
        await this.timingManager.delay(this.timingManager.getTiming('somaDepolarization'));
        this.elementManager.setElementAttribute('soma', 'fill', 'url(#restingGradient)');
        this.elementManager.setElementStyle('soma', { filter: 'url(#glow)' });

        // Resume ion channel CSS animations
        this.resumeIonChannelCSSAnimations();
    }

    cleanupStimulationEffect() {
        // Reset all elements to default state
        this.elementManager.setElementAttribute('soma', 'fill', 'url(#restingGradient)');
        this.elementManager.setElementStyle('soma', { filter: 'url(#glow)' });

        const dendrites = this.elementManager.getElement('dendrites');
        if (dendrites && dendrites.length) {
            dendrites.forEach(dendrite => {
                dendrite.style.stroke = 'url(#restingGradient)';
                dendrite.style.strokeWidth = '';
                dendrite.style.filter = '';
            });
        }
    }

    // Soma depolarization animation
    async executeSomaDepolarization() {
        this.animationState.currentPhase = 'somaDepolarization';

        // Intense soma depolarization
        this.elementManager.setElementAttribute('soma', 'fill', 'url(#depolarizedGradient)');
        this.elementManager.setElementStyle('soma', { filter: 'url(#actionPotentialGlow)' });

        // Scale effect for emphasis
        const soma = this.elementManager.getElement('soma');
        if (soma) {
            soma.style.transform = 'scale(1.1)';
            soma.style.transformOrigin = 'center';
        }

        // Wait for depolarization duration
        await this.timingManager.delay(this.timingManager.getTiming('somaDepolarization'));

        // Reset to resting state
        this.elementManager.setElementAttribute('soma', 'fill', 'url(#restingGradient)');
        this.elementManager.setElementStyle('soma', { filter: 'url(#glow)' });

        if (soma) {
            soma.style.transform = 'scale(1)';
            soma.style.transformOrigin = 'center';
        }
    }

    cleanupSomaDepolarization() {
        this.elementManager.setElementAttribute('soma', 'fill', 'url(#restingGradient)');
        this.elementManager.setElementStyle('soma', { filter: 'url(#glow)' });

        const soma = this.elementManager.getElement('soma');
        if (soma) {
            soma.style.transform = 'scale(1)';
        }
    }

    // Axon hillock spike animation
    async executeAxonHillockSpike() {
        console.log('Starting axon hillock spike animation');
        this.animationState.currentPhase = 'axonHillock';

        // Pause ion channel CSS animations during axon hillock activation
        this.pauseIonChannelCSSAnimations();

        // Activate axon hillock
        this.elementManager.setElementAttribute('axonHillock', 'fill', 'url(#depolarizedGradient)');
        this.elementManager.setElementStyle('axonHillock', { filter: 'url(#actionPotentialGlow)' });

        const axonHillock = this.elementManager.getElement('axonHillock');
        if (axonHillock) {
            axonHillock.style.transform = 'scale(1.5)';
            axonHillock.style.transformOrigin = 'center';
            console.log('Axon hillock activated');
        } else {
            console.warn('Axon hillock element not found');
        }

        // Activate initial segment
        this.elementManager.setElementStyle('initialSegment', { stroke: '#ff0000' });
        this.elementManager.setElementStyle('initialSegment', { strokeWidth: '6' });
        this.elementManager.setElementStyle('initialSegment', { filter: 'url(#actionPotentialGlow)' });

        const initialSegment = this.elementManager.getElement('initialSegment');
        if (initialSegment) {
            console.log('Initial segment activated');
        } else {
            console.warn('Initial segment element not found');
        }

        // Wait for axon hillock activation duration
        await this.timingManager.delay(this.timingManager.getTiming('axonHillockActivation'));

        // Reset axon hillock
        this.elementManager.setElementAttribute('axonHillock', 'fill', 'url(#restingGradient)');
        this.elementManager.setElementStyle('axonHillock', { filter: 'url(#glow)' });

        if (axonHillock) {
            axonHillock.style.transform = 'scale(1)';
            axonHillock.style.transformOrigin = 'center';
        }

        // Reset initial segment
        this.elementManager.setElementStyle('initialSegment', { stroke: 'url(#restingGradient)' });
        this.elementManager.setElementStyle('initialSegment', { strokeWidth: '4' });
        this.elementManager.setElementStyle('initialSegment', { filter: 'none' });

        // Resume ion channel CSS animations
        this.resumeIonChannelCSSAnimations();

        console.log('Axon hillock spike animation completed');
    }

    cleanupAxonHillockSpike() {
        this.elementManager.setElementAttribute('axonHillock', 'fill', 'url(#restingGradient)');
        this.elementManager.setElementStyle('axonHillock', { filter: 'url(#glow)' });

        const axonHillock = this.elementManager.getElement('axonHillock');
        if (axonHillock) {
            axonHillock.style.transform = 'scale(1)';
        }

        this.elementManager.setElementStyle('initialSegment', { stroke: 'url(#restingGradient)' });
        this.elementManager.setElementStyle('initialSegment', { strokeWidth: '4' });
        this.elementManager.setElementStyle('initialSegment', { filter: 'none' });
    }

    async executeActionPotentialPropagation() {
        console.log('Starting action potential propagation animation');
        this.animationState.apActive = true;
        this.animationState.currentPhase = 'actionPotential';

        // Apply parameter effects at animation start
        const tempFactor = this.temperatureFactor || 1;
        const stimIntensity = this.stimulationIntensity || 1;

        // Pause ion channel CSS animations during action potential
        this.pauseIonChannelCSSAnimations();

        // Show membrane potential group
        this.elementManager.setElementStyle('membranePotentialGroup', { opacity: '1' });

        const wave = this.elementManager.getElement('actionPotentialWave');
        if (!wave) {
            console.warn('Action potential wave element not found');
            return;
        } else {
            console.log('Action potential wave element found');
        }

        // Reset wave properties with stimulation intensity effects
        wave.style.opacity = '1';
        wave.style.stroke = '#ff0000';
        const baseStrokeWidth = 8;
        const intensityStrokeWidth = baseStrokeWidth + (stimIntensity - 1) * 4; // 4px max additional width
        wave.style.strokeWidth = intensityStrokeWidth.toString();
        wave.style.filter = 'url(#actionPotentialGlow)';

        const length = wave.getTotalLength();
        console.log('Action potential wave length:', length);

        wave.style.strokeDasharray = length;
        wave.style.strokeDashoffset = length;

        // Calculate node activation times based on their positions along the axon
        // Path: M 400 300 L 440 300 L 500 300 L 580 300 L 660 300 L 740 300
        // Total length: 340px
        // Node positions from start: Node1=100px (29.4%), Node2=180px (52.9%), Node3=260px (76.5%)
        // Apply temperature factor to timing (higher temp = faster propagation)
        const baseDuration = 1500; // Base duration in ms
        const tempAdjustedDuration = baseDuration / tempFactor;
        const nodeActivationTimes = [
            Math.round(441 / tempFactor),  // Node 1 at 29.4% of temp-adjusted duration
            Math.round(794 / tempFactor),  // Node 2 at 52.9% of temp-adjusted duration
            Math.round(1148 / tempFactor)  // Node 3 at 76.5% of temp-adjusted duration
        ];

        // Schedule node activations at precise times
        const nodes = this.elementManager.getElement('nodesOfRanvier');
        if (nodes && nodes.length) {
            for (let i = 0; i < nodes.length; i++) {
                setTimeout(() => {
                    this.activateNodeOfRanvier(nodes[i], i);
                }, nodeActivationTimes[i]);
            }
        }

        // Animate wave propagation with temperature-adjusted duration
        await this.timingManager.animate(
            tempAdjustedDuration,
            (progress) => {
                const offset = length * (1 - progress);
                wave.style.strokeDashoffset = offset;
                console.log('Action potential progress:', progress, 'offset:', offset);

                // Color gradient
                const hue = 0 - (progress * 30);
                const saturation = 100 - (progress * 20);
                const lightness = 50 + (progress * 20);
                wave.style.stroke = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                // Fade out
                wave.style.opacity = (1 - progress * 0.3).toString();
            }
        );

        // Animate potassium channels during repolarization phase
        await this.animatePotassiumChannels();

        // Activate synaptic terminals
        await this.activateSynapticTerminals();

        // Resume ion channel CSS animations after action potential completes
        this.resumeIonChannelCSSAnimations();
    }

    cleanupActionPotentialPropagation() {
        this.animationState.apActive = false;
        this.animationState.currentPhase = 'idle';

        const wave = this.elementManager.getElement('actionPotentialWave');
        if (wave) {
            wave.style.opacity = '0';
            wave.style.strokeDashoffset = wave.getTotalLength();
            wave.style.filter = 'none';
            wave.style.strokeWidth = '6';
        }

        this.elementManager.setElementStyle('membranePotentialGroup', { opacity: '0' });

        // Clean up all ion channels
        this.cleanupAllIonChannels();
    }

    async activateNodeOfRanvier(node, index) {
        // Apply stimulation intensity effects
        const stimIntensity = this.stimulationIntensity || 1;
        const baseNodeScale = 1.8;
        const baseChannelScale = 2.5;
        const baseDuration = 400;

        // Higher stimulation intensity = more intense node activation
        const intensityNodeScale = baseNodeScale + (stimIntensity - 1) * 0.4; // 40% max additional scaling
        const intensityChannelScale = baseChannelScale + (stimIntensity - 1) * 0.6; // 60% max additional scaling
        const intensityDuration = baseDuration * (1 + (stimIntensity - 1) * 0.2); // 20% max additional duration

        node.setAttribute('fill', 'url(#depolarizedGradient)');
        node.style.filter = 'url(#actionPotentialGlow)';
        node.style.transform = `scale(${intensityNodeScale})`;
        node.style.transformOrigin = 'center';

        // Activate Na+ channels - there are 2 channels per node
        const nodeChannels = this.elementManager.getElement('naChannelsNodes');
        if (nodeChannels && nodeChannels.length >= (index * 2 + 1)) {
            // Activate both channels for this node
            const channelIndex1 = index * 2;
            const channelIndex2 = index * 2 + 1;

            if (nodeChannels[channelIndex1]) {
                nodeChannels[channelIndex1].classList.add('ion-channels-animating');
                nodeChannels[channelIndex1].style.fill = '#ff0000';
                nodeChannels[channelIndex1].style.opacity = '1';
                nodeChannels[channelIndex1].style.transform = `scale(${intensityChannelScale})`;
                nodeChannels[channelIndex1].style.transformOrigin = 'center';
                nodeChannels[channelIndex1].style.filter = 'url(#actionPotentialGlow)';
            }

            if (nodeChannels[channelIndex2]) {
                nodeChannels[channelIndex2].classList.add('ion-channels-animating');
                nodeChannels[channelIndex2].style.fill = '#ff0000';
                nodeChannels[channelIndex2].style.opacity = '1';
                nodeChannels[channelIndex2].style.transform = `scale(${intensityChannelScale})`;
                nodeChannels[channelIndex2].style.transformOrigin = 'center';
                nodeChannels[channelIndex2].style.filter = 'url(#actionPotentialGlow)';
            }
        }

        await this.timingManager.delay(intensityDuration);

        // Reset
        node.setAttribute('fill', 'url(#restingGradient)');
        node.style.filter = 'url(#glow)';
        node.style.transform = 'scale(1)';
        node.style.transformOrigin = 'center';

        if (nodeChannels && nodeChannels.length >= (index * 2 + 1)) {
            const channelIndex1 = index * 2;
            const channelIndex2 = index * 2 + 1;

            if (nodeChannels[channelIndex1]) {
                nodeChannels[channelIndex1].style.fill = '#ffffff';
                nodeChannels[channelIndex1].style.transform = 'scale(1)';
                nodeChannels[channelIndex1].style.transformOrigin = 'center';
                nodeChannels[channelIndex1].style.filter = 'none';
                nodeChannels[channelIndex1].classList.remove('ion-channels-animating');
            }

            if (nodeChannels[channelIndex2]) {
                nodeChannels[channelIndex2].style.fill = '#ffffff';
                nodeChannels[channelIndex2].style.transform = 'scale(1)';
                nodeChannels[channelIndex2].style.transformOrigin = 'center';
                nodeChannels[channelIndex2].style.filter = 'none';
                nodeChannels[channelIndex2].classList.remove('ion-channels-animating');
            }
        }
    }

    async animatePotassiumChannels() {
        console.log('Starting potassium channel animation');

        // Apply parameter effects
        const tempFactor = this.temperatureFactor || 1;
        const stimIntensity = this.stimulationIntensity || 1;

        const kChannels = this.elementManager.getElement('kChannels');
        if (!kChannels || !kChannels.length) {
            console.warn('Potassium channels not found');
            return;
        }

        // Temperature affects timing (higher temp = faster)
        const baseDelay = 100;
        const baseDuration = 300;
        const baseScale = 2;

        const tempAdjustedDelay = baseDelay / tempFactor;
        const tempAdjustedDuration = baseDuration / tempFactor;
        const intensityScale = baseScale + (stimIntensity - 1) * 0.5; // 50% max additional scaling

        // Animate potassium channels with sequential activation
        const animationPromises = Array.from(kChannels).map((channel, index) => {
            return this.timingManager.delay(index * tempAdjustedDelay)
                .then(() => {
                    channel.classList.add('ion-channels-animating');
                    channel.style.fill = '#ff5500';
                    channel.style.opacity = '1';
                    channel.style.transform = `scale(${intensityScale})`;
                    channel.style.transformOrigin = 'center';
                    channel.style.filter = 'url(#glow)';

                    return this.timingManager.delay(tempAdjustedDuration)
                        .then(() => {
                            channel.style.fill = '#ffa500';
                            channel.style.transform = 'scale(1)';
                            channel.style.transformOrigin = 'center';
                            channel.style.filter = 'none';
                            channel.classList.remove('ion-channels-animating');
                        });
                });
        });

        await Promise.all(animationPromises);
        console.log('Potassium channel animation completed');
    }

    async activateSynapticTerminals() {
        const boutons = this.elementManager.getElement('synapticBoutons');
        if (!boutons || !boutons.length) return;

        const activationPromises = Array.from(boutons).map((bouton, index) => {
            return this.timingManager.delay(index * 50)
                .then(() => {
                    bouton.setAttribute('fill', 'url(#depolarizedGradient)');
                    bouton.style.filter = 'url(#synapticGlow)';
                    bouton.style.transform = 'scale(1.3)';
                    bouton.style.transformOrigin = 'center';

                    return this.timingManager.delay(200)
                        .then(() => {
                            bouton.setAttribute('fill', 'url(#restingGradient)');
                            bouton.style.filter = 'none';
                            bouton.style.transform = 'scale(1)';
                            bouton.style.transformOrigin = 'center';
                        });
                });
        });

        await Promise.all(activationPromises);
    }

    // Dendritic activation animation
    async executeDendriticActivation() {
        console.log('Starting dendritic activation animation');
        this.animationState.currentPhase = 'dendritic';

        // Activate dendrites with sequential propagation
        const dendrites = this.elementManager.getElement('dendrites');
        if (dendrites && dendrites.length) {
            const activationPromises = Array.from(dendrites).map((dendrite, index) => {
                return this.timingManager.delay(index * this.timingManager.getTiming('dendriticPropagation'))
                    .then(() => {
                        dendrite.style.stroke = '#ffaa00';
                        dendrite.style.strokeWidth = '6';
                        dendrite.style.filter = 'url(#glow)';

                        return this.timingManager.delay(this.timingManager.getTiming('dendriticActivation'))
                            .then(() => {
                                dendrite.style.stroke = 'url(#restingGradient)';
                                dendrite.style.strokeWidth = '';
                                dendrite.style.filter = '';
                            });
                    });
            });

            await Promise.all(activationPromises);
        }

        // Activate dendritic spines
        const spines = this.elementManager.getElement('spines');
        if (spines && spines.length) {
            const spinePromises = Array.from(spines).map((spine, index) => {
                return this.timingManager.delay(index * 20)
                    .then(() => {
                        spine.style.stroke = '#ffaa00';
                        spine.style.strokeWidth = '2';

                        return this.timingManager.delay(100)
                            .then(() => {
                                spine.style.stroke = 'url(#restingGradient)';
                                spine.style.strokeWidth = '';
                            });
                    });
            });

            await Promise.all(spinePromises);
        }

        console.log('Dendritic activation animation completed');
    }

    cleanupDendriticActivation() {
        const dendrites = this.elementManager.getElement('dendrites');
        if (dendrites && dendrites.length) {
            dendrites.forEach(dendrite => {
                dendrite.style.stroke = 'url(#restingGradient)';
                dendrite.style.strokeWidth = '';
                dendrite.style.filter = '';
                dendrite.style.transform = '';
            });
        }

        const spines = this.elementManager.getElement('spines');
        if (spines && spines.length) {
            spines.forEach(spine => {
                spine.style.stroke = 'url(#restingGradient)';
                spine.style.strokeWidth = '';
                spine.style.transform = '';
            });
        }
    }

    // Calcium dynamics animation
    async executeCalciumDynamics() {
        console.log('Starting calcium dynamics animation');
        this.animationState.calciumActive = true;
        this.animationState.currentPhase = 'calcium';

        // Apply calcium factor effects
        const caFactor = this.calciumFactor || 1;

        // Pause ion channel CSS animations during calcium dynamics
        this.pauseIonChannelCSSAnimations();

        // Show calcium dynamics group
        this.elementManager.setElementStyle('calciumDynamics', { opacity: '1' });

        // Calcium influx at synaptic terminals - higher calcium = more intense influx
        const calciumInflux = this.elementManager.getElement('calciumInflux');
        if (calciumInflux && calciumInflux.length) {
            const baseStrokeWidth = 3;
            const baseDelay = 50;
            const baseDuration = 200;

            const caAdjustedStrokeWidth = baseStrokeWidth + (caFactor - 1) * 2; // 2px max additional width
            const caAdjustedDelay = baseDelay / caFactor; // Higher calcium = faster influx
            const caAdjustedDuration = baseDuration / caFactor;

            const influxPromises = Array.from(calciumInflux).map((influx, index) => {
                return this.timingManager.delay(index * caAdjustedDelay)
                    .then(() => {
                        influx.style.opacity = '1';
                        influx.style.stroke = '#fdcb6e';
                        influx.style.strokeWidth = caAdjustedStrokeWidth.toString();
                        influx.style.filter = 'url(#glow)';

                        return this.timingManager.delay(caAdjustedDuration)
                            .then(() => {
                                influx.style.opacity = '0';
                                influx.style.strokeWidth = '2';
                                influx.style.filter = 'none';
                            });
                    });
            });

            await Promise.all(influxPromises);
        }

        // Calcium wave propagation in soma
        const calciumWave = this.elementManager.getElement('calciumWave');
        if (calciumWave) {
            const baseDuration = this.timingManager.getTiming('calciumDynamics');
            const caAdjustedDuration = baseDuration / caFactor; // Higher calcium = faster wave

            await this.timingManager.animate(
                caAdjustedDuration,
                (progress) => {
                    calciumWave.style.opacity = (1 - progress).toString();
                    const baseWaveStrokeWidth = 2 + progress * 3;
                    const caWaveStrokeWidth = baseWaveStrokeWidth + (caFactor - 1) * 2; // Enhanced stroke width
                    calciumWave.style.strokeWidth = caWaveStrokeWidth.toString();
                    const baseWaveScale = 1 + progress * 0.5;
                    const caWaveScale = baseWaveScale + (caFactor - 1) * 0.3; // Enhanced scale
                    calciumWave.style.transform = `scale(${caWaveScale})`;
                    calciumWave.style.transformOrigin = 'center';
                }
            );
        }

        // Activate calcium channels - higher calcium = more intense activation
        const caChannels = this.elementManager.getElement('caChannels');
        if (caChannels && caChannels.length) {
            // Add animation class to pause CSS animations
            caChannels.forEach(channel => {
                channel.classList.add('ion-channels-animating');
            });

            const baseDelay = 30;
            const baseDuration = 150;
            const baseScale = 2;

            const caAdjustedDelay = baseDelay / caFactor;
            const caAdjustedDuration = baseDuration / caFactor;
            const caAdjustedScale = baseScale + (caFactor - 1) * 0.8; // 80% max additional scaling

            const channelPromises = Array.from(caChannels).map((channel, index) => {
                return this.timingManager.delay(index * caAdjustedDelay)
                    .then(() => {
                        channel.style.fill = '#fdcb6e';
                        channel.style.opacity = '1';
                        channel.style.transform = `scale(${caAdjustedScale})`;
                        channel.style.transformOrigin = 'center';
                        channel.style.filter = 'url(#glow)';

                        return this.timingManager.delay(caAdjustedDuration)
                            .then(() => {
                                channel.style.fill = '#fdcb6e';
                                channel.style.transform = 'scale(1)';
                                channel.style.transformOrigin = 'center';
                                channel.style.filter = 'none';
                            });
                    });
            });

            await Promise.all(channelPromises);

            // Remove animation class after completion
            caChannels.forEach(channel => {
                channel.classList.remove('ion-channels-animating');
            });
        }

        // Resume ion channel CSS animations after calcium dynamics completes
        this.resumeIonChannelCSSAnimations();

        console.log('Calcium dynamics animation completed');
    }

    cleanupCalciumDynamics() {
        this.animationState.calciumActive = false;
        this.elementManager.setElementStyle('calciumDynamics', { opacity: '0' });

        const calciumInflux = this.elementManager.getElement('calciumInflux');
        if (calciumInflux && calciumInflux.length) {
            calciumInflux.forEach(influx => {
                influx.style.opacity = '0';
                influx.style.strokeWidth = '2';
                influx.style.filter = 'none';
            });
        }

        const calciumWave = this.elementManager.getElement('calciumWave');
        if (calciumWave) {
            calciumWave.style.opacity = '0';
            calciumWave.style.strokeWidth = '1';
            calciumWave.style.transform = 'scale(1)';
        }

        const caChannels = this.elementManager.getElement('caChannels');
        if (caChannels && caChannels.length) {
            caChannels.forEach(channel => {
                channel.style.fill = '#fdcb6e';
                channel.style.transform = 'scale(1)';
                channel.style.filter = 'none';
                channel.classList.remove('ion-channels-animating');
            });
        }
    }

    // Other animation methods follow similar pattern...
    async executeSynapticTransmission() {
        this.animationState.synapticActive = true;
        this.animationState.currentPhase = 'synaptic';

        // Pause ion channel CSS animations during synaptic transmission
        this.pauseIonChannelCSSAnimations();

        this.elementManager.setElementStyle('synapticTransmission', { opacity: '1' });

        // Presynaptic terminal depolarization
        this.elementManager.setElementAttribute('synapticBoutons', 'fill', 'url(#depolarizedGradient)', true);
        this.elementManager.setElementStyle('synapticBoutons', { filter: 'url(#actionPotentialGlow)' }, true);

        // Calcium influx and neurotransmitter release
        const calciumInflux = this.elementManager.getElement('calciumInflux');
        if (calciumInflux && calciumInflux.length) {
            for (let i = 0; i < calciumInflux.length; i++) {
                await this.timingManager.delay(i * 30);
                await this.releaseNeurotransmitter(i);
            }
        }

        await this.timingManager.delay(this.timingManager.getTiming('synapticTransmission'));

        // Resume ion channel CSS animations after synaptic transmission completes
        this.resumeIonChannelCSSAnimations();
    }

    cleanupSynapticTransmission() {
        this.animationState.synapticActive = false;
        this.elementManager.setElementStyle('synapticTransmission', { opacity: '0' });
        this.elementManager.setElementAttribute('synapticBoutons', 'fill', 'url(#restingGradient)', true);
        this.elementManager.setElementStyle('synapticBoutons', { filter: 'none' }, true);

        // Reset neurotransmitters to prevent "flying everywhere"
        const neurotransmitters = this.elementManager.getElement('neurotransmitters');
        if (neurotransmitters && neurotransmitters.length) {
            neurotransmitters.forEach(vesicle => {
                vesicle.style.opacity = '0';
                vesicle.style.transform = 'scale(1)';
                vesicle.style.filter = 'none';
            });
        }

        // Reset postsynaptic responses
        const responses = this.elementManager.getElement('postsynapticResponses');
        if (responses && responses.length) {
            responses.forEach(response => {
                response.style.opacity = '0';
                response.style.transform = 'scale(1)';
                response.style.filter = 'none';
            });
        }
    }

    async releaseNeurotransmitter(boutonIndex) {
        const neurotransmitters = this.elementManager.getElement('neurotransmitters');
        if (!neurotransmitters || !neurotransmitters.length) return;

        // Apply calcium-dependent release probability
        const releaseProbability = this.neurotransmitterReleaseProbability || 0.3;
        if (Math.random() > releaseProbability) {
            return; // Skip release based on probability
        }

        const vesicles = Array.from(neurotransmitters).slice(boutonIndex * 3, (boutonIndex + 1) * 3);
        const caStrength = this.synapticStrength || 1;

        const releasePromises = vesicles.map((vesicle, index) => {
            return this.timingManager.delay(index * 100)
                .then(() => {
                    vesicle.style.opacity = '1';
                    const initialScale = 2 * caStrength; // Calcium affects initial size
                    vesicle.style.transform = `scale(${initialScale})`;
                    vesicle.style.transformOrigin = 'center';
                    vesicle.style.filter = 'url(#synapticGlow)';

                    return this.timingManager.delay(100)
                        .then(() => {
                            const releaseScale = 1.5 * caStrength; // Calcium affects release size
                            vesicle.style.transform = `scale(${releaseScale})`;
                            vesicle.style.transformOrigin = 'center';

                            return this.timingManager.delay(100)
                                .then(() => {
                                    vesicle.style.opacity = '0';
                                    vesicle.style.transform = 'scale(1)';
                                    vesicle.style.transformOrigin = 'center';
                                    this.triggerPostsynapticResponse(boutonIndex);
                                });
                        });
                });
        });

        await Promise.all(releasePromises);
    }

    triggerPostsynapticResponse(boutonIndex) {
        const responses = this.elementManager.getElement('postsynapticResponses');
        if (!responses || !responses[boutonIndex]) return;

        const response = responses[boutonIndex];
        const caStrength = this.synapticStrength || 1;

        this.timingManager.delay(50)
            .then(() => {
                response.style.opacity = '1';
                const initialScale = 2 * caStrength; // Calcium affects response size
                response.style.transform = `scale(${initialScale})`;
                response.style.transformOrigin = 'center';
                response.style.filter = 'url(#glow)';

                return this.timingManager.delay(100)
                    .then(() => {
                        const sustainedScale = 1.5 * caStrength; // Calcium affects sustained response
                        response.style.transform = `scale(${sustainedScale})`;
                        response.style.transformOrigin = 'center';
                        response.style.opacity = Math.min(0.8, 0.5 * caStrength); // Calcium affects opacity

                        return this.timingManager.delay(200)
                            .then(() => {
                                response.style.opacity = '0';
                                response.style.transform = 'scale(1)';
                                response.style.transformOrigin = 'center';
                                response.style.filter = 'none';
                            });
                    });
            });
    }

    // Trigger single pulse with new architecture
    triggerSinglePulse() {
        console.log('Triggering single pulse');

        // Reset stimulation state to allow multiple triggers
        this.isStimulating = false;

        const stimBtn = this.elementManager.getElement('stimBtn');
        if (stimBtn) stimBtn.classList.add('stimulating');

        this.I_stim = 8;

        // Queue animations in proper sequence
        console.log('Queueing dendritic activation');
        this.animationController.queueAnimation('dendriticActivation');

        this.timingManager.delay(10)
            .then(() => {
                console.log('Queueing soma depolarization');
                this.animationController.queueAnimation('somaDepolarization');
            });

        this.timingManager.delay(20)
            .then(() => {
                console.log('Queueing axon hillock spike');
                this.animationController.queueAnimation('axonHillockSpike');
            });

        this.timingManager.delay(30)
            .then(() => {
                console.log('Queueing action potential propagation and synaptic transmission');
                this.animationController.queueAnimation('actionPotentialPropagation');
                this.animationController.queueAnimation('synapticTransmission');

                this.timingManager.delay(100)
                    .then(() => {
                        console.log('Queueing calcium dynamics');
                        this.animationController.queueAnimation('calciumDynamics');
                    });
            });

        // Reset stimulation after all animations complete
        this.timingManager.delay(4000) // Longer delay to ensure all animations finish
            .then(() => {
                this.I_stim = 0;
                this.isStimulating = false;
                if (stimBtn) stimBtn.classList.remove('stimulating');
                this.cleanupAllIonChannels();
                console.log('Stimulation reset complete');
            });
    }

    // Pause CSS animations for all ion channels
    pauseIonChannelCSSAnimations() {
        const allChannels = [
            this.elementManager.getElement('naChannelsAxon'),
            this.elementManager.getElement('naChannelsNodes'),
            this.elementManager.getElement('kChannels'),
            this.elementManager.getElement('caChannels')
        ];

        allChannels.forEach(channelGroup => {
            if (channelGroup && channelGroup.length) {
                channelGroup.forEach(channel => {
                    channel.classList.add('ion-channels-animating');
                });
            }
        });
    }

    // Resume CSS animations for all ion channels
    resumeIonChannelCSSAnimations() {
        const allChannels = [
            this.elementManager.getElement('naChannelsAxon'),
            this.elementManager.getElement('naChannelsNodes'),
            this.elementManager.getElement('kChannels'),
            this.elementManager.getElement('caChannels')
        ];

        allChannels.forEach(channelGroup => {
            if (channelGroup && channelGroup.length) {
                channelGroup.forEach(channel => {
                    channel.classList.remove('ion-channels-animating');
                });
            }
        });
    }

    // Global cleanup for all ion channels
    cleanupAllIonChannels() {
        const allChannels = [
            this.elementManager.getElement('naChannelsAxon'),
            this.elementManager.getElement('naChannelsNodes'),
            this.elementManager.getElement('kChannels'),
            this.elementManager.getElement('caChannels')
        ];

        allChannels.forEach(channelGroup => {
            if (channelGroup && channelGroup.length) {
                channelGroup.forEach(channel => {
                    channel.style.transform = 'scale(1)';
                    channel.style.filter = 'none';
                    channel.classList.remove('ion-channels-animating');
                });
            }
        });
    }

    // The following methods remain largely unchanged as they handle the Hodgkin-Huxley model
    // and basic UI interactions:

    initializeIonChannels() {
        // ... unchanged implementation
    }

    updateTemperatureEffects() {
        // Temperature affects animation speed and channel kinetics (Q10 effect)
        // Q10 = 2-3 for biological processes, using 2.5
        const baseTemp = 37; // Base temperature in Celsius
        const tempFactor = Math.pow(2.5, (this.temperature - baseTemp) / 10);

        // Apply temperature scaling to animation timings
        const timingAdjustments = {
            dendriticActivation: 300 / tempFactor,
            dendriticPropagation: 50 / tempFactor,
            somaDepolarization: 100 / tempFactor,
            axonHillockActivation: 50 / tempFactor,
            actionPotentialWave: 1500 / tempFactor,
            nodeActivation: 400 / tempFactor,
            synapticTransmission: 1500 / tempFactor,
            calciumDynamics: 2000 / tempFactor,
            neurotransmitterRelease: 100 / tempFactor,
            postsynapticResponse: 200 / tempFactor
        };

        // Update timing manager with temperature-adjusted values
        Object.keys(timingAdjustments).forEach(timingName => {
            this.timingManager.setTiming(timingName, timingAdjustments[timingName]);
        });

        // Temperature affects membrane excitability
        this.temperatureFactor = tempFactor;

        // Visual feedback for temperature change
        this.addParameterChangeFeedback('temperature');

        // If currently animating, update ongoing animations
        if (this.animationState.currentPhase !== 'idle') {
            this.updateOngoingAnimationsForTemperature();
        }

        console.log(`Temperature updated to ${this.temperature}°C, speed factor: ${tempFactor.toFixed(2)}`);
    }

    updateStimulation(frequency) {
        // Update stimulation frequency and patterns
        this.stimulationFrequency = frequency;

        // Stop any existing continuous stimulation
        if (this.stimulationInterval) {
            clearInterval(this.stimulationInterval);
            this.stimulationInterval = null;
        }

        if (frequency > 0) {
            // Calculate interval based on frequency (Hz to ms)
            const interval = 1000 / frequency;

            // Start continuous stimulation with frequency-dependent intensity
            this.startContinuousStimulationWithFrequency(interval, frequency);

            // Visual feedback for stimulation change
            this.addParameterChangeFeedback('stimulation');

            // Update stimulation intensity based on frequency
            this.stimulationIntensity = Math.min(frequency / 10, 2); // Cap at 2x intensity

            console.log(`Stimulation frequency updated to ${frequency} Hz, interval: ${interval}ms`);
        } else {
            // Stop continuous stimulation
            this.stopContinuousStimulation();
            this.stimulationIntensity = 0;
            console.log('Stimulation stopped');
        }

        // If currently animating, update ongoing animations for stimulation
        if (this.animationState.currentPhase !== 'idle') {
            this.updateOngoingAnimationsForStimulation();
        }
    }

    updateCalciumEffects() {
        // Calcium affects synaptic transmission strength and neurotransmitter release
        const baseCa = 2.0; // Base calcium concentration in mM
        const caFactor = this.Ca_ext / baseCa;

        // Calcium affects synaptic transmission probability and strength
        this.calciumFactor = caFactor;

        // Update neurotransmitter release probability based on calcium
        this.neurotransmitterReleaseProbability = Math.min(0.9, 0.3 * caFactor);

        // Update synaptic strength (higher Ca²⁺ = stronger synaptic responses)
        this.synapticStrength = Math.min(2.0, caFactor);

        // Visual feedback for calcium change
        this.addParameterChangeFeedback('calcium');

        // If currently animating, update ongoing animations for calcium
        if (this.animationState.currentPhase !== 'idle') {
            this.updateOngoingAnimationsForCalcium();
        }

        console.log(`Calcium concentration updated to ${this.Ca_ext} mM, synaptic strength: ${this.synapticStrength.toFixed(2)}`);
    }

    startContinuousStimulationWithFrequency(interval, frequency) {
        // Start continuous stimulation with frequency-dependent patterns
        this.continuousStimulation = true;

        // Determine stimulation pattern based on frequency
        let pattern;
        if (frequency <= 1) {
            pattern = 'single'; // Single spikes
        } else if (frequency <= 5) {
            pattern = 'burst'; // Burst firing
        } else if (frequency <= 10) {
            pattern = 'tonic'; // Tonic firing
        } else {
            pattern = 'high-frequency'; // High-frequency firing
        }

        this.stimulationPattern = pattern;

        // Start the stimulation interval
        this.stimulationInterval = setInterval(() => {
            if (!this.animationState.apActive) { // Don't trigger if already firing
                this.triggerPatternedStimulation(pattern, frequency);
            }
        }, interval);

        console.log(`Continuous stimulation started: ${pattern} pattern at ${frequency} Hz`);
    }

    stopContinuousStimulation() {
        // Stop continuous stimulation
        this.continuousStimulation = false;

        if (this.stimulationInterval) {
            clearInterval(this.stimulationInterval);
            this.stimulationInterval = null;
        }

        this.stimulationPattern = null;
        this.stimulationIntensity = 0;

        console.log('Continuous stimulation stopped');
    }

    triggerPatternedStimulation(pattern, frequency) {
        // Trigger stimulation based on pattern
        switch (pattern) {
            case 'single':
                this.I_stim = 8;
                this.triggerSinglePulse();
                break;
            case 'burst':
                // Burst pattern: 3-5 spikes in rapid succession
                this.triggerBurstPattern();
                break;
            case 'tonic':
                // Tonic pattern: regular single spikes
                this.I_stim = Math.min(12, 6 + frequency); // Higher intensity
                this.triggerSinglePulse();
                break;
            case 'high-frequency':
                // High-frequency pattern: intense single spikes
                this.I_stim = Math.min(15, 8 + frequency * 0.5);
                this.triggerSinglePulse();
                break;
        }
    }

    triggerBurstPattern() {
        // Trigger a burst of 3-5 action potentials
        const burstCount = 3 + Math.floor(Math.random() * 3); // 3-5 spikes
        let currentBurst = 0;

        const triggerNext = () => {
            if (currentBurst < burstCount) {
                this.I_stim = 10; // Higher intensity for burst
                this.triggerSinglePulse();
                currentBurst++;

                // Schedule next spike in burst (50-100ms interval)
                setTimeout(triggerNext, 50 + Math.random() * 50);
            }
        };

        triggerNext();
    }

    updateOngoingAnimationsForTemperature() {
        // Update ongoing animations when temperature changes
        const tempFactor = this.temperatureFactor || 1;

        // Update membrane potential visualization with temperature effects
        if (this.animationState.membranePotential !== 'resting') {
            const soma = this.elementManager.getElement('soma');
            if (soma) {
                // Temperature affects membrane color intensity
                const intensity = Math.min(1.5, tempFactor);
                soma.style.filter = `url(#glow) brightness(${intensity})`;
            }
        }

        // Update ion channel animations with temperature-dependent speed
        const allChannels = [
            this.elementManager.getElement('naChannelsAxon'),
            this.elementManager.getElement('naChannelsNodes'),
            this.elementManager.getElement('kChannels'),
            this.elementManager.getElement('caChannels')
        ];

        allChannels.forEach(channelGroup => {
            if (channelGroup && channelGroup.length) {
                channelGroup.forEach(channel => {
                    // Adjust animation speed for temperature
                    const animationDuration = tempFactor > 1 ? (2 / tempFactor) : (2 * tempFactor);
                    channel.style.animationDuration = `${animationDuration}s`;
                });
            }
        });
    }

    updateOngoingAnimationsForStimulation() {
        // Update ongoing animations when stimulation changes
        const intensity = this.stimulationIntensity || 1;

        // Update soma depolarization intensity based on stimulation
        if (this.animationState.currentPhase === 'somaDepolarization' ||
            this.animationState.currentPhase === 'stimulation') {
            const soma = this.elementManager.getElement('soma');
            if (soma) {
                const scale = 1 + (intensity - 1) * 0.2; // 20% max additional scaling
                soma.style.transform = `scale(${scale})`;
                soma.style.transformOrigin = 'center';
            }
        }

        // Update action potential wave intensity
        if (this.animationState.apActive) {
            const wave = this.elementManager.getElement('actionPotentialWave');
            if (wave) {
                const strokeWidth = 6 + (intensity - 1) * 4; // 4px max additional width
                wave.style.strokeWidth = strokeWidth.toString();
            }
        }
    }

    updateOngoingAnimationsForCalcium() {
        // Update ongoing animations when calcium changes
        const caStrength = this.synapticStrength || 1;

        // Update synaptic transmission intensity
        if (this.animationState.synapticActive) {
            const boutons = this.elementManager.getElement('synapticBoutons');
            if (boutons && boutons.length) {
                boutons.forEach(bouton => {
                    const scale = 1 + (caStrength - 1) * 0.5; // 50% max additional scaling
                    bouton.style.transform = `scale(${scale})`;
                    bouton.style.transformOrigin = 'center';
                });
            }

            // Update neurotransmitter release intensity
            const neurotransmitters = this.elementManager.getElement('neurotransmitters');
            if (neurotransmitters && neurotransmitters.length) {
                neurotransmitters.forEach(vesicle => {
                    if (vesicle.style.opacity === '1') {
                        const scale = 1.5 + (caStrength - 1) * 0.8; // Enhanced scaling
                        vesicle.style.transform = `scale(${scale})`;
                        vesicle.style.transformOrigin = 'center';
                    }
                });
            }

            // Update postsynaptic response intensity
            const responses = this.elementManager.getElement('postsynapticResponses');
            if (responses && responses.length) {
                responses.forEach(response => {
                    if (response.style.opacity === '1') {
                        const scale = 2 + (caStrength - 1) * 1; // Double scaling effect
                        response.style.transform = `scale(${scale})`;
                        response.style.transformOrigin = 'center';
                    }
                });
            }
        }

        // Update calcium dynamics intensity
        if (this.animationState.calciumActive) {
            const calciumInflux = this.elementManager.getElement('calciumInflux');
            if (calciumInflux && calciumInflux.length) {
                calciumInflux.forEach(influx => {
                    if (influx.style.opacity === '1') {
                        const strokeWidth = 3 + (caStrength - 1) * 2; // 2px max additional width
                        influx.style.strokeWidth = strokeWidth.toString();
                    }
                });
            }
        }
    }

    addParameterChangeFeedback(parameter) {
        // Provide visual feedback when parameters change
        const now = Date.now();
        if (now - this.lastParameterChange < this.parameterChangeCooldown) {
            return; // Too soon for another feedback
        }

        this.lastParameterChange = now;

        switch (parameter) {
            case 'temperature':
                this.showTemperatureFeedback();
                break;
            case 'stimulation':
                this.showStimulationFeedback();
                break;
            case 'calcium':
                this.showCalciumFeedback();
                break;
        }
    }

    showTemperatureFeedback() {
        // Temperature feedback - thermal pulse effect
        const soma = this.elementManager.getElement('soma');
        if (soma) {
            soma.classList.add('temperature-indicator');
            setTimeout(() => {
                soma.classList.remove('temperature-indicator');
            }, 1000);
        }

        // Show temperature indicator on info panel
        const voltageDisplay = this.elementManager.getElement('voltageDisplay');
        if (voltageDisplay) {
            voltageDisplay.style.color = this.temperature > 37 ? '#ff6b6b' : '#00d4ff';
            setTimeout(() => {
                voltageDisplay.style.color = '#00d4ff';
            }, 500);
        }
    }

    showStimulationFeedback() {
        // Stimulation feedback - brief dendritic activation
        if (this.stimulationFrequency > 0) {
            // Quick dendritic pulse to show stimulation is active
            this.animationController.queueAnimation('dendriticActivation');
        }

        // Show stimulation indicator on button
        const stimBtn = this.elementManager.getElement('stimBtn');
        if (stimBtn) {
            stimBtn.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.6)';
            setTimeout(() => {
                stimBtn.style.boxShadow = '';
            }, 300);
        }
    }

    showCalciumFeedback() {
        // Calcium feedback - brief calcium spark
        const calciumWave = this.elementManager.getElement('calciumWave');
        if (calciumWave) {
            calciumWave.style.opacity = '0.8';
            calciumWave.style.strokeWidth = '4';
            calciumWave.style.transform = 'scale(1.2)';
            calciumWave.style.transformOrigin = 'center';

            setTimeout(() => {
                calciumWave.style.opacity = '0';
                calciumWave.style.strokeWidth = '1';
                calciumWave.style.transform = 'scale(1)';
            }, 800);
        }

        // Show calcium indicator on synaptic boutons
        const boutons = this.elementManager.getElement('synapticBoutons');
        if (boutons && boutons.length) {
            boutons.forEach((bouton, index) => {
                setTimeout(() => {
                    bouton.style.filter = 'url(#synapticGlow)';
                    setTimeout(() => {
                        bouton.style.filter = 'none';
                    }, 200);
                }, index * 100);
            });
        }
    }

    // Hodgkin-Huxley equations remain unchanged
    alpha_m(V) { return 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10)); }
    beta_m(V) { return 4 * Math.exp(-(V + 65) / 18); }
    alpha_h(V) { return 0.07 * Math.exp(-(V + 65) / 20); }
    beta_h(V) { return 1 / (1 + Math.exp(-(V + 35) / 10)); }
    alpha_n(V) { return 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10)); }
    beta_n(V) { return 0.125 * Math.exp(-(V + 65) / 80); }

    updateIonChannelGates() {
        // Update ion channel states based on membrane potential
        // This creates realistic channel opening/closing patterns

        // Sodium channels: open during depolarization
        const naOpenProbability = Math.max(0, Math.min(1, (this.V + 50) / 30));

        // Potassium channels: open during repolarization
        const kOpenProbability = Math.max(0, Math.min(1, (this.V + 70) / 40));

        // Calcium channels: open during synaptic transmission
        const caOpenProbability = this.animationState.synapticActive ? 0.8 : 0.1;

        // Update channel states for visualization
        this.naChannelStates = Array.from({length: 10}, (_, i) =>
            Math.random() < naOpenProbability ? 'open' : 'closed'
        );

        this.kChannelStates = Array.from({length: 6}, (_, i) =>
            Math.random() < kOpenProbability ? 'open' : 'closed'
        );

        this.caChannelStates = Array.from({length: 6}, (_, i) =>
            Math.random() < caOpenProbability ? 'open' : 'closed'
        );
    }

    updateChannelVisualization() {
        // Update ion channel visualization based on current states
        // This makes channels pulse realistically during action potentials

        // Update sodium channels
        const naChannelsAxon = this.elementManager.getElement('naChannelsAxon');
        if (naChannelsAxon && naChannelsAxon.length) {
            naChannelsAxon.forEach((channel, index) => {
                if (this.naChannelStates[index] === 'open' && this.V > -40) {
                    channel.style.opacity = '1';
                    channel.style.transform = 'scale(1.2)';
                } else {
                    channel.style.opacity = '0.6';
                    channel.style.transform = 'scale(1)';
                }
            });
        }

        // Update potassium channels
        const kChannels = this.elementManager.getElement('kChannels');
        if (kChannels && kChannels.length) {
            kChannels.forEach((channel, index) => {
                if (this.kChannelStates[index] === 'open' && this.V < -50) {
                    channel.style.opacity = '1';
                    channel.style.transform = 'scale(1.3)';
                } else {
                    channel.style.opacity = '0.5';
                    channel.style.transform = 'scale(1)';
                }
            });
        }

        // Update calcium channels
        const caChannels = this.elementManager.getElement('caChannels');
        if (caChannels && caChannels.length) {
            caChannels.forEach((channel, index) => {
                if (this.caChannelStates[index] === 'open' && this.animationState.synapticActive) {
                    channel.style.opacity = '1';
                    channel.style.transform = 'scale(1.4)';
                } else {
                    channel.style.opacity = '0.4';
                    channel.style.transform = 'scale(1)';
                }
            });
        }
    }

    updateMembranePotential() {
        // Hodgkin-Huxley equations implementation
        const dt = this.timeStep;

        // Calculate rate constants with temperature scaling
        const tempFactor = Math.pow(2.5, (this.temperature - 37) / 10);

        // Update gating variables using Euler integration
        const alpha_m = this.alpha_m(this.V) * tempFactor;
        const beta_m = this.beta_m(this.V) * tempFactor;
        const alpha_h = this.alpha_h(this.V) * tempFactor;
        const beta_h = this.beta_h(this.V) * tempFactor;
        const alpha_n = this.alpha_n(this.V) * tempFactor;
        const beta_n = this.beta_n(this.V) * tempFactor;

        // Update m, h, n gates
        this.m += dt * (alpha_m * (1 - this.m) - beta_m * this.m);
        this.h += dt * (alpha_h * (1 - this.h) - beta_h * this.h);
        this.n += dt * (alpha_n * (1 - this.n) - beta_n * this.n);

        // Calculate ionic currents
        const g_Na = 120 * Math.pow(this.m, 3) * this.h; // Sodium conductance
        const g_K = 36 * Math.pow(this.n, 4); // Potassium conductance
        const g_L = 0.3; // Leak conductance

        const I_Na = g_Na * (this.V - 55); // Sodium current
        const I_K = g_K * (this.V + 72); // Potassium current
        const I_L = g_L * (this.V + 49.387); // Leak current

        // Total membrane current
        const I_total = this.I_stim - I_Na - I_K - I_L;

        // Update membrane potential
        this.V += dt * I_total / 1.0; // Capacitance = 1 μF/cm²

        // Check for spike
        if (this.V > 0 && this.lastSpikeTime < this.time - 5) {
            this.lastSpikeTime = this.time;
            this.spikeTimes.push(this.time);

            // Keep only recent spikes (last 1 second)
            this.spikeTimes = this.spikeTimes.filter(spikeTime =>
                this.time - spikeTime <= 1000
            );
        }

        // Update firing rate (spikes per second)
        this.firingRate = this.spikeTimes.length;

        // Update time
        this.time += dt;

        // Apply stimulation effects
        this.applyParameterEffects();
    }

    applyParameterEffects() {
        // Apply parameter effects to the simulation
        // Temperature effects are already handled in updateMembranePotential()

        // Stimulation intensity affects action potential threshold
        if (this.stimulationIntensity > 1) {
            // Higher stimulation makes neuron more excitable
            this.I_stim *= this.stimulationIntensity;
        }

        // Calcium concentration affects synaptic transmission
        if (this.calciumFactor > 1) {
            // Higher calcium increases neurotransmitter release probability
            this.neurotransmitterReleaseProbability = Math.min(0.9, 0.3 * this.calciumFactor);
        }

        // Synaptic strength affects postsynaptic responses
        if (this.synapticStrength > 1) {
            // Higher synaptic strength increases response amplitude
            // This is handled in the animation methods
        }
    }

    updateMembraneVisualization() {
        // Update soma color based on membrane potential
        const soma = this.elementManager.getElement('soma');
        if (soma) {
            if (this.V > -40) {
                // Depolarized state
                soma.setAttribute('fill', 'url(#depolarizedGradient)');
                soma.style.filter = 'url(#actionPotentialGlow)';
            } else if (this.V < -80) {
                // Hyperpolarized state
                soma.setAttribute('fill', 'url(#hyperpolarizedGradient)');
                soma.style.filter = 'url(#glow)';
            } else {
                // Resting state
                soma.setAttribute('fill', 'url(#restingGradient)');
                soma.style.filter = 'url(#glow)';
            }
        }

        // Update axon hillock based on action potential state
        const axonHillock = this.elementManager.getElement('axonHillock');
        if (axonHillock) {
            if (this.V > -20) {
                axonHillock.setAttribute('fill', 'url(#depolarizedGradient)');
                axonHillock.style.filter = 'url(#actionPotentialGlow)';
            } else {
                axonHillock.setAttribute('fill', 'url(#restingGradient)');
                axonHillock.style.filter = 'url(#glow)';
            }
        }

        // Update dendrites based on local potentials
        const dendrites = this.elementManager.getElement('dendrites');
        if (dendrites && dendrites.length) {
            dendrites.forEach(dendrite => {
                if (this.V > -50 && this.animationState.currentPhase === 'dendritic') {
                    dendrite.style.stroke = '#ffaa00';
                    dendrite.style.strokeWidth = '4';
                } else {
                    dendrite.style.stroke = 'url(#restingGradient)';
                    dendrite.style.strokeWidth = '2';
                }
            });
        }
    }

    step() {
        // Advance simulation by one time step
        this.updateMembranePotential();
        this.updateChannelVisualization();
        this.updateDisplays();

        // Update ion channel states for visualization
        this.updateIonChannelGates();
    }

    updateParameterEffects() {
        // ... unchanged implementation
    }

    updateDisplays() {
        // Update voltage display
        const voltageDisplay = this.elementManager.getElement('voltageDisplay');
        if (voltageDisplay) {
            voltageDisplay.textContent = this.V.toFixed(1);
        }

        // Update firing rate display
        const firingRateDisplay = this.elementManager.getElement('firingRateDisplay');
        if (firingRateDisplay) {
            firingRateDisplay.textContent = this.firingRate.toString();
        }

        // Update membrane visualization based on voltage
        this.updateMembraneVisualization();
    }

    startSimulation() {
        // Start continuous simulation loop
        if (this.isRunning) return;

        this.isRunning = true;

        const simulationLoop = () => {
            if (!this.isRunning) return;

            this.step();

            // Schedule next frame
            this.animationId = requestAnimationFrame(simulationLoop);
        };

        // Start the simulation loop
        simulationLoop();
    }

    stopSimulation() {
        // ... unchanged implementation
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RealisticNeuron();
});