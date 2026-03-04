import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const register = async (userData: any) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
};

export const login = async (userData: any) => {
    const response = await axios.post(`${API_URL}/auth/login`, userData);
    return response.data;
};
