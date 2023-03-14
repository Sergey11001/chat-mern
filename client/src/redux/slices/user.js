import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    userData:null,
    ready:false
}


export const userSlice = createSlice({
    initialState,
    name:"user",
    reducers:{
        setUserData: (state, action) => {
            state.userData = action.payload
        },
        setReadyTrue:(state) => {
            state.ready = true
        }
    }

})

export const {setUserData, setReadyTrue} = userSlice.actions
export const userReducer = userSlice.reducer