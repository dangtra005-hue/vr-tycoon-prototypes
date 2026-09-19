# Full-stack client integration

The authoritative API client is available at `api-client.js`.

The existing single-file demo remains playable offline. To connect a UI control to the authoritative economy, call:

```js
const response = await fetch(`/api/games/${gameId}/actions`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ type: 'next-day' })
});
const { state } = await response.json();
```

For a production frontend, migrate the inline simulation calls to this API and render only the returned `state`. This prevents browser-side cheating and makes saves portable across devices.
