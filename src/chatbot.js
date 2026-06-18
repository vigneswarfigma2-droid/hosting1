import './chatbot.css';

(() => {
    'use strict';

    const STORAGE_KEY = 'fraylon_chat_history';
    const STATE_KEY = 'fraylon_chat_state';
    const VISIBLE_KEY = 'fraylon_chat_visible';
    const TEASER_KEY = 'fraylon_chat_teaser_dismissed';

    let chatState = {
        wizardStep: null,
        websites: null,
        nodejs: null
    };

    let chatHistory = [];
    let isWindowVisible = false;
    let hasUnread = false;
    let isTeaserDismissed = false;

    // Helper for selecting elements
    const $ = (sel, root = document) => root.querySelector(sel);

    // Initialize the Chatbot UI
    function initChatbot() {
        // Prevent duplicate rendering
        if ($('#fraylonChatToggle')) return;

        // Load persisted state and history
        try {
            const savedHistory = sessionStorage.getItem(STORAGE_KEY);
            const savedState = sessionStorage.getItem(STATE_KEY);
            const savedVisibility = sessionStorage.getItem(VISIBLE_KEY);
            const savedTeaser = localStorage.getItem(TEASER_KEY);

            if (savedHistory) chatHistory = JSON.parse(savedHistory);
            if (savedState) chatState = JSON.parse(savedState);
            if (savedVisibility === 'true') isWindowVisible = true;
            if (savedTeaser === 'true') isTeaserDismissed = true;
        } catch (e) {
            console.error('[chatbot] Failed to restore session storage:', e);
        }

        injectChatMarkup();
        bindEvents();
        
        if (chatHistory.length === 0) {
            // Add initial welcome message (No Emojis)
            addBotMessage("Welcome to Fraylon Hosting support. How can I assist you with your web hosting needs today?", [
                "Help me choose a plan",
                "What plans do you have?",
                "Do you offer free migration?"
            ]);
        } else {
            // Render existing history
            renderHistory();
        }

        // Apply visibility states
        if (isWindowVisible) {
            const win = $('#fraylonChatWindow');
            const btn = $('#fraylonChatToggle');
            if (win) win.classList.add('open');
            if (btn) {
                btn.classList.add('active');
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fas fa-times';
                if (window.innerWidth <= 480) {
                    btn.style.display = 'none';
                }
            }
            hideTeaser(true);
        } else {
            if (chatHistory.length > 1) {
                showUnreadDot(true);
            }
            if (isTeaserDismissed) {
                hideTeaser(true);
            }
        }
    }

    // Inject HTML dynamically (Teaser clean text, toggle active class X support)
    function injectChatMarkup() {
        const wrapperHTML = `
            <div class="fraylon-chat-wrapper">
                <!-- Teaser Bubble -->
                <div class="fraylon-chat-teaser" id="fraylonChatTeaser">
                    <span>Fraylon Support. Ask us anything.</span>
                    <button class="teaser-close" id="fraylonCloseTeaser" aria-label="Close teaser">&times;</button>
                </div>

                <!-- Floating Chat Toggle -->
                <button class="fraylon-chat-toggle" id="fraylonChatToggle" aria-label="Open support chat" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-comment-dots"></i>
                    <span class="unread-dot" id="fraylonUnreadDot"></span>
                </button>
            </div>

            <!-- Chat Window -->
            <div class="fraylon-chat-window" id="fraylonChatWindow" aria-hidden="true" role="dialog" aria-label="Fraylon Support Chat">
                <div class="chat-header">
                    <div class="header-info">
                        <div class="team-avatars">
                            <span class="avatar-circle av-1">Y</span>
                            <span class="avatar-circle av-2">A</span>
                            <span class="avatar-circle av-3">S</span>
                        </div>
                        <div class="header-text">
                            <h4>Fraylon Support</h4>
                            <span>Typically replies in a few minutes</span>
                        </div>
                    </div>
                    <button class="close-chat-btn" id="fraylonCloseChat" aria-label="Close chat window">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Messages -->
                <div class="chat-messages" id="fraylonChatMessages"></div>

                <!-- Suggestions Container -->
                <div class="chat-suggestions-wrapper" id="fraylonSuggestionsWrapper">
                    <div class="chat-suggestions" id="fraylonChatSuggestions"></div>
                </div>

                <!-- Input Area -->
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="fraylonChatInput" placeholder="Type a message..." aria-label="Type your message">
                    <button class="chat-send-btn" id="fraylonChatSend" aria-label="Send message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = wrapperHTML;
        document.body.appendChild(div);
    }

    // Format simple markdown (*bold*, \n lists)
    function formatMarkdown(text) {
        if (!text) return '';
        let html = text;

        html = html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        const lines = html.split('\n');
        let inList = false;
        let formattedLines = [];

        lines.forEach(line => {
            if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
                if (!inList) {
                    formattedLines.push('<ul>');
                    inList = true;
                }
                const content = line.trim().substring(2);
                formattedLines.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    formattedLines.push('</ul>');
                    inList = false;
                }
                formattedLines.push(`<p>${line}</p>`);
            }
        });

        if (inList) {
            formattedLines.push('</ul>');
        }

        return formattedLines.join('');
    }

    // Scroll to bottom
    function scrollToBottom() {
        const msgs = $('#fraylonChatMessages');
        if (msgs) {
            msgs.scrollTop = msgs.scrollHeight;
        }
    }

    // Display / Hide typing indicator
    function showTypingIndicator(show) {
        const msgs = $('#fraylonChatMessages');
        if (!msgs) return;

        const existing = $('#fraylonTyping');
        if (show) {
            if (existing) return;
            const indicator = document.createElement('div');
            indicator.className = 'chat-msg bot';
            indicator.id = 'fraylonTyping';
            indicator.innerHTML = `
                <div class="msg-bubble">
                    <div class="typing-indicator">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
            `;
            msgs.appendChild(indicator);
            scrollToBottom();
        } else {
            if (existing) existing.remove();
        }
    }

    // Render suggestion chips
    function renderSuggestions(suggestions = []) {
        const wrapper = $('#fraylonSuggestionsWrapper');
        const container = $('#fraylonChatSuggestions');
        if (!container || !wrapper) return;

        if (suggestions.length === 0) {
            wrapper.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        wrapper.style.display = 'block';
        container.innerHTML = suggestions.map(text => `
            <button class="suggestion-chip" data-suggestion="${text}">${text}</button>
        `).join('');

        const chips = container.querySelectorAll('.suggestion-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.dataset.suggestion;
                sendMessage(text);
            });
        });
    }

    // Show unread indicator
    function showUnreadDot(show) {
        const dot = $('#fraylonUnreadDot');
        if (dot) {
            dot.style.display = show ? 'block' : 'none';
            hasUnread = show;
        }
    }

    // Dismiss Teaser bubble
    function hideTeaser(instant = false) {
        const teaser = $('#fraylonChatTeaser');
        if (!teaser) return;

        isTeaserDismissed = true;
        localStorage.setItem(TEASER_KEY, 'true');

        if (instant) {
            teaser.style.display = 'none';
            teaser.classList.add('closed');
        } else {
            teaser.classList.add('closed');
            setTimeout(() => {
                teaser.style.display = 'none';
            }, 300);
        }
    }

    // Persist to session storage
    function persistSession() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
            sessionStorage.setItem(STATE_KEY, JSON.stringify(chatState));
            sessionStorage.setItem(VISIBLE_KEY, String(isWindowVisible));
        } catch (e) {
            console.error('[chatbot] Failed to persist session data:', e);
        }
    }

    // Append user message to log & DOM
    function addUserMessage(text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatHistory.push({ role: 'user', text, time });

        const msgs = $('#fraylonChatMessages');
        if (msgs) {
            const div = document.createElement('div');
            div.className = 'chat-msg user';
            div.innerHTML = `
                <div class="msg-bubble">${formatMarkdown(text)}</div>
                <span class="msg-time">${time}</span>
            `;
            msgs.appendChild(div);
            scrollToBottom();
        }
        persistSession();
    }

    // Append bot message to log & DOM
    function addBotMessage(text, suggestions = [], recommendation = null) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatHistory.push({ role: 'bot', text, time, suggestions, recommendation });

        const msgs = $('#fraylonChatMessages');
        if (msgs) {
            const div = document.createElement('div');
            div.className = 'chat-msg bot';
            
            let ctaHTML = '';
            if (recommendation && recommendation.checkoutUrl) {
                ctaHTML = `
                    <a href="${recommendation.checkoutUrl}" class="msg-cta-btn">
                        Order Now
                    </a>
                `;
            }

            div.innerHTML = `
                <div class="msg-bubble">
                    ${formatMarkdown(text)}
                    ${ctaHTML}
                </div>
                <span class="msg-time">${time}</span>
            `;
            msgs.appendChild(div);
            scrollToBottom();
        }

        renderSuggestions(suggestions);
        persistSession();
        
        if (!isWindowVisible) {
            showUnreadDot(true);
        }
    }

    // Render from loaded history
    function renderHistory() {
        const msgs = $('#fraylonChatMessages');
        if (!msgs) return;

        msgs.innerHTML = '';
        chatHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = `chat-msg ${item.role}`;
            
            let ctaHTML = '';
            if (item.recommendation && item.recommendation.checkoutUrl) {
                ctaHTML = `
                    <a href="${item.recommendation.checkoutUrl}" class="msg-cta-btn">
                        Order Now
                    </a>
                `;
            }

            div.innerHTML = `
                <div class="msg-bubble">
                    ${formatMarkdown(item.text)}
                    ${ctaHTML}
                </div>
                <span class="msg-time">${item.time}</span>
            `;
            msgs.appendChild(div);
        });

        const lastBotMsg = [...chatHistory].reverse().find(m => m.role === 'bot');
        if (lastBotMsg && lastBotMsg.suggestions) {
            renderSuggestions(lastBotMsg.suggestions);
        } else {
            renderSuggestions([]);
        }
        
        scrollToBottom();
    }

    // Send message to API and process reply
    async function sendMessage(text) {
        if (!text || text.trim() === '') return;

        addUserMessage(text);
        renderSuggestions([]);

        const input = $('#fraylonChatInput');
        if (input) {
            input.value = '';
            input.disabled = true;
        }

        const startTime = Date.now();
        showTypingIndicator(true);

        try {
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    state: chatState,
                    history: chatHistory
                })
            });

            if (!response.ok) {
                throw new Error('API server error');
            }

            const data = await response.json();
            
            // Enforce minimum artificial thinking delay of 1.2 seconds (1200ms)
            const elapsed = Date.now() - startTime;
            const minDelay = 1200;
            if (elapsed < minDelay) {
                await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
            }

            showTypingIndicator(false);

            if (input) input.disabled = false;
            
            if (data.state) {
                chatState = data.state;
            }

            addBotMessage(data.reply, data.quickReplies, data.recommendation);

            if (input) input.focus();

        } catch (error) {
            console.error('[chatbot] Chatbot API failure:', error);
            
            // Enforce minimum delay on error as well for visual consistency
            const elapsed = Date.now() - startTime;
            const minDelay = 1200;
            if (elapsed < minDelay) {
                await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
            }

            showTypingIndicator(false);
            if (input) input.disabled = false;
            
            addBotMessage(
                "I'm having trouble connecting to the support server. Please make sure the local server is running or contact support@fraylon.com.",
                ["Retry connection", "Main Menu"]
            );
        }
    }

    // Toggle Chat Window with responsive toggle button hiding on mobile
    function toggleChat() {
        const win = $('#fraylonChatWindow');
        const btn = $('#fraylonChatToggle');
        if (!win || !btn) return;

        const icon = btn.querySelector('i');
        isWindowVisible = !isWindowVisible;
        if (isWindowVisible) {
            win.classList.add('open');
            btn.classList.add('active');
            if (icon) icon.className = 'fas fa-times';
            win.setAttribute('aria-hidden', 'false');
            btn.setAttribute('aria-expanded', 'true');
            showUnreadDot(false);
            hideTeaser();
            
            // Responsive mobile hide
            if (window.innerWidth <= 480) {
                btn.style.display = 'none';
            }
            
            const input = $('#fraylonChatInput');
            if (input) setTimeout(() => input.focus(), 300);
        } else {
            win.classList.remove('open');
            btn.classList.remove('active');
            if (icon) icon.className = 'fas fa-comment-dots';
            win.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
            
            // Restore visibility of toggle button
            btn.style.display = '';
        }
        persistSession();
    }

    // Bind event listeners
    function bindEvents() {
        const toggle = $('#fraylonChatToggle');
        const closeBtn = $('#fraylonCloseChat');
        const sendBtn = $('#fraylonChatSend');
        const input = $('#fraylonChatInput');
        const closeTeaser = $('#fraylonCloseTeaser');

        if (toggle) toggle.addEventListener('click', toggleChat);
        if (closeBtn) closeBtn.addEventListener('click', toggleChat);
        if (closeTeaser) {
            closeTeaser.addEventListener('click', (e) => {
                e.stopPropagation();
                hideTeaser();
            });
        }
        
        if (sendBtn && input) {
            sendBtn.addEventListener('click', () => sendMessage(input.value));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    sendMessage(input.value);
                }
            });
        }

        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-fraylon-action="open-chat"]');
            if (target) {
                e.preventDefault();
                if (!isWindowVisible) toggleChat();
            }
        });

        // Listen for resizing to adjust the mobile toggle visibility state
        window.addEventListener('resize', () => {
            const btn = $('#fraylonChatToggle');
            if (btn) {
                if (isWindowVisible && window.innerWidth <= 480) {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = '';
                }
            }
        });
    }

    // Run on startup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
