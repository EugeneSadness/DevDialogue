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
    {/* <Router> */}

{/* </Router> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
