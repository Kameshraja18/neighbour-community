import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getIncidents = async (params?: any) => {
    const response = await axios.get(`${API_URL}/incidents`, { params });
    return response.data;
};

export const createIncident = async (incidentData: any) => {
    const token = localStorage.getItem('token');
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type is auto-set by axios for FormData, or json otherwise
        },
    };
    const response = await axios.post(`${API_URL}/incidents`, incidentData, config);
    return response.data;
};

export const updateIncidentStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/incidents/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};
