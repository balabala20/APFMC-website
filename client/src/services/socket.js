import { io } from 'socket.io-client';

let socket;
export function initSocket(){
  if (!socket) {
    // Priority:
    // 1) REACT_APP_SERVER_URL (set this in Vercel for production when
    //    the frontend is hosted separately from the API)
    // 2) during local dev (localhost:3000) default to http://localhost:5000
    // 3) otherwise use same origin the page was loaded from
    const envUrl = process.env.REACT_APP_SERVER_URL;
    let serverUrl;
    if (envUrl && envUrl.length) {
      serverUrl = envUrl;
      if (!/^https?:\/\//i.test(serverUrl)) serverUrl = `${window.location.protocol}//${serverUrl}`;
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      serverUrl = 'http://localhost:5000';
    } else {
      serverUrl = window.location.origin;
    }

    console.log('initSocket connecting to', serverUrl);
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => console.log('socket.io connected', socket.id));
    socket.on('connect_error', (err) => console.error('socket.io connect_error', err));
    socket.on('disconnect', (reason) => console.warn('socket.io disconnected', reason));
  }
  return socket;
}

export function getSocket(){ return socket; }
