import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import HomePage from './pages/HomePage/HomePage.tsx'
import RegisterPage from './pages/RegisterPage/RegisterPage.tsx'

const router = createBrowserRouter([
  { path: "/", element: <HomePage/>},
  { path: "/register", element: <RegisterPage/>},
  { path: "*", element: <HomePage/>}
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
