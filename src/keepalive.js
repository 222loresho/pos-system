const BACKEND = 'https://pos-backend-kzky.onrender.com';

export function startKeepAlive() {
  const ping = () => {
    fetch(`${BACKEND}/api/products/`).catch(() => {});
  };
  ping();
  setInterval(ping, 9 * 60 * 1000);
}
