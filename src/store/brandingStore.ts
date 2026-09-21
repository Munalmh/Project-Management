import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BRANDING } from '@/lib/branding'

interface BrandingState {
  companyName: string
  logoUrl: string | null
  setCompanyName: (name: string) => void
  setLogoUrl: (url: string | null) => void
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      companyName: BRANDING.companyName,
      logoUrl: null,
      setCompanyName: (name) => set({ companyName: name }),
      setLogoUrl: (url) => set({ logoUrl: url }),
    }),
    {
      name: 'branding-storage',
    }
  )
)
