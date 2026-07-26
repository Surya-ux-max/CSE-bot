/**
 * ChatMessage domain model representing a message entity in the conversation.
 */
export class ChatMessage {
  constructor({ id = Date.now(), role, content, agentName = 'reception_agent', timestamp = new Date() }) {
    this.id = id
    this.role = role // 'user' | 'assistant'
    this.content = content
    this.agentName = agentName
    this.timestamp = timestamp
  }

  static createUserMessage(content) {
    return new ChatMessage({
      role: 'user',
      content: content.trim(),
      agentName: 'user'
    })
  }

  static createAssistantMessage(content, agentName = 'reception_agent') {
    return new ChatMessage({
      role: 'assistant',
      content: content,
      agentName: agentName
    })
  }
}
