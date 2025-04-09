/**
 * GuitarMuse Audio Engine
 * Handles the generation and playback of guitar chord audio
 * using the Web Audio API
 */

class AudioEngine {
    constructor() {
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // Set default settings
        this.volume = 0.7;
        this.tempo = 120; // BPM
        
        // Guitar sound samples cache
        this.sampleCache = {};
        
        // Define note frequencies
        this.noteFrequencies = this._generateNoteFrequencies();
        
        // Guitar string tuning (standard)
        this.guitarStrings = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
        
        // Initialize
        this._init();
    }
    
    /**
     * Initialize the audio engine
     * @private
     */
    async _init() {
        // Set master volume
        this.setVolume(this.volume);
        
        // Preload some basic samples if needed
        // await this._preloadCommonSamples();
    }
    
    /**
     * Play a full chord
     * @param {Object} chord - Chord data with name and notes
     * @param {number} duration - Duration in seconds
     * @returns {Promise} - Resolves when chord finishes playing
     */
    async playChord(chord, duration = 2) {
        // Ensure audio context is running (needed for browsers that suspend by default)
        await this._resumeAudioContext();
        
        const notes = this._getChordNotes(chord);
        const noteDuration = duration * 1000; // Convert to milliseconds
        
        // Create a single attack and decay envelope for the whole chord
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration;
        
        // Play each note in the chord
        const playPromises = notes.map(note => this._playNote(note, startTime, endTime));
        
        // Wait for all notes to finish
        return Promise.all(playPromises);
    }
    
    /**
     * Play chord notes one by one (arpeggio)
     * @param {Object} chord - Chord data with name and notes
     * @param {number} noteSpacing - Time between notes in seconds
     * @returns {Promise} - Resolves when arpeggio finishes playing
     */
    async playArpeggio(chord, noteSpacing = 0.2) {
        await this._resumeAudioContext();
        
        const notes = this._getChordNotes(chord);
        const noteDuration = noteSpacing * 1.2; // Slightly longer than spacing for overlap
        const totalDuration = notes.length * noteSpacing;
        
        const playPromises = [];
        const startTime = this.audioContext.currentTime;
        
        // Play each note with a delay
        notes.forEach((note, index) => {
            const noteStartTime = startTime + (index * noteSpacing);
            const noteEndTime = noteStartTime + noteDuration;
            playPromises.push(this._playNote(note, noteStartTime, noteEndTime));
        });
        
        return Promise.all(playPromises);
    }
    
    /**
     * Play a progression as a sequence of chords
     * @param {Array} progression - Array of chord objects
     * @param {number} tempo - Tempo in BPM
     * @returns {Promise} - Resolves when progression finishes playing
     */
    async playProgression(progression, tempo = this.tempo) {
        await this._resumeAudioContext();
        
        // Calculate duration based on tempo (4 beats per chord)
        const beatDuration = 60 / tempo; // Duration of one beat in seconds
        const chordDuration = beatDuration * 4; // 4 beats per chord
        
        const playPromises = [];
        const startTime = this.audioContext.currentTime;
        
        // Play each chord in sequence
        progression.forEach((chord, index) => {
            const chordStartTime = startTime + (index * chordDuration);
            const chordEndTime = chordStartTime + chordDuration;
            
            const notes = this._getChordNotes(chord);
            notes.forEach(note => {
                playPromises.push(this._playNote(note, chordStartTime, chordEndTime));
            });
        });
        
        return Promise.all(playPromises);
    }
    
    /**
     * Set the master volume
     * @param {number} volume - Volume level (0 to 1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.masterGain.gain.value = this.volume;
    }
    
    /**
     * Set the tempo for progression playback
     * @param {number} bpm - Tempo in beats per minute
     */
    setTempo(bpm) {
        this.tempo = Math.max(40, Math.min(240, bpm));
    }
    
    /**
     * Play individual guitar string
     * @param {number} stringNumber - String number (0-5, where 0 is low E)
     * @param {number} fret - Fret number (0 for open string)
     * @returns {Promise} - Resolves when note finishes playing
     */
    async playString(stringNumber, fret) {
        await this._resumeAudioContext();
        
        if (stringNumber < 0 || stringNumber > 5) {
            throw new Error('Invalid string number. Must be between 0 and 5.');
        }
        
        const baseNote = this.guitarStrings[stringNumber];
        const note = this._calculateNote(baseNote, fret);
        
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + 1.5; // 1.5 second duration
        
        return this._playNote(note, startTime, endTime);
    }
    
    /**
     * Get chord notes based on chord name or diagram
     * @private
     * @param {Object} chord - Chord object with name and/or diagram
     * @returns {Array} - Array of note names
     */
    _getChordNotes(chord) {
        // If the chord includes a diagram, parse it
        if (chord.diagram) {
            return this._getNotesFromDiagram(chord.diagram);
        }
        
        // Otherwise, use predefined chord mappings
        // This is a simplified implementation - a real version would
        // have a comprehensive dictionary of chord shapes
        const chordMap = {
            // Major chords
            'A': ['A2', 'E3', 'A3', 'C#4', 'E4'],
            'C': ['C3', 'E3', 'G3', 'C4', 'E4'],
            'D': ['D3', 'A3', 'D4', 'F#4'],
            'E': ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
            'G': ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'],
            
            // Minor chords
            'Am': ['A2', 'E3', 'A3', 'C4', 'E4'],
            'Dm': ['D3', 'A3', 'D4', 'F4'],
            'Em': ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
            
            // 7th chords
            'A7': ['A2', 'E3', 'G3', 'C#4', 'E4'],
            'E7': ['E2', 'B2', 'D3', 'G#3', 'B3', 'E4'],
            'G7': ['G2', 'B2', 'D3', 'F3', 'G3', 'B3']
        };
        
        // Look for exact match
        if (chordMap[chord.name]) {
            return chordMap[chord.name];
        }
        
        // If no exact match, try to make an educated guess
        // This is a simplified version - a real implementation would use
        // music theory to construct chord notes
        console.warn(`No predefined notes for chord ${chord.name}, using approximation`);
        
        // Default to a major or minor triad based on chord name
        if (chord.name.includes('m') || chord.name.includes('min')) {
            // Minor chord
            const root = chord.name.replace('m', '').replace('in', '').split('/')[0];
            const rootNote = this._getNoteWithOctave(root, 3);
            const third = this._calculateNote(rootNote, 3); // Minor third
            const fifth = this._calculateNote(rootNote, 7); // Perfect fifth
            return [rootNote, third, fifth];
        } else {
            // Major chord
            const root = chord.name.split('/')[0]; // Handle slash chords
            const rootNote = this._getNoteWithOctave(root, 3);
            const third = this._calculateNote(rootNote, 4); // Major third
            const fifth = this._calculateNote(rootNote, 7); // Perfect fifth
            return [rootNote, third, fifth];
        }
    }
    
    /**
     * Extract played notes from a chord diagram
     * @private
     * @param {string} diagram - Text-based chord diagram
     * @returns {Array} - Array of note names
     */
    _getNotesFromDiagram(diagram) {
        // Parse the chord diagram to determine which strings are played
        // and at which frets
        const notes = [];
        const lines = diagram.split('\n');
        
        // Standard tuning strings in reverse order (as they appear in diagrams)
        // E4, B3, G3, D3, A2, E2
        const strings = [...this.guitarStrings].reverse();
        
        // Process each string in the diagram
        lines.forEach((line, index) => {
            if (index >= strings.length) return;
            
            // Skip if string is not played
            if (line.includes('X') || line.includes('x')) return;
            
            // Find the fret number
            const fretMatch = line.match(/--(\d+)--/);
            const fret = fretMatch ? parseInt(fretMatch[1]) : 0;
            
            // Calculate the note for this string and fret
            const baseNote = strings[index];
            const note = this._calculateNote(baseNote, fret);
            notes.push(note);
        });
        
        return notes;
    }
    
    /**
     * Play a single note
     * @private
     * @param {string} note - Note name with octave (e.g., 'A4')
     * @param {number} startTime - Start time in seconds
     * @param {number} endTime - End time in seconds
     * @returns {Promise} - Resolves when note finishes playing
     */
    _playNote(note, startTime, endTime) {
        return new Promise(resolve => {
            const frequency = this._getNoteFrequency(note);
            
            // Create oscillator for this note
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'triangle'; // More guitar-like than sine
            oscillator.frequency.value = frequency;
            
            // Create gain node for this note's envelope
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0;
            
            // Connect oscillator to gain node to master output
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Create amplitude envelope
            const attackTime = 0.01;
            const decayTime = 0.1;
            const sustainLevel = 0.7;
            const releaseTime = 0.5;
            
            // Attack
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(1, startTime + attackTime);
            
            // Decay to sustain
            gainNode.gain.linearRampToValueAtTime(
                sustainLevel, 
                startTime + attackTime + decayTime
            );
            
            // Release
            const releaseStart = Math.max(startTime + attackTime + decayTime, endTime - releaseTime);
            gainNode.gain.linearRampToValueAtTime(0, endTime);
            
            // Start and stop oscillator
            oscillator.start(startTime);
            oscillator.stop(endTime);
            
            // Resolve promise when note is done
            setTimeout(() => {
                resolve();
            }, (endTime - this.audioContext.currentTime) * 1000);
        });
    }
    
    /**
     * Generate a table of note frequencies
     * @private
     * @returns {Object} - Map of note names to frequencies
     */
    _generateNoteFrequencies() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const frequencies = {};
        
        // A4 is 440Hz
        frequencies['A4'] = 440;
        
        // Generate octaves 0-8
        for (let octave = 0; octave <= 8; octave++) {
            for (let i = 0; i < notes.length; i++) {
                const note = notes[i] + octave;
                
                // Calculate frequency relative to A4
                const semitonesFromA4 = (octave - 4) * 12 + (i - 9);
                frequencies[note] = 440 * Math.pow(2, semitonesFromA4 / 12);
            }
        }
        
        // Add alternative names (flats)
        frequencies['Bb0'] = frequencies['A#0'];
        frequencies['Db1'] = frequencies['C#1'];
        frequencies['Eb1'] = frequencies['D#1'];
        frequencies['Gb1'] = frequencies['F#1'];
        frequencies['Ab1'] = frequencies['G#1'];
        frequencies['Bb1'] = frequencies['A#1'];
        // ... repeat for other octaves
        
        return frequencies;
    }
    
    /**
     * Get the frequency of a note
     * @private
     * @param {string} note - Note name with octave
     * @returns {number} - Frequency in Hz
     */
    _getNoteFrequency(note) {
        const frequency = this.noteFrequencies[note];
        
        if (!frequency) {
            console.warn(`Note ${note} not found in frequency table`);
            return 440; // Default to A4
        }
        
        return frequency;
    }
    
    /**
     * Calculate a note by adding semitones to a base note
     * @private
     * @param {string} baseNote - Starting note with octave
     * @param {number} semitones - Number of semitones to add
     * @returns {string} - Resulting note with octave
     */
    _calculateNote(baseNote, semitones) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Extract note and octave
        const notePart = baseNote.slice(0, -1);
        const octave = parseInt(baseNote.slice(-1));
        
        // Find index of base note
        let noteIndex = notes.indexOf(notePart);
        if (noteIndex === -1) {
            // Handle flats
            if (notePart === 'Db') noteIndex = notes.indexOf('C#');
            else if (notePart === 'Eb') noteIndex = notes.indexOf('D#');
            else if (notePart === 'Gb') noteIndex = notes.indexOf('F#');
            else if (notePart === 'Ab') noteIndex = notes.indexOf('G#');
            else if (notePart === 'Bb') noteIndex = notes.indexOf('A#');
            else {
                console.warn(`Unknown note: ${notePart}`);
                return baseNote;
            }
        }
        
        // Calculate new note index and octave
        let newIndex = (noteIndex + semitones) % 12;
        let newOctave = octave + Math.floor((noteIndex + semitones) / 12);
        
        // Handle negative semitones
        if (semitones < 0 && newIndex < 0) {
            newIndex += 12;
            newOctave--;
        }
        
        return notes[newIndex] + newOctave;
    }
    
    /**
     * Get a note with a specific octave
     * @private
     * @param {string} note - Note name without octave
     * @param {number} octave - Octave number
     * @returns {string} - Note with octave
     */
    _getNoteWithOctave(note, octave) {
        // Clean up the note name
        let cleanNote = note.replace(/\d/g, ''); // Remove any existing octave
        
        // Handle special cases
        if (cleanNote.length > 2) {
            // Handle note names like "Gbm" -> extract "Gb"
            cleanNote = cleanNote.substring(0, 2);
        }
        
        return cleanNote + octave;
    }
    
    /**
     * Ensure audio context is running
     * @private
     * @returns {Promise} - Resolves when audio context is running
     */
    async _resumeAudioContext() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        return Promise.resolve();
    }
    
    /**
     * Preload commonly used samples (not implemented in this version)
     * @private
     * @returns {Promise} - Resolves when samples are loaded
     */
    async _preloadCommonSamples() {
        // In a more advanced implementation, this would load
        // actual guitar samples for more realistic sound
        return Promise.resolve();
    }
}

// Export the class
export default AudioEngine;