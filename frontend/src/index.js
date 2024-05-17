import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { useLocation, useNavigate } from 'react-router-dom';

//new
import './App.css';
import SignUp from "./SignUp/SignUp";
import SignIn from "./SignIn/SignIn";
import Chat from "./Chat/Chat";
import ChatList from "./ChatList/ChatList";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
