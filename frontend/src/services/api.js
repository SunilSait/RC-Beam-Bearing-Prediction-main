import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

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
