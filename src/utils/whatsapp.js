/**
 * Utility functions for WhatsApp specific business logic.
 */

/**
 * Checks if the 24-hour customer service window has expired.
 * The window is open for 24 hours after the last message sent by the user.
 * 
 * @param {Array} messages - Array of message objects for the conversation.
 * @returns {boolean} True if the 24h window has passed, false otherwise.
 */
export function isWhatsAppWindowClosed(messages) {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return true;
    }

    // Performance improvement: Search backwards since the latest messages are usually at the end.
    // Using a reverse for-loop for maximum browser compatibility (since findLast is relatively new).
    let latestUserMsg = null;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === 'user') {
            latestUserMsg = messages[i];
            break;
        }
    }

    if (!latestUserMsg) {
        return true; // No user messages, window is closed by default.
    }

    const msgDate = new Date(latestUserMsg.timestamp);
    const now = new Date();
    const diffMs = now - msgDate;
    
    // 24 hours in ms = 24 * 60 * 60 * 1000 = 86400000
    return diffMs > 86400000;
}
