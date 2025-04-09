/**
 * GuitarMuse UI Controller
 * Handles all UI interactions and updates
 */

class UIController {
    /**
     * Initialize the UI controller
     * @param {AudioEngine} audioEngine - The audio engine instance
     * @param {SongbookManager} songbookManager - The songbook manager instance
     * @param {ChordGenerator} chordGenerator - The chord generator instance
     */
    constructor(audioEngine, songbookManager, chordGenerator) {
        this.audioEngine = audioEngine;
        this.songbookManager = songbookManager;
        this.chordGenerator = chordGenerator;
        
        // Current state
        this.currentProgression = null;
        this.currentComplexity = 5;
        this.currentKey = 'A';
        this.currentLength = 4;
        this.tempo = 120;
        this.selectedProgressionId = null;
        
        // Flag for using mocked AI responses
        this.useMockedAI = false;
    }
    
    /**
     * Set whether to use mocked AI responses
     * @param {boolean} useMocked - Whether to use mocked responses
     */
    setMockedAI(useMocked) {
        this.useMockedAI = useMocked;
    }
    
    /**
     * Generate a new chord progression
     */
    async generateProgression() {
        // Show loading state
        this._showLoading(true);
        
        try {
            // Get parameters from UI
            const params = this._getGeneratorParams();
            
            // Generate progression
            let progression;
            
            if (this.useMockedAI) {
                progression = this._getMockedProgression(params);
            } else {
                progression = await this.chordGenerator.generateProgression(params);
            }
            
            // Store current progression
            this.currentProgression = progression;
            
            // Update UI with progression
            this._displayProgression(progression);
            
            // Add AI message about the progression
            this._addAIMessage(this._generateProgressionMessage(progression, params));
        } catch (error) {
            console.error('Error generating progression:', error);
            this._addAIMessage('Sorry, I encountered an error generating your progression. Please try again.');
        } finally {
            // Hide loading state
            this._showLoading(false);
        }
    }
    
    /**
     * Send a chat message to the AI
     * @param {string} message - The message to send
     */
    async sendChat(message) {
        // Add user message to chat
        this._addUserMessage(message);
        
        // Show typing indicator
        this._showTypingIndicator(true);
        
        try {
            let response;
            
            if (this.useMockedAI) {
                response = this._getMockedChatResponse(message);
                // Add some delay to simulate AI thinking
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                response = await this.chordGenerator.chat(message);
            }
            
            // Add AI response to chat
            this._addAIMessage(response);
            
            // If message contains certain keywords, update the progression
            if (this._shouldUpdateProgression(message)) {
                this.generateProgression();
            }
        } catch (error) {
            console.error('Error in chat:', error);
            this._addAIMessage('Sorry, I encountered an error processing your message. Please try again.');
        } finally {
            // Hide typing indicator
            this._showTypingIndicator(false);
        }
    }
    
    /**
     * Play the current chord progression
     */
    playProgression() {
        if (!this.currentProgression) {
            console.warn('No progression to play');
            return;
        }
        
        // Highlight each chord in sequence
        const chordCards = document.querySelectorAll('.chord-card');
        let index = 0;
        
        // Reset all highlights
        chordCards.forEach(card => card.style.backgroundColor = '');
        
        // Define beat duration based on tempo
        const beatDuration = 60 / this.tempo; // seconds per beat
        const chordDuration = beatDuration * 4; // 4 beats per chord
        
        // Play the progression
        this.audioEngine.playProgression(this.currentProgression.chords, this.tempo);
        
        // Highlight chords in sequence
        const interval = setInterval(() => {
            if (index >= chordCards.length) {
                clearInterval(interval);
                // Reset all highlights
                chordCards.forEach(card => card.style.backgroundColor = '');
                return;
            }
            
            // Highlight current chord
            chordCards.forEach(card => card.style.backgroundColor = '');
            chordCards[index].style.backgroundColor = '#3a506b';
            
            index++;
        }, chordDuration * 1000);
    }
    
    /**
     * Play arpeggios of the current chord progression
     */
    playArpeggios() {
        if (!this.currentProgression) {
            console.warn('No progression to play');
            return;
        }
        
        // Highlight each chord in sequence
        const chordCards = document.querySelectorAll('.chord-card');
        let index = 0;
        
        // Reset all highlights
        chordCards.forEach(card => card.style.backgroundColor = '');
        
        // Define note spacing based on tempo
        const beatDuration = 60 / this.tempo; // seconds per beat
        const noteSpacing = beatDuration / 2; // 2 notes per beat
        const chordDuration = noteSpacing * 6; // 6 notes per chord (assuming 6 strings)
        
        // Play arpeggios
        const chords = this.currentProgression.chords;
        let delay = 0;
        
        chords.forEach((chord, i) => {
            setTimeout(() => {
                // Highlight current chord
                chordCards.forEach(card => card.style.backgroundColor = '');
                chordCards[i].style.backgroundColor = '#3a506b';
                
                // Play arpeggio
                this.audioEngine.playArpeggio(chord, noteSpacing);
            }, delay * 1000);
            
            delay += chordDuration;
        });
        
        // Reset highlights after all chords have played
        setTimeout(() => {
            chordCards.forEach(card => card.style.backgroundColor = '');
        }, delay * 1000);
    }
    
    /**
     * Set the complexity level
     * @param {number} complexity - The complexity level (1-11)
     */
    setComplexity(complexity) {
        this.currentComplexity = complexity;
    }
    
    /**
     * Set the key
     * @param {string} key - The key (e.g., 'A', 'C#')
     */
    setKey(key) {
        this.currentKey = key;
    }
    
    /**
     * Set the progression length
     * @param {number} length - The number of chords
     */
    setProgressionLength(length) {
        this.currentLength = length;
    }
    
    /**
     * Set the tempo
     * @param {number} bpm - The tempo in beats per minute
     */
    setTempo(bpm) {
        this.tempo = bpm;
        this.audioEngine.setTempo(bpm);
    }
    
    /**
     * Save the current progression to the songbook
     */
    saveCurrentProgression() {
        if (!this.currentProgression) {
            alert('No progression to save. Generate a progression first!');
            return;
        }
        
        // Get progression name from input
        const nameInput = document.getElementById('progression-name');
        const name = nameInput.value.trim() || 'Untitled Progression';
        
        // Get current parameters
        const params = this._getGeneratorParams();
        
        // Create progression object
        const progressionToSave = {
            name: name,
            chords: this.currentProgression.chords,
            notes: this.currentProgression.description || '',
            genre: params.genre,
            vibe: params.vibe,
            artist: params.artist,
            complexity: params.complexity,
            key: params.key,
            bpm: this.tempo
        };
        
        // Save to songbook
        const id = this.songbookManager.saveProgression(progressionToSave);
        
        // Show confirmation
        alert(`Progression "${name}" saved to your songbook!`);
        
        // Clear name input
        nameInput.value = '';
        
        // Refresh songbook list
        this.refreshSongbookList();
        
        // Switch to songbook tab if not already there
        document.querySelector('[data-tab="songbook"]').click();
        
        // Select the newly saved progression
        this.loadProgressionDetails(id);
    }
    
    /**
     * Refresh the songbook list
     */
    refreshSongbookList() {
        const progressionList = document.getElementById('progression-list');
        if (!progressionList) return;
        
        // Get all progressions
        const progressions = this.songbookManager.getAllProgressions();
        
        // Clear the list
        progressionList.innerHTML = '';
        
        // Add each progression to the list
        progressions.forEach(prog => {
            const item = document.createElement('div');
            item.className = 'progression-item';
            item.setAttribute('data-id', prog.id);
            
            // Add selected class if this is the selected progression
            if (prog.id === this.selectedProgressionId) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="prog-name">${prog.name}</div>
                <div class="prog-details">Key: ${prog.settings.key} | BPM: ${prog.settings.bpm}</div>
                <div class="prog-date">${new Date(prog.dateCreated).toLocaleDateString()}</div>
            `;
            
            progressionList.appendChild(item);
        });
        
        // Show message if no progressions
        if (progressions.length === 0) {
            progressionList.innerHTML = '<div class="no-items">No saved progressions yet</div>';
        }
    }
    
    /**
     * Load progression details into the songbook view
     * @param {string} id - The progression ID
     */
    loadProgressionDetails(id) {
        // Get progression from songbook
        const progression = this.songbookManager.getProgressionById(id);
        if (!progression) {
            console.warn(`Progression with ID ${id} not found`);
            return;
        }
        
        // Store selected progression ID
        this.selectedProgressionId = id;
        
        // Update progression items in list
        document.querySelectorAll('.progression-item').forEach(item => {
            if (item.getAttribute('data-id') === id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update detail view
        document.getElementById('detail-title').textContent = progression.name;
        
        // Update metadata
        const metadataContainer = document.querySelector('.progression-metadata');
        metadataContainer.innerHTML = `
            <span>Key: ${progression.settings.key}</span>
            <span>BPM: ${progression.settings.bpm}</span>
            <span>Created: ${new Date(progression.dateCreated).toLocaleDateString()}</span>
        `;
        
        // Update tags
        const tagsContainer = document.querySelector('.progression-tags');
        tagsContainer.innerHTML = '';
        
        progression.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
        });
        
        // Add tag button
        const addTagButton = document.createElement('button');
        addTagButton.className = 'add-tag-button';
        addTagButton.textContent = '+ Add Tag';
        addTagButton.addEventListener('click', () => this._addTagToProgression(id));
        tagsContainer.appendChild(addTagButton);
        
        // Update notes
        document.getElementById('progression-notes').value = progression.notes;
        
        // Update chord display
        const chordDisplay = document.getElementById('detail-chord-display');
        chordDisplay.innerHTML = '';
        
        progression.chords.forEach(chord => {
            const chordCard = document.createElement('div');
            chordCard.className = 'chord-card';
            
            chordCard.innerHTML = `
                <div class="chord-name">${chord.name}</div>
                <div class="chord-diagram">${chord.diagram}</div>
                <div class="chord-controls">
                    <button class="play-button">▶</button>
                    <button class="play-button">♫</button>
                </div>
            `;
            
            // Add event listeners to play buttons
            const playButtons = chordCard.querySelectorAll('.play-button');
            playButtons[0].addEventListener('click', () => this.audioEngine.playChord(chord));
            playButtons[1].addEventListener('click', () => this.audioEngine.playArpeggio(chord));
            
            chordDisplay.appendChild(chordCard);
        });
    }
    
    /**
     * Search the songbook
     * @param {string} query - The search query
     */
    searchSongbook(query) {
        // Search for progressions
        const results = this.songbookManager.searchProgressions(query);
        
        // Update the progression list
        const progressionList = document.getElementById('progression-list');
        progressionList.innerHTML = '';
        
        results.forEach(prog => {
            const item = document.createElement('div');
            item.className = 'progression-item';
            item.setAttribute('data-id', prog.id);
            
            // Add selected class if this is the selected progression
            if (prog.id === this.selectedProgressionId) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="prog-name">${prog.name}</div>
                <div class="prog-details">Key: ${prog.settings.key} | BPM: ${prog.settings.bpm}</div>
                <div class="prog-date">${new Date(prog.dateCreated).toLocaleDateString()}</div>
            `;
            
            progressionList.appendChild(item);
        });
        
        // Show message if no results
        if (results.length === 0) {
            progressionList.innerHTML = '<div class="no-items">No matching progressions</div>';
        }
    }
    
    /**
     * Edit the selected progression
     */
    editSelectedProgression() {
        if (!this.selectedProgressionId) {
            alert('No progression selected');
            return;
        }
        
        // Get progression from songbook
        const progression = this.songbookManager.getProgressionById(this.selectedProgressionId);
        
        // Load progression into scratchpad
        this.currentProgression = {
            chords: progression.chords,
            description: progression.notes
        };
        
        // Update UI with progression
        this._displayProgression({
            progression: progression.chords,
            description: progression.notes
        });
        
        // Switch to scratchpad tab
        document.querySelector('[data-tab="scratchpad"]').click();
        
        // Update progression name input
        document.getElementById('progression-name').value = progression.name;
        
        // Update settings
        document.getElementById('genre').value = progression.settings.genre;
        document.getElementById('vibe').value = progression.settings.vibe;
        document.getElementById('artist-input').value = progression.settings.artist;
        document.getElementById('chord-complexity').value = progression.settings.complexity;
        document.getElementById('key-center').value = this._getKeyIndex(progression.settings.key);
        document.getElementById('tempo').value = progression.settings.bpm;
        
        // Update displayed values
        document.getElementById('chord-complexity').nextElementSibling.textContent = progression.settings.complexity;
        document.getElementById('key-center').nextElementSibling.textContent = progression.settings.key;
        document.getElementById('tempo-value').textContent = `${progression.settings.bpm} BPM`;
        
        // Update complexity description
        const complexityDescriptions = [
            "\"Campfire Hero\" - Three chords and the truth",
            "\"Open Mic Night\" - Simple but effective",
            "\"Cover Band Ready\" - Familiar progressions that work",
            "\"Songwriter's Toolkit\" - Classic progressions with a twist",
            "\"The Nashville Number System\" - Standard progressions with a touch of color",
            "\"Jazz Club Curious\" - Venturing into 7ths territory",
            "\"Music School Dropout\" - Theory knowledge without the student debt",
            "\"Berklee Freshman\" - Extended chords that impress your teacher",
            "\"Studio Cat\" - Complex changes that session players love",
            "\"Modal Mixologist\" - Borrowing chords from parallel universes",
            "\"THIS ONE GOES TO ELEVEN\" - Prog rock madness that requires six fingers"
        ];
        
        document.getElementById('complexity-description').textContent = 
            complexityDescriptions[progression.settings.complexity - 1];
    }
    
    /**
     * Play the selected progression
     */
    playSelectedProgression() {
        if (!this.selectedProgressionId) {
            alert('No progression selected');
            return;
        }
        
        // Get progression from songbook
        const progression = this.songbookManager.getProgressionById(this.selectedProgressionId);
        
        // Set tempo
        this.tempo = progression.settings.bpm;
        
        // Play the progression
        this.audioEngine.playProgression(progression.chords, this.tempo);
        
        // Highlight chords in sequence
        const chordCards = document.querySelectorAll('#detail-chord-display .chord-card');
        let index = 0;
        
        // Reset all highlights
        chordCards.forEach(card => card.style.backgroundColor = '');
        
        // Define beat duration based on tempo
        const beatDuration = 60 / this.tempo; // seconds per beat
        const chordDuration = beatDuration * 4; // 4 beats per chord
        
        const interval = setInterval(() => {
            if (index >= chordCards.length) {
                clearInterval(interval);
                // Reset all highlights
                chordCards.forEach(card => card.style.backgroundColor = '');
                return;
            }
            
            // Highlight current chord
            chordCards.forEach(card => card.style.backgroundColor = '');
            chordCards[index].style.backgroundColor = '#3a506b';
            
            index++;
        }, chordDuration * 1000);
    }
    
    /**
     * Delete the selected progression
     */
    deleteSelectedProgression() {
        if (!this.selectedProgressionId) {
            alert('No progression selected');
            return;
        }
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this progression?')) {
            return;
        }
        
        // Delete progression
        this.songbookManager.deleteProgression(this.selectedProgressionId);
        
        // Clear selected progression
        this.selectedProgressionId = null;
        
        // Refresh songbook list
        this.refreshSongbookList();
        
        // Clear detail view
        document.getElementById('detail-title').textContent = 'No Progression Selected';
        document.querySelector('.progression-metadata').innerHTML = '';
        document.querySelector('.progression-tags').innerHTML = '';
        document.getElementById('progression-notes').value = '';
        document.getElementById('detail-chord-display').innerHTML = '';
    }
    
    /**
     * Generate a tab sheet for the selected progression
     * @returns {string} HTML representation of the tab sheet
     */
    generateTabSheet() {
        if (!this.selectedProgressionId) {
            alert('No progression selected');
            return null;
        }
        
        return this.songbookManager.generateTabSheet(this.selectedProgressionId);
    }
    
    /**
     * Export a tab sheet
     * @param {string} format - The export format (pdf, png, print)
     */
    exportTabSheet(format) {
        if (!this.selectedProgressionId) {
            alert('No progression selected');
            return;
        }
        
        // This would be implemented with actual export libraries
        console.log(`Exporting progression ${