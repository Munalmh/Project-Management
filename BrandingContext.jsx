import React, { createContext, useContext, useState, useEffect } from 'react';

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('companyName') || 'CRPCMS';
  });
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('logoUrl') || null;
  });

  useEffect(() => {
    localStorage.setItem('companyName', companyName);
  }, [companyName]);

  useEffect(() => {
    if (logoUrl) {
      localStorage.setItem('logoUrl', logoUrl);
    } else {
      localStorage.removeItem('logoUrl');
    }
  }, [logoUrl]);

  return (
    <BrandingContext.Provider value={{ companyName, setCompanyName, logoUrl, setLogoUrl }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
