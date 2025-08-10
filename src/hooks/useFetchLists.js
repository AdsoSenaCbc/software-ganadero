// src/hooks/useFetchLists.js
import { useEffect, useState, useRef } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Generic hook to fetch multiple reference lists in parallel.
 * @param {Object} routeMap { key: url }
 * @param {string} token JWT (optional)
 * @returns {{ lists:Object, loading:boolean, error:string|null }}
 */
export default function useFetchLists(routeMap = {}, token) {
  const [lists, setLists] = useState(() => {
    const init = {};
    Object.keys(routeMap).forEach((k) => (init[k] = []));
    return init;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Usamos ref para identificar si el componente está montado en la ejecución actual del efecto
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    setError(null);
    const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const fetchData = async () => {
      try {
        const entries = Object.entries(routeMap);
        const promises = entries.map(([key, url]) =>
          axiosInstance.get(url, cfg).then((res) => ({ key, data: res.data }))
        );
        const results = await Promise.allSettled(promises);
        const newLists = { ...lists };
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            newLists[result.value.key] = result.value.data;
          } else {
            console.error(`Error fetching ${result.reason.config.url}:`, result.reason);
            setError((prev) => prev ? `${prev}, ${result.reason.message}` : result.reason.message);
          }
        });
        if (isMounted.current) setLists(newLists); // Solo actualizar si está montado
      } catch (err) {
        console.error('General error fetching lists:', err);
        if (isMounted.current) setError(err.message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchData();

    return () => {
      // Marcamos como desmontado para evitar setState después de un unmount
      isMounted.current = false;
    };
  }, [routeMap, token]); // Dependencias estables

  return { lists, loading, error };
}