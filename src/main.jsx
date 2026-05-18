import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LicenseScreen from './components/LicenseScreen.jsx'
import './index.css'

function Root() {
  const [licensed, setLicensed] = useState(false);

  if (!licensed) return <LicenseScreen onSuccess={() => {
    sessionStorage.clear();
    setLicensed(true);
  }} />;

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
)
