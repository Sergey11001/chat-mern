import React, {useEffect, useMemo, useRef, useState} from 'react';
import Avatar from "../components/Avatar";
import {useDispatch, useSelector} from "react-redux";
import axios from "../cors/axios";
import {uniqBy} from "lodash";
import {setUserData} from "../redux/slices/user";

const Chat = () => {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlinePeople] = useState({})
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [arrayMessages, setArrayMessages] = useState([])
    const {username: usernameMy, userId} = useSelector(state => state.user.userData)
    const blockUnderMessages = useRef(null)
    const [allUsers, setAllUsers] = useState({})
    const dispatch = useDispatch()

    const filteredMessages = useMemo(() => uniqBy(arrayMessages, "_id"), [arrayMessages])

    const logoutHandle = (e) => {
        e.preventDefault()
        axios.get('/logout').then(() => dispatch(setUserData(null)))

    }

    const handleMessage = (e) => {
        const messageData = JSON.parse(e.data)
        if ('online' in messageData) {
            showOnlinePeople(messageData.online)
        }
        if ('text' in messageData) {
            if (messageData.sender === selectedUserId) {
                setArrayMessages(prev => [...prev, {...messageData}])
            }
        }
    }

    const showOnlinePeople = (peopleArray) => {
        const people = {}
        peopleArray.forEach(({userId, username}) => {
            if (username !== usernameMy) people[userId] = username
        })
        setOnlinePeople(people)
    }

    const sendMessage = (e, file = null) => {
        if (e) {
            e.preventDefault()
        }
        ws.send(JSON.stringify({
            message: {
                recipient: selectedUserId, text: messageText, file
            }
        }))
        if (file) {
            setTimeout(() => axios.get('/messages/' + selectedUserId).then(({data}) => setArrayMessages(data)), 0)

        } else {
            setArrayMessages(prev => [...prev, {
                text: messageText, sender: userId, _id: +new Date() + ''
            }])
            setMessageText('')
        }
    }

    const sendFile = (e) => {
        const reader = new FileReader()
        reader.readAsDataURL(e.target.files[0])
        reader.onload = () => {
            sendMessage(null, {
                name: e.target.files[0].name, data: reader.result
            })
        }
    }


    const connectToWs = () => {
        const _ws = new WebSocket('ws://localhost:3001')
        setWs(_ws)
        _ws.addEventListener('message', handleMessage)
        _ws.addEventListener('close', () => {
            setTimeout(() => connectToWs(), 1000)
        })
    }

    useEffect(() => {
        connectToWs()
    }, [])

    useEffect(() => {
        if (arrayMessages[arrayMessages.length - 1]?.sender === userId) {
            blockUnderMessages.current.scrollIntoView({behavior: 'smooth', block: "end"});
        }
    }, [arrayMessages])

    useEffect(() => {
        if (selectedUserId) {
            axios.get('/messages/' + selectedUserId).then(({data}) => setArrayMessages(data))
        }
    }, [selectedUserId])

    useEffect(() => {
        axios.get('/people').then(({data}) => {
            const all = {}
            data.forEach(el => {
                return el._id !== userId ? all[el._id] = el : null
            })
            setAllUsers(all)
        })
    }, [onlinePeople])

    return (<div className="flex h-screen">
        <div className="bg-white w-1/3 p-3 flex flex-col">
            <p className="font-bold text-blue-400 text-xl mb-3">MernChat</p>
            <div className="flex-grow">
                {Object.keys(allUsers).map(userId => (<div
                    key={userId}
                    onClick={() => setSelectedUserId(userId)}
                    className={'p-2 border-b border-gray-200 py-2 flex gap-2 items-center cursor-pointer ' + (selectedUserId === userId ? 'bg-blue-200' : '')}
                >
                    <Avatar online={userId in onlinePeople} userId={userId}
                            letter={allUsers[userId].username[0]}/>
                    <span className="text-lg">{allUsers[userId].username}</span>
                </div>))}
            </div>
            <button onClick={logoutHandle}
                    className="text-center w-fit self-center bg-blue-400 py-2 px-3 text-white">Logout
            </button>
        </div>
        <div className="bg-blue-100 w-2/3 p-2 flex flex-col">
            <div className="flex-grow overflow-auto">
                {!selectedUserId ?
                    <div className="flex h-full items-center justify-center text-xl">no selected person</div> :
                    <div className="flex flex-col">
                        {filteredMessages.map(message => (
                            <div
                                key={message._id}
                                className={"p-3 rounded-lg max-content max-w-lg mb-4 " + (message.sender === userId ? "bg-blue-500 text-white ml-auto" : "bg-white text-gray-500")}
                            >
                                {message.text}
                                {message.file ?
                                    <div>
                                        <a className="underline flex gap-1 items-center"
                                           href={'http://localhost:3001/uploads/' + message.file}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                 viewBox="0 0 24 24"
                                                 strokeWidth="1.5" stroke="currentColor"
                                                 className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
                                            </svg>
                                            {message.file}
                                        </a>

                                    </div>
                                    :
                                    <></>
                                }
                            </div>

                        ))}
                        <div ref={blockUnderMessages}></div>
                    </div>}
            </div>
            {selectedUserId ? <form className="flex gap-2 mx-2 pt-2" onSubmit={sendMessage}>
                    <input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        type="text"
                        placeholder="Type your message"
                        className='border flex-grow p-2'
                    />
                    <label className="bg-blue-200 text-gray-700 p-2 cursor-pointer">
                        <input type="file" className="hidden" onChange={sendFile}/>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
                        </svg>
                    </label>
                    <button type={"submit"} className="bg-blue-600 p-2 w-20 text-white text-xl">+</button>
                </form>
                :
                null
            }
        </div>

    </div>);
};

export default Chat;