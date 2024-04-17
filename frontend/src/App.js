import './App.css';
import './SignUp/SignUp'
import React from 'react';

import SignUp from "./SignUp/SignUp";
import SignIn from "./SignIn/SignIn";
import Chat from "./Chat/Chat";

import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

function App() {
  return (
      <React.StrictMode>
          <Router>
              <Routes>
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/user" element={<Chat/>} />
                  <Route path="/" element={<SignIn />} />
              </Routes>
          </Router>

      </React.StrictMode>
  );
}

export default App;
