import 'dotenv/config'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { Client } from 'ssh2'
import stripAnsi from 'strip-ansi'

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public')) // 假设你的前端文件在public文件夹中

io.on('connection', (socket) => {
  console.log('A user connected')

  const conn = new Client()
  conn
    .on('ready', () => {
      console.log('Client :: ready')
      conn.shell((err, stream) => {
        if (err) {
          socket.emit('data', `Error: ${err.message}`)
          return
        }
        socket.on('input', (data) => {
          stream.write(data)
        })
        stream
          .on('data', (data) => {
            const cleanData = stripAnsi(data.toString())
            socket.emit('data', cleanData)
          })
          .on('close', () => {
            conn.end()
          })
      })
    })
    .connect({
      host: process.env.HOST,
      port: process.env.PORT,
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
    })

  socket.on('disconnect', () => {
    console.log('A user disconnected')
    conn.end()
  })
})

server.listen(3000, () => {
  console.log('Server listening on port 3000')
})
