import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const calculateIS456 = async (params) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/calculate-is456`, params);
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || 'Calculation failed';
    }
};

export const predictNN = async (params) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/predict-nn`, params);
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || 'Prediction failed';
    }
};
