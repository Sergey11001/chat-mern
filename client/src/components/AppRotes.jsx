import React, {useEffect} from 'react';
import Register from "../pages/Register";
import {useDispatch, useSelector} from "react-redux";
import axios from "../cors/axios";
import {setReadyTrue, setUserData} from "../redux/slices/user";
import Chat from "../pages/Chat";

const AppRotes = () => {
    const {userData, ready} = useSelector(state => state.user)
    const dispatch = useDispatch()
    useEffect(() => {
        axios.get('/profile').then(({data}) => {
            if (data) {
                dispatch(setUserData(data))
            }
        }).finally(() => dispatch(setReadyTrue()))
    }, [])

    if(!ready) return <></>
    if (userData) return <Chat />
    else {
        return (
            <Register/>
        )
    }

};

export default AppRotes;