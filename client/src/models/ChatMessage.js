/**
 * ChatMessage domain model representing a message entity in the conversation.
 * Handles both positional arguments and object parameter options flexibly.
 */
export class ChatMessage {
  constructor(idOrObj, content, sender, agentName) {
    if (typeof idOrObj === 'object' && idOrObj !== null) {
      this.id = idOrObj.id || Date.now()
      this.sender = idOrObj.sender || idOrObj.role || 'bot'
      this.role = this.sender
      this.content = idOrObj.content || ''
      this.agentName = idOrObj.agentName || 'reception_agent'
      this.timestamp = idOrObj.timestamp || new Date()
    } else {
      this.id = typeof idOrObj === 'number' ? idOrObj : Date.now()
      this.content = typeof content === 'string' ? content : ''
      this.sender = sender || 'bot'
      this.role = this.sender
      this.agentName = agentName || 'reception_agent'
      this.timestamp = new Date()
    }
  }

  static createUserMessage(content) {
    return new ChatMessage(Date.now(), content, 'user', 'user')
  }

  static createAssistantMessage(content, agentName = 'reception_agent') {
    return new ChatMessage(Date.now(), content, 'bot', agentName)
  }
}
