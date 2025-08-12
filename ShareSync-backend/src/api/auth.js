// /src/api/auth.js
export async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json(); // expect { access_token?, refresh_token?, user? } or similar
  }
  