import React, {useEffect, useState, useContext} from 'react'
import {BrowserRouter, Routes, Route, useNavigate} from "react-router-dom";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Init from './assets/sites/init.jsx'
import MainSite from './assets/sites/MainSite.jsx'
import { GlobalContext } from "./assets/Context/GlobalContext.jsx";


function App() {
  const { variables, updateVariables } = useContext(GlobalContext);
  const [retryCount, setRetryCount] = useState(0); // Track the number of retries


    const navigate = useNavigate();  // Initialize the navigate function

  useEffect(() => {
      updateVariables()
          .then(() => {
              if(variables.isConfigured !== undefined){
                  console.log(variables.isConfigured)
                  if(variables.isConfigured == 0){
                      navigate('/init');
                  }
                  else {
                      navigate('/main')
                  }
              }
              else {
                  setRetryCount(retryCount+1)
                  console.log(variables.isConfigured)
              }

          })
      }, [retryCount]);

  return (
    <>

    </>
  )
}

export default App
