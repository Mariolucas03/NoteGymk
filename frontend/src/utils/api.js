// FORZAR CONEXIÓN LOCAL
const API_URL = 'http://localhost:5000/api';

export const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    };

    const res = await fetch(`${API_URL}${endpoint}`, config);
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            throw new Error('Unauthorized');
        }
        const err = await res.json();
        throw new Error(err.message || 'API Error');
    }
    return res.json();
};

export { API_URL };
