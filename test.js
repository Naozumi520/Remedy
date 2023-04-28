const WebSocket = require('ws')
const ws = new WebSocket('wss://discord.com/api/v6/gateway')

ws.on('open', () => {
  console.log('Connected to Discord websocket')
})

ws.on('message', data => {
  const message = JSON.parse(data)
  if (message.op === 'DISPATCH' && message.t === 'GUILD_CREATE') {
    console.log('Joined guild ' + message.d.name)
  } else if (message.op === 'DISPATCH' && message.t === 'GUILD_DELETE') {
    console.log('Left guild ' + message.d.name)
  }
})
