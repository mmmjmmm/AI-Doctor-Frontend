import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import ChatPage from '@/pages/ChatPage';
import OpenAppPage from '@/pages/OpenAppPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'chat/:sessionId',
        element: <ChatPage />,
      },
      {
        path: 'open-app',
        element: <OpenAppPage />,
      },
    ],
  },
]);
