// src/utils/postData.js
import Swal from 'sweetalert2/dist/sweetalert2.js';
import axiosInstance from '../api/axiosConfig';

/**
 * Wrapper for POST/PUT requests with JWT.
 * @param {string} url endpoint URL
 * @param {Object} payload body
 * @param {string} token JWT token
 * @param {string} successMsg message for success alert
 * @returns {Promise<any>} backend response data
 */
export const postData = async (url, payload, token, successMsg = 'Guardado correctamente') => {
  try {
    const { status, data } = await axiosInstance.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (status === 201 || status === 200) {
      Swal.fire('Éxito', successMsg, 'success');
    }
    return data;
  } catch (err) {
    const backendMsg =
      err.response?.data?.error || JSON.stringify(err.response?.data || 'Error desconocido');
    console.error('Error backend:', backendMsg);
    Swal.fire('Error', backendMsg, 'error');
    throw err;
  }
};
