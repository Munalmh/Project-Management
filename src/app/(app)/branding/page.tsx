'use client'

import React, { useRef, useState } from 'react'
import { useBrandingStore } from '@/store/brandingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Image as ImageIcon } from 'lucide-react'

export default function BrandingSettingsPage() {
  const { companyName, setCompanyName, logoUrl, setLogoUrl } = useBrandingStore()
  const [localName, setLocalName] = useState(companyName)
  const [localLogo, setLocalLogo] = useState(logoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLocalLogo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    setCompanyName(localName)
    setLogoUrl(localLogo)
    toast.success('Branding settings saved successfully')
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Branding Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customize the application appearance for your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Update your company name and logo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-md">
            <label htmlFor="companyName" className="text-sm font-medium">
              Company Name
            </label>
            <Input
              id="companyName"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              Company Logo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden shrink-0">
                {localLogo ? (
                  <img src={localLogo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="text-muted-foreground h-8 w-8" />
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
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Logo
                  </Button>
                  {localLogo && (
                    <Button variant="destructive" onClick={handleRemoveLogo}>
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended size: 256x256px. Max file size: 2MB.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} className="ml-auto">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
