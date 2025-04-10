/**
 * GuitarMuse AI - Main Application Controller
 * 
 * This is the entry point for the application that coordinates
 * all the various components and services.
 */

// Import modules
import AudioEngine from './audio-engine.js';
import SongbookManager from './songbook-manager.js';
import OpenAIService from './openai-service.js';
import UIController from './ui-controller.js';
import ChordGenerator from './chord-generator.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('GuitarMuse AI - Starting up...');
    
    // Get stored API key or prompt for it
    let apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        const apiKeyInput = document.getElementById('api-key');
        apiKeyInput.addEventListener('change', (e) => {
            apiKey = e.target.value;
            localStorage.setItem('openai_api_key', apiKey);
            initializeServices(apiKey);
        });
    } else {
        document.getElementById('api-key').value = apiKey;
        initializeServices(apiKey);
    }
});

function initializeServices(apiKey) {
    // Initialize services
    const audioEngine = new AudioEngine();
    const songbookManager = new SongbookManager();
    const openAIService = new OpenAIService(apiKey);
    const chordGenerator = new ChordGenerator(openAIService);
    
    // Initialize UI controller with references to services
    const uiController = new UIController(
        audioEngine,
        songbookManager,
        chordGenerator
    );
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Setup event listeners for the main UI components
    setupEventListeners(uiController);
    
    // Initialize other components
    initializeComponents(uiController, songbookManager, openAIService);
}

/**
 * Set up the tab navigation system
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Set up event listeners for the main UI components
 * @param {UIController} uiController - The UI controller instance
 */
function setupEventListeners(uiController) {
    // Progression generator controls
    document.getElementById('generate-button').addEventListener('click', () => {
        uiController.generateProgression();
    });
    
    // Playback controls
    document.getElementById('play-all').addEventListener('click', () => {
        uiController.playProgression();
    });
    
    document.getElementById('play-arpeggio').addEventListener('click', () => {
        uiController.playArpeggios();
    });
    
    // Tempo control
    document.getElementById('tempo').addEventListener('input', (e) => {
        const tempo = parseInt(e.target.value);
        document.getElementById('tempo-value').textContent = `${tempo} BPM`;
        uiController.setTempo(tempo);
    });
    
    // Complexity sliders
    setupComplexitySliders(uiController);
    
    // Chat functionality
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage(uiController);
        }
    });
    
    document.getElementById('send-button').addEventListener('click', () => {
        sendChatMessage(uiController);
    });
    
    // Save to songbook
    document.getElementById('save-progression').addEventListener('click', () => {
        uiController.saveCurrentProgression();
    });
    
    // Songbook interactions
    setupSongbookInteractions(uiController);
    
    // Export functionality
    setupExportFunctionality(uiController);
    
    // Easter egg
    document.getElementById('easter-egg').addEventListener('click', () => {
        uiController.activateEasterEgg();
    });
}

/**
 * Set up the complexity sliders
 * @param {UIController} uiController - The UI controller instance
 */
function setupComplexitySliders(uiController) {
    // Complexity descriptions for each level
    const complexityDescriptions = [
        "\"Campfire Hero\" - Three chords and the truth", // 1
        "\"Open Mic Night\" - Simple but effective", // 2
        "\"Cover Band Ready\" - Familiar progressions that work", // 3
        "\"Songwriter's Toolkit\" - Classic progressions with a twist", // 4
        "\"The Nashville Number System\" - Standard progressions with a touch of color", // 5
        "\"Jazz Club Curious\" - Venturing into 7ths territory", // 6
        "\"Music School Dropout\" - Theory knowledge without the student debt", // 7
        "\"Berklee Freshman\" - Extended chords that impress your teacher", // 8
        "\"Studio Cat\" - Complex changes that session players love", // 9
        "\"Modal Mixologist\" - Borrowing chords from parallel universes", // 10
        "\"THIS ONE GOES TO ELEVEN\" - Prog rock madness that requires six fingers" // 11
    ];
    
    // Chord complexity slider
    const complexitySlider = document.getElementById('chord-complexity');
    complexitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        complexitySlider.nextElementSibling.textContent = value;
        
        // Update description
        const description = document.getElementById('complexity-description');
        description.textContent = complexityDescriptions[value - 1];
        
        // Special styling for level 11
        if (value === 11) {
            description.style.color = '#ff0000';
            description.style.fontWeight = 'bold';
        } else {
            description.style.color = '';
            description.style.fontWeight = '';
        }
        
        uiController.setComplexity(value);
    });
    
    // Progression length slider
    const lengthSlider = document.getElementById('progression-length');
    lengthSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        lengthSlider.nextElementSibling.textContent = value;
        uiController.setProgressionLength(value);
    });
    
    // Key center slider
    const keySlider = document.getElementById('key-center');
    keySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const keys = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
        const keyName = keys[value - 1];
        keySlider.nextElementSibling.textContent = keyName;
        uiController.setKey(keyName);
    });
}

/**
 * Set up interactions for the songbook tab
 * @param {UIController} uiController - The UI controller instance
 */
function setupSongbookInteractions(uiController) {
    // Progression list item click
    const progressionList = document.getElementById('progression-list');
    if (progressionList) {
        progressionList.addEventListener('click', (e) => {
            const item = e.target.closest('.progression-item');
            if (item) {
                // Remove active class from all items
                document.querySelectorAll('.progression-item').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Load the progression details
                const progressionId = item.getAttribute('data-id');
                uiController.loadProgressionDetails(progressionId);
            }
        });
    }
    
    // Songbook search
    const searchInput = document.getElementById('songbook-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            uiController.searchSongbook(e.target.value);
        });
    }
    
    // Progression actions
    document.getElementById('edit-progression')?.addEventListener('click', () => {
        uiController.editSelectedProgression();
    });
    
    document.getElementById('play-progression')?.addEventListener('click', () => {
        uiController.playSelectedProgression();
    });
    
    document.getElementById('delete-progression')?.addEventListener('click', () => {
        uiController.deleteSelectedProgression();
    });
    
    document.getElementById('export-tab')?.addEventListener('click', () => {
        showExportModal(uiController);
    });
}

/**
 * Set up export functionality
 * @param {UIController} uiController - The UI controller instance
 */
function setupExportFunctionality(uiController) {
    // Modal controls
    const modal = document.getElementById('export-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Export buttons
    const exportButtons = document.querySelectorAll('.export-button');
    exportButtons.forEach(button => {
        button.addEventListener('click', () => {
            const format = button.getAttribute('data-format');
            uiController.exportTabSheet(format);
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * Show the export modal with tab sheet preview
 * @param {UIController} uiController - The UI controller instance
 */
function showExportModal(uiController) {
    const modal = document.getElementById('export-modal');
    const previewContainer = document.getElementById('tab-preview');
    
    // Generate tab sheet HTML
    const tabSheet = uiController.generateTabSheet();
    if (tabSheet) {
        previewContainer.innerHTML = tabSheet;
        modal.style.display = 'block';
    }
}

/**
 * Send a chat message to the AI
 * @param {UIController} uiController - The UI controller instance
 */
function sendChatMessage(uiController) {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (message) {
        uiController.sendChat(message);
        chatInput.value = '';
    }
}

/**
 * Initialize any components that need setup
 * @param {UIController} uiController - The UI controller instance
 * @param {SongbookManager} songbookManager - The songbook manager instance
 * @param {OpenAIService} openAIService - The OpenAI service instance
 */
function initializeComponents(uiController, songbookManager, openAIService) {
    // Load saved progressions into the songbook list
    uiController.refreshSongbookList();
    
    // Set up artist input with suggestions
    setupArtistInputSuggestions();
    
    // Check for API key in localStorage
    const apiKey = localStorage.getItem('openai_api_key');
    if (apiKey) {
        openAIService.setApiKey(apiKey);
    } else {
        // Prompt for API key or use mockedAI
        uiController.setMockedAI(true);
    }
}

/**
 * Set up the artist input with suggestions
 */
function setupArtistInputSuggestions() {
    const artistInput = document.getElementById('artist-input');
    const suggestionsList = document.getElementById('artist-suggestions');
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    artistInput?.addEventListener('focus', function() {
        suggestionsList.style.display = 'block';
    });
    
    artistInput?.addEventListener('blur', function() {
        // Delay hiding to allow for clicks on suggestions
        setTimeout(() => {
            suggestionsList.style.display = 'none';
        }, 200);
    });
    
    artistInput?.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        
        // Filter suggestions based on input
        suggestionItems.forEach(item => {
            if (item.textContent.toLowerCase().includes(value)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        suggestionsList.style.display = 'block';
    });
    
    suggestionItems.forEach(item => {
        item.addEventListener('click', function() {
            artistInput.value = this.textContent;
            suggestionsList.style.display = 'none';
        });
    });
}

// Export any necessary functions for testing
export {
    setupTabNavigation,
    setupEventListeners,
    setupComplexitySliders,
    setupSongbookInteractions
};
