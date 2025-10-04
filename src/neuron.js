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

        // Reset wave properties
        wave.style.opacity = '1';
        wave.style.stroke = '#ff0000';
        wave.style.strokeWidth = '8';
        wave.style.filter = 'url(#actionPotentialGlow)';

        const length = wave.getTotalLength();
        console.log('Action potential wave length:', length);

        wave.style.strokeDasharray = length;
        wave.style.strokeDashoffset = length;

        // Calculate node activation times based on their positions along the axon
        // Path: M 400 300 L 440 300 L 500 300 L 580 300 L 660 300 L 740 300
        // Total length: 340px
        // Node positions from start: Node1=100px (29.4%), Node2=180px (52.9%), Node3=260px (76.5%)
        const nodeActivationTimes = [
            441,  // Node 1 at 29.4% of 1500ms
            794,  // Node 2 at 52.9% of 1500ms
            1148  // Node 3 at 76.5% of 1500ms
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

        // Animate wave propagation
        await this.timingManager.animate(
            this.timingManager.getTiming('actionPotentialWave'),
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
        node.setAttribute('fill', 'url(#depolarizedGradient)');
        node.style.filter = 'url(#actionPotentialGlow)';
        node.style.transform = 'scale(1.8)';
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
                nodeChannels[channelIndex1].style.transform = 'scale(2.5)';
                nodeChannels[channelIndex1].style.transformOrigin = 'center';
                nodeChannels[channelIndex1].style.filter = 'url(#actionPotentialGlow)';
            }

            if (nodeChannels[channelIndex2]) {
                nodeChannels[channelIndex2].classList.add('ion-channels-animating');
                nodeChannels[channelIndex2].style.fill = '#ff0000';
                nodeChannels[channelIndex2].style.opacity = '1';
                nodeChannels[channelIndex2].style.transform = 'scale(2.5)';
                nodeChannels[channelIndex2].style.transformOrigin = 'center';
                nodeChannels[channelIndex2].style.filter = 'url(#actionPotentialGlow)';
            }
        }

        await this.timingManager.delay(400);

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

        const kChannels = this.elementManager.getElement('kChannels');
        if (!kChannels || !kChannels.length) {
            console.warn('Potassium channels not found');
            return;
        }

        // Animate potassium channels with sequential activation
        const animationPromises = Array.from(kChannels).map((channel, index) => {
            return this.timingManager.delay(index * 100)
                .then(() => {
                    channel.classList.add('ion-channels-animating');
                    channel.style.fill = '#ff5500';
                    channel.style.opacity = '1';
                    channel.style.transform = 'scale(2)';
                    channel.style.transformOrigin = 'center';
                    channel.style.filter = 'url(#glow)';

                    return this.timingManager.delay(300)
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

        // Pause ion channel CSS animations during calcium dynamics
        this.pauseIonChannelCSSAnimations();

        // Show calcium dynamics group
        this.elementManager.setElementStyle('calciumDynamics', { opacity: '1' });

        // Calcium influx at synaptic terminals
        const calciumInflux = this.elementManager.getElement('calciumInflux');
        if (calciumInflux && calciumInflux.length) {
            const influxPromises = Array.from(calciumInflux).map((influx, index) => {
                return this.timingManager.delay(index * 50)
                    .then(() => {
                        influx.style.opacity = '1';
                        influx.style.stroke = '#fdcb6e';
                        influx.style.strokeWidth = '3';
                        influx.style.filter = 'url(#glow)';

                        return this.timingManager.delay(200)
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
            await this.timingManager.animate(
                this.timingManager.getTiming('calciumDynamics'),
                (progress) => {
                    calciumWave.style.opacity = (1 - progress).toString();
                    calciumWave.style.strokeWidth = (2 + progress * 3).toString();
                    calciumWave.style.transform = `scale(${1 + progress * 0.5})`;
                    calciumWave.style.transformOrigin = 'center';
                }
            );
        }

        // Activate calcium channels
        const caChannels = this.elementManager.getElement('caChannels');
        if (caChannels && caChannels.length) {
            // Add animation class to pause CSS animations
            caChannels.forEach(channel => {
                channel.classList.add('ion-channels-animating');
            });

            const channelPromises = Array.from(caChannels).map((channel, index) => {
                return this.timingManager.delay(index * 30)
                    .then(() => {
                        channel.style.fill = '#fdcb6e';
                        channel.style.opacity = '1';
                        channel.style.transform = 'scale(2)';
                        channel.style.transformOrigin = 'center';
                        channel.style.filter = 'url(#glow)';

                        return this.timingManager.delay(150)
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

        const vesicles = Array.from(neurotransmitters).slice(boutonIndex * 3, (boutonIndex + 1) * 3);

        const releasePromises = vesicles.map((vesicle, index) => {
            return this.timingManager.delay(index * 100)
                .then(() => {
                    vesicle.style.opacity = '1';
                    vesicle.style.transform = 'scale(2)';
                    vesicle.style.transformOrigin = 'center';
                    vesicle.style.filter = 'url(#synapticGlow)';

                    return this.timingManager.delay(100)
                        .then(() => {
                            vesicle.style.transform = 'scale(1.5)';
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

        this.timingManager.delay(50)
            .then(() => {
                response.style.opacity = '1';
                response.style.transform = 'scale(2)';
                response.style.transformOrigin = 'center';
                response.style.filter = 'url(#glow)';

                return this.timingManager.delay(100)
                    .then(() => {
                        response.style.transform = 'scale(1.5)';
                        response.style.transformOrigin = 'center';
                        response.style.opacity = '0.8';

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
        // ... unchanged implementation
    }

    updateStimulation(frequency) {
        // ... unchanged implementation
    }

    updateCalciumEffects() {
        // ... unchanged implementation
    }

    startContinuousStimulation() {
        // ... unchanged implementation
    }

    stopContinuousStimulation() {
        // ... unchanged implementation
    }

    addParameterChangeFeedback(parameter) {
        // ... unchanged implementation
    }

    showDendriticPotential() {
        // ... unchanged implementation
    }

    showCalciumEffect() {
        // ... unchanged implementation
    }

    // Hodgkin-Huxley equations remain unchanged
    alpha_m(V) { return 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10)); }
    beta_m(V) { return 4 * Math.exp(-(V + 65) / 18); }
    alpha_h(V) { return 0.07 * Math.exp(-(V + 65) / 20); }
    beta_h(V) { return 1 / (1 + Math.exp(-(V + 35) / 10)); }
    alpha_n(V) { return 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10)); }
    beta_n(V) { return 0.125 * Math.exp(-(V + 65) / 80); }

    updateIonChannelGates() {
        // ... unchanged implementation
    }

    updateChannelVisualization() {
        // ... unchanged implementation
    }

    updateMembranePotential() {
        // ... unchanged implementation
    }

    applyParameterEffects() {
        // ... unchanged implementation
    }

    updateMembraneVisualization() {
        // ... unchanged implementation
    }

    step() {
        // ... unchanged implementation
    }

    updateParameterEffects() {
        // ... unchanged implementation
    }

    updateDisplays() {
        // ... unchanged implementation
    }

    startSimulation() {
        // ... unchanged implementation
    }

    stopSimulation() {
        // ... unchanged implementation
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RealisticNeuron();
});