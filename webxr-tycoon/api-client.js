import { useEffect, useState } from 'react';

const API = '/api';

export function useTycoonApi() {
  const [gameId, setGameId] = useState(() => localStorage.getItem('urban-empire-game'));
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function initialise() {
      try {
        const response = gameId
          ? await fetch(`${API}/games/${gameId}`)
          : await fetch(`${API}/games`, { method: 'POST' });
        if (!response.ok) throw new Error('Unable to initialise game session');
        const data = await response.json();
        if (!gameId) {
          localStorage.setItem('urban-empire-game', data.id);
          setGameId(data.id);
        }
        if (active) setGame(data);
      } catch (cause) {
        if (active) setError(cause.message);
      }
    }
    initialise();
    return () => { active = false; };
  }, [gameId]);

  async function action(type, payload = {}) {
    if (!gameId) throw new Error('Game session is not ready');
    const response = await fetch(`${API}/games/${gameId}/actions`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, ...payload })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Action rejected');
    setGame(data.state);
    return data;
  }

  return { game, gameId, error, action };
}
