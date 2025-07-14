import { create } from 'zustand'
import { api } from '@services/api'
import { useEditorStore } from './editorStore'
import { useSettingsStore } from './settingsStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  streamingContent: string
  
  // Actions
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  stopStreaming: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI coding assistant. I can help you write code, debug issues, explain concepts, and more. What would you like to build today?',
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  streamingContent: '',

  // Actions
  sendMessage: async (content) => {
    const { messages } = get()
    const { files, activeFileId } = useEditorStore.getState()
    const { settings } = useSettingsStore.getState()
    
    // Check if API key is configured
    if (!settings.ai?.apiKey) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Please configure your API key in Settings to use the AI assistant. Click the settings icon in the header to get started.',
        timestamp: new Date(),
      }
      set({ messages: [...messages, errorMessage] })
      return
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    
    set({ 
      messages: [...messages, userMessage],
      isLoading: true,
      streamingContent: ''
    })

    // Prepare context
    const context: any = {}
    if (activeFileId && files.length > 0) {
      const activeFile = files.find(f => f.id === activeFileId)
      if (activeFile) {
        context.files = [{
          name: activeFile.name,
          content: activeFile.content,
          language: activeFile.language,
        }]
      }
    }

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    try {
      // Stream response
      await api.chatWithClaude(
        messages.map(m => ({ role: m.role, content: m.content })).concat([{ role: 'user', content }]),
        context,
        (chunk) => {
          const currentContent = get().streamingContent + chunk
          set({ streamingContent: currentContent })
          
          // Update the assistant message
          set(state => ({
            messages: state.messages.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: currentContent }
                : m
            )
          }))
        }
      )

      // Streaming complete
      const finalContent = get().streamingContent
      if (!finalContent) {
        // Fallback if streaming didn't work
        assistantMessage.content = 'I apologize, but I encountered an issue generating a response. Please try again.'
      }

      set({ 
        isLoading: false,
        streamingContent: ''
      })

      // If we didn't add the assistant message yet (non-streaming), add it now
      if (!get().messages.find(m => m.id === assistantMessage.id)) {
        set(state => ({
          messages: [...state.messages, assistantMessage]
        }))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      assistantMessage.content = 'I apologize, but I encountered an error. Please try again.'
      set(state => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        streamingContent: ''
      }))
    }
  },

  clearChat: () => {
    set({
      messages: [{
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m your AI coding assistant. I can help you write code, debug issues, explain concepts, and more. What would you like to build today?',
        timestamp: new Date(),
      }],
      streamingContent: '',
      isLoading: false
    })
  },

  stopStreaming: () => {
    // In a real implementation, this would cancel the ongoing request
    set({ isLoading: false })
  },
}))