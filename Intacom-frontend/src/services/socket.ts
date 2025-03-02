import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  withCredentials: true, // For cookies
});

socket.on('connect', () => console.log('Connected to Socket.IO'));
socket.on('disconnect', () => console.log('Disconnected from Socket.IO'));

socket.on('newAnnouncement', (data: any) => console.log('New announcement:', data));
socket.on('newTask', (data: any) => console.log('New task:', data));