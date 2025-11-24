import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import Map from './Map';
import WebSocketTest from './TestingScreens/WebSocketTestPage';

function App() {
  // TODO: Add proper authentication state management
  const isAuthenticated = false;

  return (
    <WebSocketTest></WebSocketTest>

  );
}

export default App;
