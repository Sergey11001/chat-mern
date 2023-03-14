const UserModel = require("./models/UserModel");
const MessageModel = require("./models/MessageModel");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const fs = require('fs')
dotenv.config()

const express = require('express')
const ws = require('ws')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/chatMERN');

const bcryptSalt = bcrypt.genSaltSync(10)

const app = express()
app.use('/uploads', express.static(__dirname + "/uploads"))
app.use(express.json())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))
app.use(cookieParser())


const port = process.env.PORT

const getUserDataFromToken = (req) => {
    return new Promise((resolve, reject) => {
        const {token} = req.cookies
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                if (err) reject(err)
                else resolve(userData)
            })
        } else {
            reject(new Error('no token'))
        }
    })
}

app.get('/profile', (req, res) => {
    const {token} = req.cookies
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
            if (err) res.status(404).json("Invalid token")
            res.json(userData)
        })
    } else {
        res.status(401).json('no token')
    }

})

app.post('/login', (req, res) => {
    const {username, password} = req.body
    UserModel.findOne({username})
        .then((user) => {
            if (bcrypt.compareSync(password, user.password)) {
                jwt.sign({userId: user._id, username}, process.env.JWT_SECRET, {
                        expiresIn: '12h',
                        algorithm: "HS256"
                    },
                    (err, token) => {
                        if (err) return res.status(404).json({
                            message: "Error with creating token"
                        })
                        res.cookie('token', token).status(201).json({
                            userId: user._id,
                            username
                        })
                    })
            }
        })
        .catch(() => {
            return res.status(400).json({
                message: "User not found"
            })
        })
})

app.get('/logout', (req,res) => {
    res.cookie('token', '').json('ok')
})

app.post('/register', (req, res) => {
    const {username, password} = req.body
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
    const user = UserModel.create({username, password: hashedPassword})

    jwt.sign({userId: user._id, username}, process.env.JWT_SECRET, {
            expiresIn: '12h',
            algorithm: "HS256"
        },
        (err, token) => {
            if (err) return res.status(404).json({
                message: "Error with creating token"
            })

            res.cookie('token', token).status(201).json({
                userId: user._id,
                username
            })
        })
})

app.get('/people', async (req, res) => {
    const users = await UserModel.find({}, {username:1})
    res.json(users)
})

app.get('/messages/:id', async (req, res) => {
    const {id} = req.params
    const {userId} = await getUserDataFromToken(req)
    const messages = await MessageModel.find({
        sender: {$in: [userId, id]},
        recipient: {$in: [userId, id]}
    }).sort({createdAt: 1})
    res.json(messages)
})

const server = app.listen(port, () => {
    console.log("Server is started on port " + port)
})

const wss = new ws.WebSocketServer({server})

wss.on('connection', (connection, req) => {
    const getOnlinePeople = () => {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify(
                {
                    online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))
                }
            ))
        })
    }

    connection.isAlive = true
    connection.timer = setInterval(() => {
        connection.ping()
        connection.deathTimer = setTimeout(() => {
            connection.isAlive=false
            connection.terminate()
            clearInterval(connection.timer)
            getOnlinePeople()
            console.log("dead")
        }, 1000)
    }, 8000)

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer)
    })
    const cookies = req.headers.cookie
    if (cookies) {
        const cookieTokenStr = cookies.split('; ').find(str => str.startsWith('token='))
        if (cookieTokenStr) {
            const token = cookieTokenStr.split('=')[1]
            if (token)  {
                jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                    if (err) throw err
                    else {
                        const {username, userId} = userData
                        connection.userId = userId
                        connection.username = username
                    }
                })
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString())
        const {recipient, text, file} = messageData.message
        let filename = null
        if(file){
            const parts = file.name.split('.')
            const ext = parts[parts.length-1]
            filename = Date.now() + '.' + ext
            const path = __dirname + '/uploads/' + filename
            const bufferData = new Buffer(file.data.split(',')[1], 'base64')
            fs.writeFile(path,bufferData, () => {
                console.log('file saved')
            } )
        }
        if (recipient && (text || file)){
            const message = await MessageModel.create({
                sender: connection.userId,
                recipient,
                text,
                file: filename
            });
            [...wss.clients].filter(c => c.userId === recipient)
                .forEach(client => {
                    client.send(JSON.stringify({text, sender: connection.userId, recipient, _id: message._id, file:filename}))
                })
        }
    });
    getOnlinePeople()
})