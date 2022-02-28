export function login(username) {
  return fetch('/login',
      { method: 'POST', body: JSON.stringify({ 'username': username }) })
    .then(res => res.json());
}

export function getAllParticipants() {
  return fetch('/participants',
      { method: 'GET' })
    .then(res => res.json());
}

export function disconnectAllParticipants() {
  return fetch('/participants',
      { method: 'DELETE' })
    .then(res => res.json());
}
