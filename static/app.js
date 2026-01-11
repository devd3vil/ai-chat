/**
 * AI Chat Application JavaScript
 * 
 * This file handles the chat interface behavior:
 * - Displays messages sent by user and responses from AI
 * - Communicates with the FastAPI backend (/ask and /ask_stream endpoints)
 * - Handles real-time streaming of tokens
 * - Manages UI updates and animations
 * 
 * JavaScript is a language that runs in the browser and controls what happens
 * when users interact with the page (clicking, typing, etc.)
 */

// ============================================================================
// PART 1: Get references to HTML elements we'll use
// ============================================================================
// These lines find elements in the HTML file by their id attribute
// Think of it like: "give me the element with id='messages'" so we can add to it

const messagesContainer = document.getElementById('messages');
// messagesContainer = the div where all chat messages will appear

const questionForm = document.getElementById('questionForm');
// questionForm = the form with the input box and send button

const questionInput = document.getElementById('questionInput');
// questionInput = the text input field where user types their question

const sendButton = document.getElementById('sendButton');
// sendButton = the "Send" button that user clicks to send message

const modeRadios = document.querySelectorAll('input[name="mode"]');
// modeRadios = both radio buttons (Stream and Full modes)

// ============================================================================
// PART 2: Function to add a message to the chat display
// ============================================================================
/**
 * Function: addMessage
 * 
 * This function creates a new message element and adds it to the chat
 * Also SAVES the message to browser storage for history persistence
 * 
 * Parameters (inputs):
 * @param {string} content - The text content of the message
 * @param {string} role - Who sent it: either 'user' (human) or 'assistant' (AI)
 * @param {boolean} isStreaming - Is this message still receiving data? (default: false)
 * 
 * What happens:
 * 1. Creates a new div element to hold the message
 * 2. Adds CSS class to style it (different colors for user vs assistant)
 * 3. Adds the text content inside
 * 4. Appends it to the chat display
 * 5. Scrolls to bottom so user sees the new message
 * 6. Returns the message element in case we need to update it later
 */
function addMessage(content, role, isStreaming = false) {
    // Create a new div element (a container for the message)
    const messageDiv = document.createElement('div');
    
    // Add CSS classes to style the message
    // 'message' = base styling for all messages
    // role = 'user' or 'assistant' determines color (purple for user, gray for AI)
    // 'loading' = if isStreaming is true, show a loading state
    messageDiv.className = `message ${role} ${isStreaming ? 'loading' : ''}`;
    
    // Give it a unique ID based on timestamp (so we can find it later)
    messageDiv.id = `message-${Date.now()}`;

    // Build the HTML content differently depending on who sent it
    if (role === 'assistant') {
        // For AI messages, add a label "AI Assistant" above the message
        messageDiv.innerHTML = `
            <div>
                <div class="message-label">AI Assistant</div>
                <div class="message-content">${content}</div>
            </div>
        `;
    } else {
        // For user messages, just show the text (label not needed)
        messageDiv.innerHTML = `
            <div class="message-content">${escapeHtml(content)}</div>
        `;
    }

    // Add this message element to the chat display
    // appendChild means "add as a child of this parent"
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to the bottom so user sees the newest message
    scrollToBottom();
    
    // Return the message element (so caller can update it later if needed)
    return messageDiv;
}

// ============================================================================
// PART 3: Functions for conversation context (last 5 messages sent to backend)
// ============================================================================
/**
 * Function: getConversationContext
 * 
 * Gets the last 5 messages from the chat display to send as context to the LLM
 * This helps the AI understand the conversation flow and provide better responses
 * 
 * Note: This uses the DOM (the visible messages on screen), not persistent storage
 * So messages are only remembered during the current session
 * 
 * @returns {string} The formatted conversation context (or empty string if no history)
 */
function getConversationContext() {
    try {
        // Get all message elements from the page
        // messagesContainer is the <div id="messages"> where all chat messages appear
        const messageElements = messagesContainer.querySelectorAll('.message');
        
        // If no messages yet, return empty string
        if (messageElements.length === 0) {
            return '';
        }
        
        // Convert NodeList to Array and get last 5 messages
        // slice(-5) means "take the last 5 items"
        const recentElements = Array.from(messageElements).slice(-5);
        
        // Extract role and content from each message element
        const contextLines = recentElements.map(element => {
            // Get the role from the class: 'message user' or 'message assistant'
            const isUser = element.classList.contains('user');
            const roleLabel = isUser ? 'User' : 'Assistant';
            
            // Get the message text content
            // .message-content is the div containing the actual message
            const contentDiv = element.querySelector('.message-content');
            const content = contentDiv ? contentDiv.textContent.trim() : '';
            
            return `${roleLabel}: ${content}`;
        });
        
        // Join all lines with newlines to create one big string
        return contextLines.join('\n');
        
    } catch (error) {
        // If something fails, just return empty context (don't crash)
        console.warn('Failed to get conversation context:', error);
        return '';
    }
}

/**
 * Function: buildPromptWithContext
 * 
 * Takes the current question and adds previous conversation messages to it
 * This gives the LLM more context about the conversation
 * 
 * @param {string} question - The user's current question
 * @returns {object} Object with context and question for the API
 */
function buildPromptWithContext(question) {
    const context = getConversationContext();
    
    // Return both context (previous messages) and current question
    return {
        context: context,
        question: question
    };
}

function addTypingIndicator() {
    // Create a new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';
    messageDiv.id = 'typing-indicator';  // Give it an ID so we can find and remove it later
    
    // Create the HTML with three bouncing dots
    messageDiv.innerHTML = `
        <div>
            <div class="message-label">AI Assistant</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add it to the chat
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// ============================================================================
// PART 4: Function to remove the typing indicator when response arrives
// ============================================================================
/**
 * Function: removeTypingIndicator
 * 
 * Removes the three bouncing dots when AI finishes or when response starts
 */
function removeTypingIndicator() {
    // Find the element with id='typing-indicator'
    const indicator = document.getElementById('typing-indicator');
    
    // If it exists, remove it from the page
    if (indicator) {
        indicator.remove();
    }
}

// ============================================================================
// PART 5: Security function - Prevent malicious code in messages
// ============================================================================
/**
 * Function: escapeHtml
 * 
 * Converts special characters to safe versions to prevent security attacks
 * 
 * Example:
 * Input:  <script>alert('hack')</script>
 * Output: &lt;script&gt;alert('hack')&lt;/script&gt;
 * 
 * This way, if someone tries to send HTML code, it shows as text instead
 * of executing as code. This is called "XSS prevention"
 * 
 * What it does:
 * - & becomes &amp;
 * - < becomes &lt;
 * - > becomes &gt;
 * - " becomes &quot;
 * - ' becomes &#039;
 */
function escapeHtml(text) {
    // Create a mapping of dangerous characters to safe versions
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    // Go through the text and replace any dangerous characters
    // /[&<>"']/g means "find all occurrences of these characters"
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// PART 6: Function to scroll chat to the bottom
// ============================================================================
/**
 * Function: scrollToBottom
 * 
 * Automatically scrolls the chat display so the newest message is visible
 */
function scrollToBottom() {
    // scrollHeight = total height of all content inside
    // Setting scrollTop to scrollHeight means scroll all the way to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================================================================
// PART 7: Send message using STREAMING (real-time tokens)
// ============================================================================
/**
 * Function: sendMessageStream
 * 
 * Sends a question to the /ask_stream endpoint and displays response tokens
 * in real-time as they arrive (token by token)
 * 
 * This is the "fast feedback" mode - user sees words appear as they're generated
 * 
 * Parameter:
 * @param {string} question - The user's question to send to the AI
 * 
 * How it works (step by step):
 * 1. Show typing indicator (three dots)
 * 2. Send HTTP POST request to /ask_stream endpoint with the question
 * 3. Get back a "stream" (like a water stream, data flows continuously)
 * 4. Read tokens from the stream one at a time
 * 5. Display each token as it arrives
 * 6. When done, the response is complete
 */
async function sendMessageStream(question) {
    // Get conversation context (last 5 messages)
    const { context, question: cleanQuestion } = buildPromptWithContext(question);
    
    // Show the three bouncing dots while waiting
    addTypingIndicator();

    try {
        // Send HTTP POST request to the backend with BOTH question and context
        const response = await fetch('/ask_stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send both context (last 5 messages) and the current question
            body: JSON.stringify({ 
                question: cleanQuestion,
                context: context  // NEW: Add conversation history for LLM context
            })
        });

        // Check if the request was successful (status 200 = OK)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove the typing indicator since response is coming
        removeTypingIndicator();
        
        // Get a "reader" to read the streaming response
        const reader = response.body.getReader();
        
        // Create a decoder to convert bytes to text
        const decoder = new TextDecoder();
        
        // Variable to store the complete response as it arrives
        let fullResponse = '';
        
        // Variable to reference the message element (we'll update it repeatedly)
        let messageElement = null;

        // Loop: keep reading chunks of data until the stream ends
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;

            if (!messageElement) {
                messageElement = addMessage('', 'assistant');
            }

            const contentDiv = messageElement.querySelector('.message-content');
            contentDiv.innerHTML = escapeHtml(fullResponse);
            scrollToBottom();
        }

        if (!messageElement) {
            addMessage('(empty response)', 'assistant');
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage(`Error: ${error.message}`, 'assistant');
        console.error('Stream error:', error);
    }
}

// ============================================================================
// PART 8: Send message using FULL RESPONSE mode (wait for complete answer)
// ============================================================================
/**
 * Function: sendMessageFull
 * 
 * Sends a question to the /ask endpoint and waits for the COMPLETE response
 * before displaying it all at once
 * 
 * NOW INCLUDES: Sends the last 5 messages as context so LLM understands conversation
 * 
 * This is the "wait mode" - user waits, then sees the full answer
 * 
 * Parameter:
 * @param {string} question - The user's question
 * 
 * Difference from streaming:
 * - Streaming: Shows words as they arrive (faster perceived response)
 * - Full: Waits for everything, then shows complete answer (simpler but slower)
 */
async function sendMessageFull(question) {
    // Get conversation context (last 5 messages)
    const { context, question: cleanQuestion } = buildPromptWithContext(question);
    
    // Show the typing indicator
    addTypingIndicator();

    try {
        // Send HTTP POST request to /ask endpoint with BOTH question and context
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send both context (last 5 messages) and the current question
            body: JSON.stringify({ 
                question: cleanQuestion,
                context: context  // NEW: Add conversation history for LLM context
            })
        });

        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Convert the response to JSON format
        const data = await response.json();
        
        // Remove the typing indicator
        removeTypingIndicator();
        
        // Add the complete response to chat
        addMessage(escapeHtml(data.answer), 'assistant');
    } catch (error) {
        // Remove typing indicator
        removeTypingIndicator();
        
        // Show error message
        addMessage(`Error: ${error.message}`, 'assistant');
        
        // Log error to console for debugging
        console.error('Full response error:', error);
    }
}

// ============================================================================
// PART 9: Handle form submission (when user clicks Send or presses Enter)
// ============================================================================
/**
 * Function: sendMessage
 * 
 * This is called when the user submits the form (clicks Send button or presses Enter)
 * 
 * Parameter:
 * @param {Event} event - The form submission event
 */
async function sendMessage(event) {
    // Prevent default behavior (page reload when form submitted)
    // Without this, the page would refresh when you click Send
    event.preventDefault();

    // Get the text the user typed
    const question = questionInput.value.trim();
    
    // If input is empty, don't do anything
    if (!question) return;

    // Add the user's message to the chat display
    addMessage(question, 'user');
    
    // Clear the input field for next message
    questionInput.value = '';
    
    // Put cursor back in the input field so user can type again
    questionInput.focus();

    // Disable the send button (gray it out) while waiting for response
    // This prevents user from clicking multiple times
    sendButton.disabled = true;

    // Find which mode is selected (Stream or Full)
    // document.querySelector finds an element matching a selector
    // input[name="mode"]:checked = the radio button that is checked
    const mode = document.querySelector('input[name="mode"]:checked').value;

    // Call the appropriate function based on selected mode
    if (mode === 'stream') {
        // Real-time streaming mode
        await sendMessageStream(question);
    } else {
        // Wait for full response mode
        await sendMessageFull(question);
    }

    // Re-enable the send button after response is received
    sendButton.disabled = false;
}

// ============================================================================
// PART 10: Add event listeners (watch for user interactions)
// ============================================================================
/**
 * Event listeners: These "listen" for actions and run functions when they happen
 * 
 * Think of it like: "When the user does X, run function Y"
 */

// When user presses a key in the input field
// This allows pressing Enter to send instead of just clicking the button
questionInput.addEventListener('keydown', (e) => {
    // If user pressed Enter key AND didn't hold Shift
    // (Shift+Enter is for adding a new line)
    if (e.key === 'Enter' && !e.shiftKey) {
        // Prevent the browser's default Enter behavior (adding newline)
        e.preventDefault();
        
        // Trigger the form submission (same as clicking Send)
        questionForm.dispatchEvent(new Event('submit'));
    }
});

// ============================================================================
// PART 11: Run code when page first loads
// ============================================================================
/**
 * DOMContentLoaded: This event fires when the HTML page is fully loaded
 * 
 * We use it to:
 * 1. Show a welcome message
 * 2. Focus the cursor in the input box
 */
document.addEventListener('DOMContentLoaded', () => {
    // Show welcome message
    addMessage('Hi! I\'m an AI assistant powered by local LLaMA. Ask me anything!', 'assistant', false, false);
    
    // Put cursor in the input field so user can start typing immediately
    questionInput.focus();
});
