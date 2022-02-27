export function login(username) {
  return fetch('/login',
      { method: 'POST', body: JSON.stringify({ 'username': username }) })
    .then(res => res.json());
}
