import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // App.jsx에 UserContextProvider 등이 있다면 유지합니다.
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRouter from './router/AppRouter.jsx';

const router = createBrowserRouter(AppRouter);

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <App>
      <RouterProvider router={router} />
    </App>
  //</React.StrictMode>,
);
