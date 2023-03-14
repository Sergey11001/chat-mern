import React, {useState} from 'react';
import axios from "../cors/axios";
import {useDispatch, useSelector} from "react-redux";
import {setUserData} from "../redux/slices/user";

const Register = () => {
    const dispatch = useDispatch()
    const [registerForm, setRegisterFrom] = useState({
        username: '',
        password: ''
    })
    const [loginOrRegister, setLoginOrRegister] = useState('login')

    const handleSubmitAuth = async (e) => {
        e.preventDefault()

            axios.post('/' + loginOrRegister, registerForm)
                .then(({data}) => {
                    dispatch(setUserData(data))
                })
    }

    return (
        <div className="bg-blue-100 h-screen flex items-center">
            <form className="w-80 mx-auto flex flex-col" onSubmit={handleSubmitAuth}>
                <input
                    value={registerForm.username}
                    onChange={(e) => setRegisterFrom({...registerForm, username: e.target.value})}
                    type="text"
                    placeholder="username"
                    className="block w-full p-2 text-lg bg-white mb-3"
                />
                <input
                    value={registerForm.password}
                    onChange={(e) => setRegisterFrom({...registerForm, password: e.target.value})}
                    type="password"
                    placeholder="password"
                    className="block w-full p-2 text-lg bg-white mb-3"
                />
                <button className="bg-blue-700 text-white block w-full rounded-l text-lg py-2">
                    {loginOrRegister === 'login' ? "Login" : "Register"}
                </button>
                {
                    loginOrRegister === 'login' ?
                        <div className="mt-3 text-lg">
                            Dont have an account?
                            <span onClick={() => setLoginOrRegister('register')} className="text-red-600  ml-2 cursor-pointer">
                                Register here
                            </span>
                        </div>
                        :
                        <div className="mt-3 text-lg">
                            Already a member?
                            <span className="text-red-600 ml-2 cursor-pointer" onClick={() => setLoginOrRegister('login')}>
                                Login here
                            </span>
                        </div>

                }
            </form>

        </div>
    );
};

export default Register;