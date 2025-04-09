/**
 * GuitarMuse Songbook Manager
 * Handles saving, loading, and exporting chord progressions
 */

class SongbookManager {
    constructor() {
        this.progressions = [];
        this.loadFromStorage();
    }

    /**
     * Load saved progressions from localStorage
     */
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('guitarmuseProgressions');
            if (savedData) {
                this.progressions = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading progressions from storage:', error);
            this.progressions = [];
        }
    }

    /**
     * Save progressions to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('guitarmuseProgressions', JSON.stringify(this.progressions));
        } catch (error) {
            console.error('Error saving progressions to storage:', error);
        }
    }

    /**
     * Add a new progression to the songbook
     * @param {Object} progression - The progression object to save
     * @returns {string} - The ID of the saved progression
     */
    saveProgression(progression) {
        // Create a new progression object with metadata
        const newProgression = {
            id: this._generateId(),
            name: progression.name || 'Untitled Progression',
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            tags: progression.tags || [],
            notes: progression.notes || '',
            chords: progression.chords || [],
            settings: {
                genre: progression.genre || 'rock',
                vibe: progression.vibe || 'energetic',
                artist: progression.artist || '',
                complexity: progression.complexity || 5,
                key: progression.key || 'A',
                bpm: progression.bpm || 120
            }
        };

        this.progressions.push(newProgression);
        this.saveToStorage();
        return newProgression.id;
    }

    /**
     * Update an existing progression
     * @param {string} id - The ID of the progression to update
     * @param {Object} updates - The updated progression data
     * @returns {boolean} - Success status
     */
    updateProgression(id, updates) {
        const index = this.progressions.findIndex(prog => prog.id === id);
        if (index === -1) return false;

        // Update the progression
        const updatedProgression = {
            ...this.progressions[index],
            ...updates,
            dateModified: new Date().toISOString()
        };

        this.progressions[index] = updatedProgression;
        this.saveToStorage();
        return true;
    }

    /**
     * Delete a progression from the songbook
     * @param {string} id - The ID of the progression to delete
     * @returns {boolean} - Success status
     */
    deleteProgression(id) {
        const initialLength = this.progressions.length;
        this.progressions = this.progressions.filter(prog => prog.id !== id);
        
        if (this.progressions.length < initialLength) {
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Get all progressions in the songbook
     * @returns {Array} - Array of progression objects
     */
    getAllProgressions() {
        return [...this.progressions];
    }

    /**
     * Get a specific progression by ID
     * @param {string} id - The ID of the progression to retrieve
     * @returns {Object|null} - The progression object or null if not found
     */
    getProgressionById(id) {
        return this.progressions.find(prog => prog.id === id) || null;
    }

    /**
     * Search progressions by name, tags, or notes
     * @param {string} query - The search term
     * @returns {Array} - Array of matching progression objects
     */
    searchProgressions(query) {
        if (!query) return this.getAllProgressions();
        
        const searchTerm = query.toLowerCase();
        return this.progressions.filter(prog => {
            return prog.name.toLowerCase().includes(searchTerm) ||
                prog.notes.toLowerCase().includes(searchTerm) ||
                prog.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * Generate a guitar tab sheet for a progression
     * @param {string} id - The ID of the progression to export
     * @returns {string} - HTML representation of the tab sheet
     */
    generateTabSheet(id) {
        const progression = this.getProgressionById(id);
        if (!progression) return null;
        
        // Build HTML tab sheet
        let tabHtml = `
            <div class="tab-sheet">
                <h2>${progression.name}</h2>
                <div class="tab-metadata">
                    <p>Key: ${progression.settings.key} | Tempo: ${progression.settings.bpm} BPM</p>
                    <p>Genre: ${progression.settings.genre} | Vibe: ${progression.settings.vibe}</p>
                    ${progression.settings.artist ? `<p>Inspired by: ${progression.settings.artist}</p>` : ''}
                </div>
                <div class="tab-notes">
                    ${progression.notes ? `<p class="notes">${progression.notes}</p>` : ''}
                </div>
                <div class="chord-diagrams">`;
        
        // Add chord diagrams
        progression.chords.forEach(chord => {
            tabHtml += `
                <div class="chord-container">
                    <div class="chord-name">${chord.name}</div>
                    <pre class="chord-diagram">${chord.diagram}</pre>
                </div>`;
        });
        
        tabHtml += `
                </div>
                <div class="progression-sequence">
                    <h3>Progression</h3>
                    <div class="sequence">
                        ${progression.chords.map(chord => chord.name).join(' - ')}
                    </div>
                </div>
                <div class="footer">
                    <p>Created with GuitarMuse AI on ${new Date(progression.dateCreated).toLocaleDateString()}</p>
                </div>
            </div>
        `;
        
        return tabHtml;
    }

    /**
     * Export a tab sheet as a downloadable file
     * @param {string} id - The ID of the progression to export
     * @param {string} format - The export format (pdf, png)
     */
    exportTabSheet(id, format = 'pdf') {
        // This would use libraries like html2canvas and jsPDF
        // Implementation placeholder - would require external libraries
        console.log(`Exporting progression ${id} as ${format}`);
        
        // In real implementation:
        // 1. Generate tab sheet HTML
        // 2. Convert to desired format
        // 3. Trigger download
    }

    /**
     * Generate a unique ID for new progressions
     * @private
     * @returns {string} - A unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}

// Export the class
export default SongbookManager;
