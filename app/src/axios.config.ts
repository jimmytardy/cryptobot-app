import axios from 'axios';
// Next we make an 'instance' of it
const axiosClient = axios.create({
// .. where we make our configurations
    baseURL: window.location.origin + '/api'
});

const token = localStorage.getItem('token');

if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
} else {
    delete axios.defaults.headers.common["Authorization"];
}

export default axiosClient;