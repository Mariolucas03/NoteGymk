// frontend/src/config.js

// ⚠️ CONFIRMA QUE ESTA ES TU IP ACTUAL DEL PC
const MI_IP_LOCAL = '192.168.1.131';

export const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : `http://${MI_IP_LOCAL}:5000`;