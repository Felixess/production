import { WebSocketServer, WebSocket } from 'ws' // Import WebSocket here as well

const wsServer = new WebSocketServer({ noServer: true, clientTracking: true })
export default wsServer

export const setupWebSocket = (server) => {
  server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsServer.emit('connection', ws, request)
    })
  })
}

wsServer.on('connection', (ws) => {
  console.log(`New client connected. Total connected clients: ${wsServer.clients.size}`)

  ws.on('message', (data) => {
    console.log(`Received message: ${data}`)
    wsServer.broadcastToAll(data)
  })

  ws.on('close', () => console.info('Client disconnected'))
  ws.on('error', (error) => console.error(`WebSocket error: ${error.message}`))
})

/**
 * Broadcast a message to all connected clients.
 * @param {string} data The message to broadcast.
 */
wsServer.broadcastToAll = function (data) {
  this.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
  console.log(`Broadcasted message to all ${this.clients.size} clients.`)
}
