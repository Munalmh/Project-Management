import React, { useRef, useState } from 'react';
import { useBranding } from '../contexts/BrandingContext';

export default function BrandingSettings() {
  const { companyName, setCompanyName, logoUrl, setLogoUrl } = useBranding();
  const [localName, setLocalName] = useState(companyName);
  const [localLogo, setLocalLogo] = useState(logoUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLocalLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    setCompanyName(localName);
    setLogoUrl(localLogo);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Branding Settings</h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Customize the application appearance for your organization.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Company Name */}
          <div className="space-y-3 max-w-md">
            <label htmlFor="companyName" className="block text-sm font-medium text-on-surface">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full h-10 px-4 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter company name"
            />
          </div>

          <div className="h-px bg-outline-variant/30"></div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-on-surface">
              Company Logo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface-container-lowest overflow-hidden shrink-0">
                {localLogo ? (
                  <img src={localLogo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="material-symbols-outlined text-outline text-3xl">image</span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Upload Logo
                  </button>
                  {localLogo && (
                    <button
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 bg-error/10 text-error text-sm font-medium rounded-lg hover:bg-error/20 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant">
                  Recommended size: 256x256px. Max file size: 2MB.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/50 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-sm font-medium text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Settings saved successfully
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
