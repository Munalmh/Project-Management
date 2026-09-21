import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import OrganizationManagement from './pages/OrganizationManagement';
import UserManagement from './pages/UserManagement';
import CaseIntake from './pages/CaseIntake';
import BeneficiaryProfile from './pages/BeneficiaryProfile';
import RescueHandover from './pages/RescueHandover';
import Assessment from './pages/Assessment';
import CasePlanning from './pages/CasePlanning';
import SupportManagement from './pages/SupportManagement';
import ReferralTransfer from './pages/ReferralTransfer';
import ExternalReferral from './pages/ExternalReferral';
import Reintegration from './pages/Reintegration';
import FollowUp from './pages/FollowUp';
import CaseClosure from './pages/CaseClosure';
import Reporting from './pages/Reporting';
import PrivacyAudit from './pages/PrivacyAudit';
import BrandingSettings from './pages/BrandingSettings';
import { BrandingProvider } from './contexts/BrandingContext';

export default function App() {
  return (
    <BrandingProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/organization-management" element={<OrganizationManagement />} />
            <Route path="/users-roles" element={<UserManagement />} />
            <Route path="/case-intake" element={<CaseIntake />} />
            <Route path="/beneficiary-profile" element={<BeneficiaryProfile />} />
            <Route path="/rescue-referral" element={<RescueHandover />} />
            <Route path="/rescue-handover" element={<RescueHandover />} />
            <Route path="/internal-referral" element={<ReferralTransfer />} />
            <Route path="/external-referral" element={<ExternalReferral />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/case-planning" element={<CasePlanning />} />
            <Route path="/support-management" element={<SupportManagement />} />
            <Route path="/referral-transfer" element={<ReferralTransfer />} />
            <Route path="/reintegration" element={<Reintegration />} />
            <Route path="/follow-up" element={<FollowUp />} />
            <Route path="/case-closure" element={<CaseClosure />} />
            <Route path="/reporting-me" element={<Reporting />} />
            <Route path="/privacy-audit" element={<PrivacyAudit />} />
            <Route path="/branding" element={<BrandingSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BrandingProvider>
  );
}