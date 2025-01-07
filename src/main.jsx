import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {GlobalProvider} from "./assets/Context/GlobalContext.jsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import MainSite from "./assets/sites/MainSite.jsx";
import Init from "./assets/sites/init.jsx";
import Loading from "./assets/sites/Loading.jsx";

createRoot(document.getElementById('root')).render(
  <GlobalProvider>
      <BrowserRouter>
          <App />
          <Routes>
              <Route path={"/"} element={<Loading />}/>
              <Route path={"/init"} element={<Init />} />
              <Route path={"/main"} element={<MainSite/>}/>
          </Routes>
      </BrowserRouter>
  </GlobalProvider>,
)
