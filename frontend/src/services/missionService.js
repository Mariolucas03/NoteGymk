import { apiCall } from '../utils/api';

export const fetchDashboardData = async () => {
    return await apiCall('/dashboard');
};

export const createMission = async (missionData) => {
    return await apiCall('/missions', 'POST', missionData);
};

export const claimDailyReward = async () => {
    return await apiCall('/user/claim-daily', 'POST');
};

export const completeMission = async (id) => {
    return await apiCall(`/missions/${id}/complete`, 'PUT');
};

export const deleteMission = async (id) => {
    return await apiCall(`/missions/${id}`, 'DELETE');
};

export const incrementMission = async (id) => {
    return await apiCall(`/missions/${id}/increment`, 'POST');
};

export const getDailySummary = async () => {
    return await apiCall('/user/summary?date=yesterday');
};
