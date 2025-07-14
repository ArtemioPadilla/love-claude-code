// Function worker process
// This runs in a separate process to execute user functions safely

process.on('message', async (message) => {
  if (message.type === 'invoke') {
    try {
      // Load the function module
      const functionModule = await import('./index.js')
      
      // Get handler name from environment
      const handlerName = process.env.FUNCTION_HANDLER || 'handler'
      const handler = functionModule[handlerName] || functionModule.default
      
      if (!handler) {
        throw new Error(`Handler '${handlerName}' not found in function module`)
      }
      
      // Create event object
      const event = {
        body: message.payload,
        headers: {},
        httpMethod: 'POST',
        path: '/'
      }
      
      // Create context object
      const context = {
        functionName: process.cwd().split('/').pop(),
        requestId: Math.random().toString(36).substring(7),
        getRemainingTimeInMillis: () => {
          const timeout = parseInt(process.env.FUNCTION_TIMEOUT || '30000')
          const elapsed = Date.now() - startTime
          return Math.max(0, timeout - elapsed)
        }
      }
      
      const startTime = Date.now()
      
      // Execute handler
      const result = await handler(event, context)
      
      // Send result back to parent
      process.send({ type: 'result', data: result })
    } catch (error) {
      // Send error back to parent
      process.send({ 
        type: 'error', 
        error: error.message || 'Unknown error'
      })
    }
    
    // Exit after execution
    process.exit(0)
  }
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  process.send({ 
    type: 'error', 
    error: `Uncaught exception: ${error.message}`
  })
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  process.send({ 
    type: 'error', 
    error: `Unhandled rejection: ${reason}`
  })
  process.exit(1)
})