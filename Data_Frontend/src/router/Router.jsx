import React from 'react';
import { createHashRouter } from "react-router-dom"; // 👈 cambia aquí
import Error404 from "../components/pages/error404/Error404";
import Products from '../components/pages/productos/Products';
import App from '../components/templates/App';
import Home from '../components/pages/home/Home';
import Login from '../components/pages/login/Login';
import Sensores from '../components/pages/sensores/Sensores';

const router = createHashRouter([  // 👈 también aquí
  {
    path: "/",
    element: <App />,
    errorElement: <Error404 />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/productos",
        element: <Products />,
      },
      {
        path: "/sensores",
        element: <Sensores />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export default router;
