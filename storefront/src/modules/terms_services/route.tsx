// src/app/routes.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TermsAndConditions from './terms-and-services';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Andere Routen */}
        <Route path="/agb" element={<TermsAndConditions />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;