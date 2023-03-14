import axios from "axios";

axios.defaults.baseURL = window.location.origin
axios.defaults.withCredentials = true

export default axios