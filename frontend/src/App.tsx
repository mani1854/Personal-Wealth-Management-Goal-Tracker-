import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Portfolio from './pages/Portfolio';
import Simulations from './pages/Simulations';
import Predictions from './pages/Predictions';
import Chatbot from './pages/Chatbot';
import News from './pages/News';
import GoalRecommender from './pages/GoalRecommender';
import PortfolioRecommender from './pages/PortfolioRecommender';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/news" element={<News />} />
            <Route path="/goal-recommender" element={<GoalRecommender />} />
            <Route path="/portfolio-recommender" element={<PortfolioRecommender />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
