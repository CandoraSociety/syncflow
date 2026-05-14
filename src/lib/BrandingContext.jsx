import React, { createContext, useContext, useEffect, useState } from 'react';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await fetch('https://beacon-92324875.base44.app/functions/getHubConfig');
        const result = await response.json();
        const brandingConfig = result.data?.config?.branding;
        
        if (brandingConfig) {
          setBranding(brandingConfig);
          
          // Apply colors to CSS variables
          const primaryColor = brandingConfig.brand_primary_color;
          const secondaryColor = brandingConfig.brand_secondary_color;
          
          if (primaryColor) {
            document.documentElement.style.setProperty('--primary', primaryColor);
          }
          if (secondaryColor) {
            document.documentElement.style.setProperty('--secondary', secondaryColor);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch branding config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};