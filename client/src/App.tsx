import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import LeafletMap from './components/LeafletMap';
import ReportIncident from './pages/ReportIncident';

import ProtectedRoute from './components/ProtectedRoute';
import AuthorityDashboard from './components/AuthorityDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LeafletMap />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="report" element={<ReportIncident />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['moderator', 'authority_admin', 'super_admin']} />}>
          <Route path="dashboard" element={<AuthorityDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
