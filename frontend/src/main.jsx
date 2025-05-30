import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './output.css'

import Layout from './components/Layout'
import JournalList from './pages/JournalList'
import JournalEntry from './pages/JournalEntry'
import AIChat from './pages/AIChat'
import { ChatProvider } from './contexts/ChatContext'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <JournalList />
      },
      {
        path: 'entry/:id',
        element: <JournalEntry />
      },
      {
        path: 'new',
        element: <JournalEntry />
      },
      {
        path: 'chat',
        element: <AIChat />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  </React.StrictMode>,
)
