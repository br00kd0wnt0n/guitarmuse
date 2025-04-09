/**
 * GuitarMuse Chord Generator
 * Handles the generation of chord progressions
 * using the OpenAI service
 */

class ChordGenerator {
    /**
     * Initialize the chord generator
     * @param {OpenAIService} openAIService - The OpenAI service instance
     */
    constructor(openAIService) {
        this.openAIService = openAIService;
        this.chatHistory = [];
    }
    
    /**
     * Generate a chord progression based on parameters
     * @param {Object} params - Parameters for chord generation
     * @returns {Promise<Object>} - Generated chord progression
     */
    async generateProgression(params) {
        try {
            const progression = await this.openAIService.generateChordProgression(params);
            return progression;
        } catch (error) {
            console.error('Error in chord generator:', error);
            throw error;
        }
    }
    
    /**
     * Chat with the AI about music and chord progressions
     * @param {string} message - The user's message
     * @returns {Promise<string>} - AI's response
     */
    async chat(message) {
        try {
            // Add user message to history
            this.chatHistory.push({
                role: 'user',
                content: message
            });
            
            // Keep chat history to a reasonable size
            if (this.chatHistory.length > 10) {
                this.chatHistory = this.chatHistory.slice(this.chatHistory.length - 10);
            }
            
            const response = await this.openAIService.chatWithAI(message, this.chatHistory);
            
            // Add AI response to history
            this.chatHistory.push({
                role: 'assistant',
                content: response
            });
            
            return response;
        } catch (error) {
            console.error('Error in chat:', error);
            throw error;
        }
    }
    
    /**
     * Get detailed information about a specific chord
     * @param {string} chordName - The name of the chord
     * @returns {Promise<Object>} - Detailed chord information
     */
    async explainChord(chordName) {
        try {
            return await this.openAIService.explainChord(chordName);
        } catch (error) {
            console.error('Error explaining chord:', error);
            throw error;
        }
    }
    
    /**
     * Clear the chat history
     */
    clearChatHistory() {
        this.chatHistory = [];
    }
}

// Export the class
export default ChordGenerator;