/**
 * GuitarMuse OpenAI Service
 * Handles all interactions with the OpenAI API
 */

class OpenAIService {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4';
    }

    /**
     * Set the API key
     * @param {string} apiKey - OpenAI API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Generate a chord progression based on parameters
     * @param {Object} params - Parameters for chord generation
     * @returns {Promise<Object>} - Generated chord progression
     */
    async generateChordProgression(params) {
        if (!this.apiKey) {
            throw new Error('API key is required. Please set it using setApiKey() method.');
        }

        const prompt = this._buildProgressionPrompt(params);
        
        try {
            const response = await this._callAPI(prompt);
            return this._parseProgressionResponse(response);
        } catch (error) {
            console.error('Error generating chord progression:', error);
            throw error;
        }
    }

    /**
     * Chat with the AI about music and chord progressions
     * @param {string} message - User's message
     * @param {Array} history - Chat history
     * @returns {Promise<string>} - AI's response
     */
    async chatWithAI(message, history = []) {
        if (!this.apiKey) {
            throw new Error('API key is required. Please set it using setApiKey() method.');
        }

        const prompt = this._buildChatPrompt(message, history);
        
        try {
            const response = await this._callAPI(prompt);
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error chatting with AI:', error);
            throw error;
        }
    }

    /**
     * Generate detailed descriptions or explanations for chords
     * @param {string} chordName - Name of the chord to explain
     * @returns {Promise<Object>} - Chord information and usage
     */
    async explainChord(chordName) {
        if (!this.apiKey) {
            throw new Error('API key is required. Please set it using setApiKey() method.');
        }

        const prompt = this._buildChordExplanationPrompt(chordName);
        
        try {
            const response = await this._callAPI(prompt);
            return this._parseChordExplanationResponse(response);
        } catch (error) {
            console.error('Error explaining chord:', error);
            throw error;
        }
    }

    /**
     * Make the actual API call to OpenAI
     * @private
     * @param {Array} messages - Array of message objects for the API
     * @returns {Promise<Object>} - API response
     */
    async _callAPI(messages) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Unknown API error');
        }

        return await response.json();
    }

    /**
     * Build the prompt for chord progression generation
     * @private
     * @param {Object} params - User parameters
     * @returns {Array} - Formatted messages for the API
     */
    _buildProgressionPrompt(params) {
        const systemPrompt = `You are GuitarMuse AI, an expert in music theory and guitar chord progressions. 
Create guitar chord progressions based on the given parameters. For each chord, provide:
1. The chord name (e.g., "Gmaj7")
2. A text-based chord diagram showing finger positions
3. Musical function in the progression
4. Alternative voicings if applicable

Format your response as JSON with this structure:
{
  "progression": [
    {
      "name": "Chord name",
      "diagram": "ASCII chord diagram",
      "function": "Musical function",
      "alternatives": ["Alt1", "Alt2"]
    }
  ],
  "description": "Brief description of the progression",
  "playingTips": "Tips for playing"
}`;

        const userPrompt = `Create a ${params.complexity || 5}/11 complexity chord progression with these parameters:
- Genre: ${params.genre || 'rock'}
- Mood/Vibe: ${params.vibe || 'energetic'}
- Key: ${params.key || 'A'}
- Length: ${params.length || 4} chords
${params.artist ? `- Similar to artist: ${params.artist}` : ''}
${params.customInstructions ? `- Additional instructions: ${params.customInstructions}` : ''}

Please provide the JSON response with no additional text.`;

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    }

    /**
     * Parse the API response for chord progressions
     * @private
     * @param {Object} response - Raw API response
     * @returns {Object} - Structured chord progression data
     */
    _parseProgressionResponse(response) {
        try {
            const content = response.choices[0].message.content;
            
            // Extract JSON from response (sometimes GPT adds extra text)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
            }
            
            const progression = JSON.parse(jsonMatch[0]);
            
            // Validate the response structure
            if (!progression.progression || !Array.isArray(progression.progression)) {
                throw new Error('Invalid progression format');
            }
            
            return progression;
        } catch (error) {
            console.error('Error parsing progression response:', error);
            console.log('Raw response:', response.choices[0].message.content);
            
            // Fallback to returning the raw text
            return {
                error: true,
                message: 'Failed to parse response',
                rawResponse: response.choices[0].message.content
            };
        }
    }

    /**
     * Build the prompt for chat interactions
     * @private
     * @param {string} message - User message
     * @param {Array} history - Chat history
     * @returns {Array} - Formatted messages for the API
     */
    _buildChatPrompt(message, history) {
        const systemPrompt = `You are GuitarMuse AI, a friendly and knowledgeable assistant for guitarists.
You have expertise in:
- Music theory and chord progressions
- Guitar techniques and playing styles
- Different music genres and their characteristics
- Famous guitarists and their styles

Your personality is:
- Encouraging and supportive of all skill levels
- Occasionally uses guitarist humor and lingo
- Provides specific, actionable advice
- Explains complex concepts in simple terms

Keep responses concise and focused on helping the guitarist create music.`;

        // Format history into message array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        
        // Add chat history
        for (const entry of history) {
            messages.push({ role: entry.role, content: entry.content });
        }
        
        // Add current message
        messages.push({ role: 'user', content: message });
        
        return messages;
    }

    /**
     * Build the prompt for chord explanations
     * @private
     * @param {string} chordName - Name of chord to explain
     * @returns {Array} - Formatted messages for the API
     */
    _buildChordExplanationPrompt(chordName) {
        const systemPrompt = `You are GuitarMuse AI, an expert in music theory and guitar chords.
Provide detailed explanations of guitar chords, including:
1. The music theory behind the chord (notes, intervals, construction)
2. Common voicings and finger positions on guitar
3. Musical contexts where the chord is commonly used
4. Similar or related chords that are often paired with it
5. Famous songs that use this chord in a prominent way

Format your response as JSON with this structure:
{
  "name": "Full chord name",
  "notes": ["Note1", "Note2", "Note3"],
  "intervals": "Description of intervals",
  "construction": "How the chord is built",
  "voicings": [
    {
      "position": "Position name",
      "diagram": "ASCII chord diagram",
      "difficulty": "Beginner/Intermediate/Advanced"
    }
  ],
  "musicalContext": "When and how to use this chord",
  "relatedChords": ["Chord1", "Chord2"],
  "exampleSongs": ["Song1 by Artist1", "Song2 by Artist2"]
}`;

        const userPrompt = `Explain the ${chordName} chord in detail. Provide the JSON response with no additional text.`;

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    }

    /**
     * Parse the API response for chord explanations
     * @private
     * @param {Object} response - Raw API response
     * @returns {Object} - Structured chord explanation data
     */
    _parseChordExplanationResponse(response) {
        try {
            const content = response.choices[0].message.content;
            
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
            }
            
            const explanation = JSON.parse(jsonMatch[0]);
            
            // Validate the response structure
            if (!explanation.name || !explanation.voicings) {
                throw new Error('Invalid explanation format');
            }
            
            return explanation;
        } catch (error) {
            console.error('Error parsing chord explanation:', error);
            
            // Fallback to returning the raw text
            return {
                error: true,
                message: 'Failed to parse response',
                rawResponse: response.choices[0].message.content
            };
        }
    }
}

// Export the class
export default OpenAIService;
