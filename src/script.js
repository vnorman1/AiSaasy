/**
 * MODULÁRIS AI ASSZISZTENS SAAS
 * Egyetlen script belinkelésével működő intelligens weboldal asszisztens
 * Google Gemini API-val működik
 */

// Importáljuk a Google GenAI klienskönyvtárat
import { GoogleGenerativeAI } from "@google/generative-ai";

// Az import.meta.env használatával elérjük a Vite környezeti változókat
// A dotenv import nem szükséges a böngészőben

class ModularAIAssistant {
    constructor() {
        this.brain = null;
        this.apiKey = null;
        this.isInitialized = false;
        this.widget = null;
        this.chatHistory = [];
        this.siteContent = {};
        this.isDarkMode = this.detectDarkMode();
        
        // Automatikus inicializálás
        this.init();
    }

    detectDarkMode() {
        // Ellenőrzi a rendszer preferenciáját vagy a manuális beállítást
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    updateTheme() {
        // Dinamikus témakezelés
        const root = document.documentElement;
        if (this.isDarkMode) {
            root.classList.add('ai-dark-mode');
        } else {
            root.classList.remove('ai-dark-mode');
        }
    }    async init() {
        try {
            await this.loadBrain();
            this.createWidget();
            this.setupEventListeners();
            
            // API kulcs ellenőrzése
            console.log('🔍 API kulcs ellenőrzése:');
            console.log('  - API kulcs beállítva:', this.apiKey ? 'IGEN' : 'NEM');
            if (this.apiKey) {
                console.log(`  - API kulcs értéke: ${this.apiKey.substring(0, 5)}...${this.apiKey.substring(this.apiKey.length - 5)}`);
            }
            
            if (this.brain.config.features.autoScan) {
                await this.scanWebsite();
            }
            
            this.isInitialized = true;
            console.log('🤖 AI Asszisztens sikeresen inicializálva!');
        } catch (error) {
            console.error('❌ Hiba az inicializálás során:', error);
        }
    }async loadBrain() {
        try {
            // Először próbáljuk betölteni a .env fájlból az API kulcsot
            await this.loadEnvConfig();
            
            const response = await fetch('./brain.json');
            if (!response.ok) {
                throw new Error('Nem sikerült betölteni a brain.json fájlt');
            }
            this.brain = await response.json();
            
            // Ha az API kulcs már betöltődött a .env-ből, akkor azt használjuk
            // Egyébként próbáljuk a brain.json-ból
            if (!this.apiKey && this.brain.config.apiKey) {
                this.apiKey = this.brain.config.apiKey;
                console.log('🔑 API kulcs betöltve a brain.json fájlból');
            }
            
            // Ha még mindig nincs API kulcsunk, de a widget működni fog, csak figyelmeztessünk a konzolon
            if (!this.apiKey) {
                console.warn('⚠️ Nem található API kulcs a .env vagy brain.json fájlban. Az asszisztens korlátozott funkcionalitással működik.');
            }
        } catch (error) {
            console.error('Hiba a brain betöltése során:', error);
            // Alapértelmezett brain létrehozása
            this.createDefaultBrain();
        }
    }    async loadEnvConfig() {
        try {
            // Vite specifikus környezeti változók elérése
            // A .env fájlban definiált VITE_GEMINI_API_KEY változót használjuk
            const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                              import.meta.env.VITE_API_KEY || 
                              import.meta.env.VITE_GOOGLE_API_KEY;
            
            if (envApiKey) {
                console.log('💡 API kulcs sikeresen betöltve környezeti változókból');
                this.apiKey = envApiKey;
                
                // Létrehozzuk a window.env objektumot, ha még nem létezik
                if (!window.env) window.env = {};
                window.env.GEMINI_API_KEY = envApiKey;
            } else {
                console.log('⚠️ Nem található API kulcs a környezeti változókban');
                
                // Próbáljuk a window.env objektumot ellenőrizni (ha az oldal már tartalmazza)
                if (window.env && (window.env.GEMINI_API_KEY || window.env.API_KEY || window.env.GOOGLE_API_KEY)) {
                    this.apiKey = window.env.GEMINI_API_KEY || window.env.API_KEY || window.env.GOOGLE_API_KEY;
                    console.log('💡 API kulcs sikeresen betöltve a window.env objektumból');
                } else {
                    // Megpróbáljuk kibontani a kliens oldalon az API kulcsot a localStorage-ból
                    const savedBrain = localStorage.getItem('aiAssistantBrain');
                    if (savedBrain) {
                        try {
                            const brainData = JSON.parse(savedBrain);
                            if (brainData.config && brainData.config.apiKey) {
                                this.apiKey = brainData.config.apiKey;
                                console.log('🔑 API kulcs helyreállítva a helyi tárolóból');
                            }
                        } catch (e) {
                            console.error('Hiba a tárolt adatok elemzése során:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ Hiba a környezeti változók betöltése során:', error.message);
        }
    }createDefaultBrain() {
        this.brain = {
            version: "1.0.0",
            config: {
                apiKey: "",
                behavior: {
                    personality: "Segítőkész asszisztens vagyok, aki ismeri ezt a weboldalt és segítek a felhasználóknak navigálni.",
                    tone: "barátságos",
                    language: "hu"
                },
                features: {
                    autoScan: true,
                    deepScan: true,
                    cacheResults: true,
                    floatingWidget: true
                }
            },
            siteMap: {
                lastScan: null,
                pages: [],
                structure: {},
                content: {}
            },
            conversations: [],
            analytics: {
                totalQueries: 0,
                popularQuestions: {},
                userSatisfaction: []
            }
        };
        
        // Jelezzük a konzolban, hogy nincs API kulcs
        console.warn('⚠️ Alapértelmezett konfiguráció létrehozva API kulcs nélkül. Az asszisztenshez szükség van egy API kulcsra a .env fájlban.');
    }    promptForAPIKey() {
        // Nem jelenítünk meg felugró ablakot, csak a konzolban jelezzük
        console.warn('⚠️ Hiányzó API kulcs. Kérjük hozz létre egy .env fájlt a következő tartalommal: GEMINI_API_KEY=your_api_key');
        
        // Ha már van api kulcs a localStorage-ban, azt használjuk
        const savedData = localStorage.getItem('aiAssistantBrain');
        if (savedData) {
            try {
                const brain = JSON.parse(savedData);
                if (brain.config && brain.config.apiKey) {
                    this.apiKey = brain.config.apiKey;
                    console.log('🔑 API kulcs helyreállítva a helyi tárolóból');
                }
            } catch (e) {
                console.error('Hiba a tárolt adatok elemzése során:', e);
            }
        }
    }

    async saveBrain() {
        try {
            // Kliens oldalon localStorage-ban tároljuk
            localStorage.setItem('aiAssistantBrain', JSON.stringify(this.brain));
        } catch (error) {
            console.error('Hiba a brain mentése során:', error);
        }
    }

    createWidget() {
        // CSS stílusok inline beépítése - Kompakt Apple-stílusú modern design
        const styles = `
            <style id="ai-assistant-styles">
                .ai-assistant-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
                }
                
                .ai-chat-bubble {
                    width: 56px;
                    height: 56px;
                    background: var(--ai-bubble-bg, rgba(255, 255, 255, 0.95));
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--ai-border-color, rgba(255, 255, 255, 0.2));
                    border-radius: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 20px var(--ai-shadow-color, rgba(0, 0, 0, 0.12)), 0 2px 6px var(--ai-shadow-light, rgba(0, 0, 0, 0.08));
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                }
                
                .ai-chat-bubble::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
                    border-radius: 17px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: -1;
                }
                
                .ai-chat-bubble:hover::before {
                    opacity: 1;
                }
                
                .ai-chat-bubble:hover {
                    transform: scale(1.05) translateY(-2px);
                    box-shadow: 0 10px 32px var(--ai-shadow-hover, rgba(0, 0, 0, 0.15)), 0 4px 12px var(--ai-shadow-light, rgba(0, 0, 0, 0.1));
                }
                
                .ai-chat-bubble:active {
                    transform: scale(0.98);
                }
                
                .ai-chat-bubble svg {
                    width: 24px;
                    height: 24px;
                    fill: var(--ai-icon-color, #007AFF);
                    transition: fill 0.3s ease;
                    z-index: 1;
                }
                
                .ai-chat-bubble:hover svg {
                    fill: white;
                }
                
                .ai-chat-window {
                    position: fixed;
                    bottom: 88px;
                    right: 20px;
                    width: 320px;
                    height: 480px;
                    background: var(--ai-window-bg, rgba(255, 255, 255, 0.95));
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid var(--ai-border-color, rgba(255, 255, 255, 0.2));
                    border-radius: 20px;
                    box-shadow: 0 16px 60px var(--ai-shadow-color, rgba(0, 0, 0, 0.12)), 0 6px 24px var(--ai-shadow-light, rgba(0, 0, 0, 0.08));
                    display: none;
                    flex-direction: column;
                    z-index: 10001;
                    overflow: hidden;
                    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .ai-chat-header {
                    background: transparent;
                    color: var(--ai-text-primary, #1D1D1F);
                    padding: 16px 20px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--ai-divider, rgba(0, 0, 0, 0.06));
                }
                
                .ai-chat-title {
                    font-weight: 600;
                    font-size: 16px;
                    letter-spacing: -0.02em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .ai-chat-status {
                    width: 7px;
                    height: 7px;
                    background: #34C759;
                    border-radius: 50%;
                    animation: pulse-green 2s infinite;
                }
                
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
                }
                
                .ai-chat-close {
                    background: var(--ai-close-bg, rgba(120, 120, 128, 0.16));
                    border: none;
                    color: var(--ai-close-color, #8E8E93);
                    width: 28px;
                    height: 28px;
                    border-radius: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .ai-chat-close:hover {
                    background: var(--ai-close-bg-hover, rgba(120, 120, 128, 0.24));
                    transform: scale(1.05);
                }
                
                .ai-chat-messages {
                    flex: 1;
                    padding: 6px 20px 12px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    scroll-behavior: smooth;
                }
                
                .ai-chat-messages::-webkit-scrollbar {
                    width: 3px;
                }
                
                .ai-chat-messages::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .ai-chat-messages::-webkit-scrollbar-thumb {
                    background: var(--ai-scrollbar, rgba(120, 120, 128, 0.3));
                    border-radius: 2px;
                }
                
                .ai-message {
                    max-width: 85%;
                    padding: 10px 14px;
                    border-radius: 18px;
                    line-height: 1.4;
                    font-size: 14px;
                    font-weight: 400;
                    letter-spacing: -0.01em;
                    position: relative;
                    animation: messageAppear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                @keyframes messageAppear {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .ai-message.user {
                    background: #007AFF;
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
                }
                
                .ai-message.assistant {
                    background: var(--ai-message-bg, rgba(120, 120, 128, 0.12));
                    color: var(--ai-text-primary, #1D1D1F);
                    align-self: flex-start;
                    border-bottom-left-radius: 6px;
                }
                
                .ai-chat-input-container {
                    padding: 12px 20px 20px;
                    border-top: 1px solid var(--ai-divider, rgba(0, 0, 0, 0.06));
                    display: flex;
                    gap: 10px;
                    align-items: flex-end;
                }
                
                .ai-chat-input {
                    flex: 1;
                    padding: 10px 14px;
                    border: 1px solid var(--ai-input-border, rgba(120, 120, 128, 0.2));
                    border-radius: 18px;
                    outline: none;
                    font-size: 14px;
                    font-family: inherit;
                    background: var(--ai-input-bg, rgba(255, 255, 255, 0.8));
                    color: var(--ai-text-primary, #1D1D1F);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    transition: all 0.2s ease;
                    resize: none;
                    min-height: 38px;
                    max-height: 100px;
                }
                
                .ai-chat-input:focus {
                    border-color: #007AFF;
                    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
                    background: var(--ai-input-bg-focus, rgba(255, 255, 255, 0.95));
                }
                
                .ai-chat-input::placeholder {
                    color: var(--ai-placeholder, #8E8E93);
                    font-weight: 400;
                }
                
                .ai-send-button {
                    background: #007AFF;
                    border: none;
                    color: white;
                    width: 38px;
                    height: 38px;
                    border-radius: 19px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);
                    flex-shrink: 0;
                }
                
                .ai-send-button:hover {
                    background: #0056D6;
                    transform: scale(1.05);
                    box-shadow: 0 3px 12px rgba(0, 122, 255, 0.4);
                }
                
                .ai-send-button:active {
                    transform: scale(0.95);
                }
                
                .ai-send-button:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .ai-typing-indicator {
                    display: none;
                    padding: 10px 14px;
                    background: var(--ai-message-bg, rgba(120, 120, 128, 0.12));
                    border-radius: 18px;
                    align-self: flex-start;
                    border-bottom-left-radius: 6px;
                    animation: messageAppear 0.3s ease;
                }
                
                .ai-typing-dots {
                    display: flex;
                    gap: 3px;
                    align-items: center;
                }
                
                .ai-typing-dots span {
                    width: 5px;
                    height: 5px;
                    background: var(--ai-typing-dots, #8E8E93);
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                }
                
                .ai-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .ai-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes typing {
                    0%, 80%, 100% { 
                        transform: scale(0.8); 
                        opacity: 0.5; 
                    }
                    40% { 
                        transform: scale(1); 
                        opacity: 1; 
                    }
                }
                
                .ai-welcome-message {
                    text-align: center;
                    color: var(--ai-text-secondary, #8E8E93);
                    font-size: 14px;
                    font-weight: 400;
                    margin: 30px 0 16px;
                    line-height: 1.4;
                    letter-spacing: -0.01em;
                }
                
                .ai-welcome-emoji {
                    font-size: 20px;
                    margin-bottom: 6px;
                    display: block;
                }
                
                /* CSS Variables for Light Mode */
                :root {
                    --ai-bubble-bg: rgba(255, 255, 255, 0.95);
                    --ai-window-bg: rgba(255, 255, 255, 0.95);
                    --ai-border-color: rgba(255, 255, 255, 0.2);
                    --ai-shadow-color: rgba(0, 0, 0, 0.12);
                    --ai-shadow-light: rgba(0, 0, 0, 0.08);
                    --ai-shadow-hover: rgba(0, 0, 0, 0.15);
                    --ai-text-primary: #1D1D1F;
                    --ai-text-secondary: #8E8E93;
                    --ai-divider: rgba(0, 0, 0, 0.06);
                    --ai-close-bg: rgba(120, 120, 128, 0.16);
                    --ai-close-bg-hover: rgba(120, 120, 128, 0.24);
                    --ai-close-color: #8E8E93;
                    --ai-scrollbar: rgba(120, 120, 128, 0.3);
                    --ai-message-bg: rgba(120, 120, 128, 0.12);
                    --ai-input-bg: rgba(255, 255, 255, 0.8);
                    --ai-input-bg-focus: rgba(255, 255, 255, 0.95);
                    --ai-input-border: rgba(120, 120, 128, 0.2);
                    --ai-placeholder: #8E8E93;
                    --ai-typing-dots: #8E8E93;
                    --ai-icon-color: #007AFF;
                }
                
                /* Dark Mode */
                @media (prefers-color-scheme: dark) {
                    :root {
                        --ai-bubble-bg: rgba(28, 28, 30, 0.95);
                        --ai-window-bg: rgba(28, 28, 30, 0.95);
                        --ai-border-color: rgba(255, 255, 255, 0.1);
                        --ai-shadow-color: rgba(0, 0, 0, 0.25);
                        --ai-shadow-light: rgba(0, 0, 0, 0.15);
                        --ai-shadow-hover: rgba(0, 0, 0, 0.3);
                        --ai-text-primary: #F2F2F7;
                        --ai-text-secondary: rgba(235, 235, 245, 0.6);
                        --ai-divider: rgba(255, 255, 255, 0.1);
                        --ai-close-bg: rgba(255, 255, 255, 0.1);
                        --ai-close-bg-hover: rgba(255, 255, 255, 0.16);
                        --ai-close-color: rgba(235, 235, 245, 0.6);
                        --ai-scrollbar: rgba(255, 255, 255, 0.2);
                        --ai-message-bg: rgba(255, 255, 255, 0.1);
                        --ai-input-bg: rgba(255, 255, 255, 0.1);
                        --ai-input-bg-focus: rgba(255, 255, 255, 0.15);
                        --ai-input-border: rgba(255, 255, 255, 0.2);
                        --ai-placeholder: rgba(235, 235, 245, 0.6);
                        --ai-typing-dots: rgba(235, 235, 245, 0.6);
                        --ai-icon-color: #007AFF;
                    }
                }
                
                /* Manual Dark Mode Class */
                .ai-dark-mode {
                    --ai-bubble-bg: rgba(28, 28, 30, 0.95);
                    --ai-window-bg: rgba(28, 28, 30, 0.95);
                    --ai-border-color: rgba(255, 255, 255, 0.1);
                    --ai-shadow-color: rgba(0, 0, 0, 0.25);
                    --ai-shadow-light: rgba(0, 0, 0, 0.15);
                    --ai-shadow-hover: rgba(0, 0, 0, 0.3);
                    --ai-text-primary: #F2F2F7;
                    --ai-text-secondary: rgba(235, 235, 245, 0.6);
                    --ai-divider: rgba(255, 255, 255, 0.1);
                    --ai-close-bg: rgba(255, 255, 255, 0.1);
                    --ai-close-bg-hover: rgba(255, 255, 255, 0.16);
                    --ai-close-color: rgba(235, 235, 245, 0.6);
                    --ai-scrollbar: rgba(255, 255, 255, 0.2);
                    --ai-message-bg: rgba(255, 255, 255, 0.1);
                    --ai-input-bg: rgba(255, 255, 255, 0.1);
                    --ai-input-bg-focus: rgba(255, 255, 255, 0.15);
                    --ai-input-border: rgba(255, 255, 255, 0.2);
                    --ai-placeholder: rgba(235, 235, 245, 0.6);
                    --ai-typing-dots: rgba(235, 235, 245, 0.6);
                    --ai-icon-color: #007AFF;
                }
                
                /* Reszponzív design */
                @media (max-width: 480px) {
                    .ai-chat-window {
                        width: calc(100vw - 32px);
                        height: calc(100vh - 120px);
                        right: 16px;
                        bottom: 76px;
                        border-radius: 16px;
                    }
                    
                    .ai-assistant-widget {
                        bottom: 16px;
                        right: 16px;
                    }
                    
                    .ai-chat-bubble {
                        width: 52px;
                        height: 52px;
                    }
                }
            </style>
        `;
        
        // Stílusok hozzáadása
        if (!document.getElementById('ai-assistant-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }

        // Widget HTML létrehozása
        const widgetHTML = `
            <div class="ai-assistant-widget" id="ai-assistant-widget">
                <div class="ai-chat-bubble" id="ai-chat-bubble">
                    <svg viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                </div>
                
                <div class="ai-chat-window" id="ai-chat-window">
                    <div class="ai-chat-header">
                        <div class="ai-chat-title">
                            <div class="ai-chat-status"></div>
                            AI Asszisztens
                        </div>
                        <button class="ai-chat-close" id="ai-chat-close">&times;</button>
                    </div>
                    
                    <div class="ai-chat-messages" id="ai-chat-messages">
                        <div class="ai-welcome-message">
                            <span class="ai-welcome-emoji">👋</span>
                            Szia! Segíthetek navigálni ezen a weboldalon. Kérdezz bármit!
                        </div>
                    </div>
                    
                    <div class="ai-typing-indicator" id="ai-typing-indicator">
                        <div class="ai-typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    
                    <div class="ai-chat-input-container">
                        <input type="text" class="ai-chat-input" id="ai-chat-input" 
                               placeholder="Írj egy üzenetet...">
                        <button class="ai-send-button" id="ai-send-button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Widget hozzáadása a DOM-hoz
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        this.widget = {
            bubble: document.getElementById('ai-chat-bubble'),
            window: document.getElementById('ai-chat-window'),
            messages: document.getElementById('ai-chat-messages'),
            input: document.getElementById('ai-chat-input'),
            sendButton: document.getElementById('ai-send-button'),
            closeButton: document.getElementById('ai-chat-close'),
            typingIndicator: document.getElementById('ai-typing-indicator')
        };
    }

    setupEventListeners() {
        // Chat bubble click
        this.widget.bubble.addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Close button click
        this.widget.closeButton.addEventListener('click', () => {
            this.closeChat();
        });
        
        // Send button click
        this.widget.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter key press
        this.widget.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // ESC key to close chat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.widget.window.style.display === 'flex') {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        const isVisible = this.widget.window.style.display === 'flex';
        if (isVisible) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.widget.window.style.display = 'flex';
        this.widget.input.focus();
    }

    closeChat() {
        this.widget.window.style.display = 'none';
    }

    async sendMessage() {
        const message = this.widget.input.value.trim();
        if (!message) return;
        
        // Felhasználói üzenet hozzáadása
        this.addMessage(message, 'user');
        
        // Input mező kiürítése
        this.widget.input.value = '';
        
        // Send button letiltása
        this.widget.sendButton.disabled = true;
        
        // Typing indicator megjelenítése
        this.showTypingIndicator();
          try {
            // AI válasz generálása
            const response = await this.generateResponse(message);
            
            // Typing indicator elrejtése
            this.hideTypingIndicator();
            
            // Navigációs parancsok feldolgozása
            const processedResponse = this.processNavigationCommands(response);
            
            // AI válasz hozzáadása
            this.addMessage(processedResponse, 'assistant');
            
            // Beszélgetés mentése
            this.saveConversation(message, processedResponse);
            
        } catch (error) {
            console.error('Hiba az AI válasz generálása során:', error);
            this.hideTypingIndicator();
            this.addMessage('Sajnos hiba történt. Kérlek próbáld újra!', 'assistant');
        } finally {
            // Send button visszaengedélyezése
            this.widget.sendButton.disabled = false;
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        messageDiv.textContent = content;
        
        this.widget.messages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.widget.messages.scrollTop = this.widget.messages.scrollHeight;
    }

    showTypingIndicator() {
        this.widget.typingIndicator.style.display = 'block';
        this.widget.messages.scrollTop = this.widget.messages.scrollHeight;
    }

    hideTypingIndicator() {
        this.widget.typingIndicator.style.display = 'none';
    }    async generateResponse(userMessage) {
        // Debug: API kulcs ellenőrzése
        console.log('🔑 API kulcs állapota:', this.apiKey ? `Beállítva (eleje: ${this.apiKey.substring(0, 5)}...)` : 'Hiányzik');
        
        if (!this.apiKey) {
            console.error('❌ Hiányzó API kulcs - betöltési hiba');
            return 'Sajnos nem találom az API kulcsot. Ellenőrizd a konzolt további információkért.';
        }

        try {
            // Kontextus összeállítása
            const context = this.buildContext(userMessage);
              // Google GenAI kliens inicializálása
            console.log('📡 Google GenAI kliens inicializálása és kérés küldése');
            const genAI = new GoogleGenerativeAI(this.apiKey);
            
            // Gemini modell kiválasztása
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            // Generációs konfiguráció
            const generationConfig = {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 512
            };
            
            // API kérés küldése a hivatalos klienskönyvtáron keresztül
            const result = await model.generateContent({
                contents: [{ parts: [{ text: context }] }],
                generationConfig: generationConfig
            });
            
            // Válasz feldolgozása
            const response = result.response;
            console.log('✅ API válasz sikeresen feldolgozva');
            
            // Ellenőrizzük, hogy van-e szöveges válasz
            if (response && response.text) {
                return response.text();
            } else {
                console.error('❌ Váratlan API válasz formátum:', response);
                throw new Error('Váratlan API válasz formátum');
            }            
        } catch (error) {
            console.error('Gemini API hiba:', error);
            
            // Specifikus hibaüzenetek a különböző hibákhoz
            if (error.message && error.message.includes('503')) {
                return 'A Gemini modell jelenleg túlterhelt. Kérlek próbáld újra néhány másodperc múlva.';
            } else if (error.message && error.message.includes('429')) {
                return 'Elértük az API kérések limitjét. Kérlek próbáld újra később.';
            } else if (error.message && error.message.includes('401')) {
                return 'API kulcs hitelesítési hiba. Ellenőrizd, hogy az API kulcs érvényes-e.';
            }
            
            return 'Sajnos most nem tudok válaszolni. Ellenőrizd az API kulcsot és az internetkapcsolatot. Részletek a konzolban.';
        }
    }    buildContext(userMessage) {
        const siteInfo = this.getSiteInfo();
        const personality = this.brain.config.behavior.personality;
        const language = this.brain.config.behavior.language || 'hu';
        
        return `
${personality}

WEBOLDAL INFORMÁCIÓK:
${siteInfo}

NAVIGÁCIÓS KÉPESSÉGEK:
- Ha a felhasználó kéri, hogy görgessek egy elemhez vagy mutassam meg valami, használd a [SCROLL:selector] formátumot
- Ha a felhasználó kéri, hogy menjek egy linkre, használd a [NAVIGATE:url] formátumot
- Ha a felhasználó kéri, hogy jelöljek ki egy elemet, használd a [HIGHLIGHT:selector] formátumot
- Példák:
  * "Görgess az akciókhoz" → [SCROLL:h2:contains('Akció'), .akcio, .actions]
  * "Mutasd meg a kapcsolat részt" → [SCROLL:h2:contains('Kapcsolat'), .contact, #contact]
  * "Menj a főoldalra" → [NAVIGATE:/]

BESZÉLGETÉS TÖRTÉNET:
${this.chatHistory.slice(-5).map(item => `Felhasználó: ${item.user}\nAsszisztens: ${item.assistant}`).join('\n\n')}

JELENLEGI KÉRDÉS: ${userMessage}

Kérlek válaszolj ${language} nyelven, segítőkész módon, és használd fel a weboldal információit a válaszadáshoz. Ha a felhasználó navigációt kér (görgetés, oldal váltás, elem megjelenítése), használd a megfelelő parancsokat. Ha nem tudod a választ, segíts a felhasználónak megtalálni a megfelelő oldalt vagy információt.
        `.trim();
    }    getSiteInfo() {
        let info = `Oldal címe: ${document.title}\n`;
        info += `URL: ${window.location.href}\n`;
        
        // Navigációs elemek
        const navElements = document.querySelectorAll('nav a, .nav a, .menu a, .navigation a, header a');
        if (navElements.length > 0) {
            info += `Navigációs linkek: ${Array.from(navElements).map(a => a.textContent.trim()).filter(text => text).join(', ')}\n`;
        }
        
        // Főcímek részletesebben
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length > 0) {
            const headingInfo = Array.from(headings).map(h => {
                const text = h.textContent.trim();
                const tag = h.tagName.toLowerCase();
                const id = h.id ? `#${h.id}` : '';
                const classes = h.className ? `.${h.className.split(' ').join('.')}` : '';
                return `${text} (${tag}${id}${classes})`;
            }).filter(text => text).slice(0, 10);
            info += `Főcímek: ${headingInfo.join(', ')}\n`;
        }
        
        // Szekciók és főbb tartalom területek
        const sections = document.querySelectorAll('section, .section, main, .main, article, .article');
        if (sections.length > 0) {
            const sectionInfo = Array.from(sections).map(s => {
                const id = s.id ? `#${s.id}` : '';
                const classes = s.className ? `.${s.className.split(' ').join('.')}` : '';
                const heading = s.querySelector('h1, h2, h3, h4, h5, h6');
                const title = heading ? heading.textContent.trim() : '';
                return title ? `${title} (${s.tagName.toLowerCase()}${id}${classes})` : `${s.tagName.toLowerCase()}${id}${classes}`;
            }).filter(text => text).slice(0, 5);
            info += `Szekciók: ${sectionInfo.join(', ')}\n`;
        }
        
        // Fontos elemek ID-k és osztályok alapján
        const importantElements = document.querySelectorAll('[id*="akcio"], [id*="action"], [id*="contact"], [id*="kapcsolat"], [id*="about"], [id*="rolunk"], [class*="akcio"], [class*="action"], [class*="contact"], [class*="kapcsolat"], [class*="about"], [class*="rolunk"]');
        if (importantElements.length > 0) {
            const elementInfo = Array.from(importantElements).map(el => {
                const id = el.id ? `#${el.id}` : '';
                const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                const tag = el.tagName.toLowerCase();
                const text = el.textContent.trim().substring(0, 50);
                return `${text} (${tag}${id}${classes})`;
            }).slice(0, 5);
            info += `Fontos elemek: ${elementInfo.join(', ')}\n`;
        }
        
        // Meta leírás
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            info += `Leírás: ${metaDesc.content}\n`;
        }
        
        // Cached site map információ
        if (this.brain.siteMap.pages.length > 0) {
            info += `Elérhető oldalak: ${this.brain.siteMap.pages.join(', ')}\n`;
        }
        
        return info;
    }

    async scanWebsite() {
        try {
            console.log('🔍 Weboldal feltérképezése...');
            
            const pages = new Set();
            const content = {};
            
            // Jelenlegi oldal hozzáadása
            pages.add(window.location.pathname);
            content[window.location.pathname] = this.extractPageContent();
            
            // Linkek keresése
            const links = document.querySelectorAll('a[href]');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                    pages.add(href);
                }
            });
            
            // Brain frissítése
            this.brain.siteMap.lastScan = new Date().toISOString();
            this.brain.siteMap.pages = Array.from(pages);
            this.brain.siteMap.content = content;
            
            await this.saveBrain();
            
            console.log(`✅ Feltérképezés kész! ${pages.size} oldal találva.`);
            
        } catch (error) {
            console.error('Hiba a weboldal feltérképezése során:', error);
        }
    }

    extractPageContent() {
        const content = {
            title: document.title,
            headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent.trim()),
            paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent.trim()).filter(text => text.length > 20).slice(0, 10),
            links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
                text: a.textContent.trim(),
                href: a.getAttribute('href')
            })).filter(link => link.text && link.href)
        };
        
        return content;
    }

    saveConversation(userMessage, assistantResponse) {
        const conversation = {
            timestamp: new Date().toISOString(),
            user: userMessage,
            assistant: assistantResponse
        };
        
        this.chatHistory.push(conversation);
        this.brain.conversations.push(conversation);
        this.brain.analytics.totalQueries++;
        
        // Népszerű kérdések nyilvántartása
        const question = userMessage.toLowerCase();
        if (!this.brain.analytics.popularQuestions[question]) {
            this.brain.analytics.popularQuestions[question] = 0;
        }
        this.brain.analytics.popularQuestions[question]++;
        
        this.saveBrain();
    }

    // Publikus API metódusok
    updateBehavior(newBehavior) {
        this.brain.config.behavior = { ...this.brain.config.behavior, ...newBehavior };
        this.saveBrain();
    }    setAPIKey(apiKey) {
        if (!apiKey) {
            console.warn('⚠️ Érvénytelen API kulcs.');
            return;
        }
        
        this.apiKey = apiKey;
        this.brain.config.apiKey = apiKey;
        this.saveBrain();
        console.log('🔑 API kulcs sikeresen beállítva - javasoljuk a .env fájlban tárolni nagyobb biztonság érdekében');
        
        // Frissítjük a környezeti változókat is
        if (!window.env) window.env = {};
        window.env.GEMINI_API_KEY = apiKey;
    }
      createEnvFile(apiKey) {
        if (!apiKey) apiKey = this.apiKey;
        if (!apiKey) return false;
        
        // Modern módszer: a console-ban jelenítjük meg a segítséget
        console.log('%c📝 .env fájl létrehozása', 'font-weight: bold; font-size: 14px; color: #007AFF;');
        console.log(`Hozz létre egy .env fájlt a következő tartalommal:
VITE_GEMINI_API_KEY=${apiKey}

Majd töltsd újra az oldalt.`);
        return true;
    }

    getAnalytics() {
        return this.brain.analytics;
    }

    rescanWebsite() {
        return this.scanWebsite();
    }
    
    processNavigationCommands(response) {
        // Navigációs parancsok keresése és feldolgozása
        let processedResponse = response;
        
        // SCROLL parancs feldolgozása
        const scrollMatches = response.match(/\[SCROLL:([^\]]+)\]/g);
        if (scrollMatches) {
            scrollMatches.forEach(match => {
                const selectors = match.replace(/\[SCROLL:|\]/g, '').split(',').map(s => s.trim());
                this.scrollToElement(selectors);
                // Parancsot eltávolítjuk a válaszból
                processedResponse = processedResponse.replace(match, '');
            });
        }
        
        // NAVIGATE parancs feldolgozása
        const navigateMatches = response.match(/\[NAVIGATE:([^\]]+)\]/g);
        if (navigateMatches) {
            navigateMatches.forEach(match => {
                const url = match.replace(/\[NAVIGATE:|\]/g, '').trim();
                this.navigateToUrl(url);
                // Parancsot eltávolítjuk a válaszból
                processedResponse = processedResponse.replace(match, '');
            });
        }
        
        // HIGHLIGHT parancs feldolgozása
        const highlightMatches = response.match(/\[HIGHLIGHT:([^\]]+)\]/g);
        if (highlightMatches) {
            highlightMatches.forEach(match => {
                const selectors = match.replace(/\[HIGHLIGHT:|\]/g, '').split(',').map(s => s.trim());
                this.highlightElement(selectors);
                // Parancsot eltávolítjuk a válaszból
                processedResponse = processedResponse.replace(match, '');
            });
        }
        
        return processedResponse.trim();
    }

    scrollToElement(selectors) {
        console.log('🔍 Elem keresése görgetéshez:', selectors);
        
        for (const selector of selectors) {
            try {
                let element = null;
                
                // Speciális kezelés a :contains() szelektorhoz
                if (selector.includes(':contains(')) {
                    const match = selector.match(/([^:]+):contains\(['"]?([^'")]+)['"]?\)/);
                    if (match) {
                        const [, tagName, text] = match;
                        const elements = document.querySelectorAll(tagName);
                        element = Array.from(elements).find(el => 
                            el.textContent.toLowerCase().includes(text.toLowerCase())
                        );
                    }
                } else {
                    // Normál szelektor
                    element = document.querySelector(selector);
                }
                
                if (element) {
                    console.log('✅ Elem megtalálva, görgetés:', element);
                    
                    // Simító görgetés az elemhez
                    element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                    
                    // Highlight effekt
                    this.addTemporaryHighlight(element);
                    
                    return true; // Sikeres görgetés
                }
            } catch (error) {
                console.warn('⚠️ Hiba a szelektor feldolgozásában:', selector, error);
            }
        }
        
        console.log('❌ Nem található elem görgetéshez');
        return false;
    }

    navigateToUrl(url) {
        console.log('🔗 Navigálás:', url);
        
        try {
            // Relatív URL-ek kezelése
            if (url.startsWith('/') || !url.includes('://')) {
                // Azonos oldalon belüli navigálás
                if (url.startsWith('#')) {
                    // Anchor link
                    const element = document.querySelector(url);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        this.addTemporaryHighlight(element);
                    }
                } else {
                    // Új oldal betöltése
                    window.location.href = url;
                }
            } else {
                // Külső link új ablakban
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
            console.error('❌ Hiba a navigációban:', error);
        }
    }

    highlightElement(selectors) {
        console.log('✨ Elem kiemelése:', selectors);
        
        for (const selector of selectors) {
            try {
                let element = null;
                
                // Speciális kezelés a :contains() szelektorhoz
                if (selector.includes(':contains(')) {
                    const match = selector.match(/([^:]+):contains\(['"]?([^'")]+)['"]?\)/);
                    if (match) {
                        const [, tagName, text] = match;
                        const elements = document.querySelectorAll(tagName);
                        element = Array.from(elements).find(el => 
                            el.textContent.toLowerCase().includes(text.toLowerCase())
                        );
                    }
                } else {
                    element = document.querySelector(selector);
                }
                
                if (element) {
                    console.log('✅ Elem megtalálva, kiemelés:', element);
                    this.addTemporaryHighlight(element, 3000); // 3 másodperc kiemelés
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Hiba a szelektor feldolgozásában:', selector, error);
            }
        }
        
        return false;
    }

    addTemporaryHighlight(element, duration = 2000) {
        // Highlight stílus hozzáadása
        const originalStyle = {
            outline: element.style.outline,
            backgroundColor: element.style.backgroundColor,
            transition: element.style.transition
        };
        
        // Animált kiemelés
        element.style.transition = 'all 0.3s ease';
        element.style.outline = '3px solid #007AFF';
        element.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
        
        // Kiemelés eltávolítása a megadott idő után
        setTimeout(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.outline = originalStyle.outline;
            element.style.backgroundColor = originalStyle.backgroundColor;
            
            // Eredeti transition visszaállítása
            setTimeout(() => {
                element.style.transition = originalStyle.transition;
            }, 300);
        }, duration);
    }

    // ...existing code...
}

// Automatikus inicializálás amikor a DOM betöltődött
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiAssistant = new ModularAIAssistant();
    });
} else {
    window.aiAssistant = new ModularAIAssistant();
}

// Globális API funkciók
window.AIAssistant = {
    updateBehavior: (behavior) => window.aiAssistant?.updateBehavior(behavior),
    setAPIKey: (key) => window.aiAssistant?.setAPIKey(key),
    createEnvFile: (key) => window.aiAssistant?.createEnvFile(key),
    getAnalytics: () => window.aiAssistant?.getAnalytics(),
    rescan: () => window.aiAssistant?.rescanWebsite()
};
