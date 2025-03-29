"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import Select from "react-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CreateClassRequest = () => {
  const [formData, setFormData] = useState({
    companyId: "",
    siteId: "",
    classTypes: [], // Updated to store selected class types
    preferredDateStart: "",
    preferredDateEnd: "",
    notes: "",
  })
  const [companies, setCompanies] = useState([])
  const [sites, setSites] = useState([])
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })
  const [newSite, setNewSite] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [showAddSite, setShowAddSite] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const classTypes = [
    "AED",
    "CPR",
    "BBP",
    "SFA",
    "EFA",
    "40 Hour First Responder",
    "Advanced SFA",
    "AHA CPR Pro",
    "ASHI BLS",
    "ASHI CABS",
    "ASHI CPR Pro",
    "Babysitter Safety 101",
    "Babysitter Safety 102",
    "Earthquake Preparedness",
    "ECSI CPR Pro",
    "Infant CPR",
    "Pediatric CPR",
  ]

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (formData.companyId) {
      fetchSites(formData.companyId)
    }
  }, [formData.companyId])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("Company")
        .select("pkCompany, CompName")
        .order("CompName", { ascending: true })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const fetchSites = async (companyId) => {
    try {
      const { data, error } = await supabase
        .from("Site")
        .select("pkSiteID, SiteName, SiteAdd1, SiteCity, SiteState, SiteZip")
        .eq("fkCompID", companyId)
        .order("SiteName", { ascending: true })

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error("Error fetching sites:", error)
    }
  }

  const handleAddCompany = async () => {
    if (!newCompany.name) {
      alert("Please enter a company name.")
      return
    }

    try {
      const { data, error } = await supabase
        .from("Company")
        .insert({
          CompName: newCompany.name,
          CompAdd1: newCompany.address,
          CompCity: newCompany.city,
          CompState: newCompany.state,
          CompZip: newCompany.zip,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Company Added",
        description: "The new company has been successfully added.",
      })

      setCompanies((prev) => [...prev, data])
      setFormData({ ...formData, companyId: data.pkCompany })
      setNewCompany({ name: "", address: "", city: "", state: "", zip: "" })
      setShowAddCompany(false)
    } catch (error) {
      console.error("Error adding company:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the company.",
      })
    }
  }

  const handleAddSite = async () => {
    if (!newSite.name || !formData.companyId) {
      alert("Please enter a site name and select a company.")
      return
    }

    try {
      const { data, error } = await supabase
        .from("Site")
        .insert({
          SiteName: newSite.name,
          SiteAdd1: newSite.address,
          SiteCity: newSite.city,
          SiteState: newSite.state,
          SiteZip: newSite.zip,
          fkCompID: formData.companyId,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Site Added",
        description: "The new site has been successfully added.",
      })

      setSites((prev) => [...prev, data])
      setFormData({ ...formData, siteId: data.pkSiteID })
      setNewSite({ name: "", address: "", city: "", state: "", zip: "" })
      setShowAddSite(false)
    } catch (error) {
      console.error("Error adding site:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the site.",
      })
    }
  }

  const handleClassTypeChange = (classType) => {
    setFormData((prev) => {
      const isSelected = prev.classTypes.includes(classType)
      const updatedClassTypes = isSelected
        ? prev.classTypes.filter((type) => type !== classType)
        : [...prev.classTypes, classType]
      return { ...prev, classTypes: updatedClassTypes }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from("pending_class").insert({
        company_id: formData.companyId,
        site_id: formData.siteId,
        class_types: formData.classTypes.join(", "), // Save as a comma-separated string
        preferred_date_start: formData.preferredDateStart,
        preferred_date_end: formData.preferredDateEnd,
        notes: formData.notes,
        status: "pending",
        created_by: supabase.auth.user().id,
      })

      if (error) throw error

      toast({
        title: "Class Request Created",
        description: "The class request has been successfully created.",
      })
      navigate("/dashboard")
    } catch (error) {
      console.error("Error creating class request:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the class request.",
      })
    }
  }

  const companyOptions = companies.map((company) => ({
    value: company.pkCompany,
    label: company.CompName,
  }))

  const siteOptions = sites.map((site) => ({
    value: site.pkSiteID,
    label: (
      <div>
        <span className="font-bold">{site.SiteName}</span>
        <br />
        <span className="text-sm text-gray-500">
          {site.SiteAdd1}, {site.SiteCity}, {site.SiteState} {site.SiteZip}
        </span>
      </div>
    ),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Class Request</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Dropdown */}
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium">
            Select Company
          </label>
          <Select
            options={companyOptions}
            value={companyOptions.find((option) => option.value === formData.companyId)}
            onChange={(selectedOption) => setFormData({ ...formData, companyId: selectedOption.value })}
            className="w-full"
            placeholder="Choose a company"
          />
          <Button
            variant="link"
            className="mt-2 text-sm"
            onClick={() => setShowAddCompany((prev) => !prev)}
          >
            {showAddCompany ? "Cancel" : "Add New Company"}
          </Button>
        </div>

        {showAddCompany && (
          <div className="space-y-2">
            <Input
              placeholder="Company Name"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={newCompany.address}
              onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
            />
            <Input
              placeholder="City"
              value={newCompany.city}
              onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
            />
            <Input
              placeholder="State"
              value={newCompany.state}
              onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
            />
            <Input
              placeholder="Zip"
              value={newCompany.zip}
              onChange={(e) => setNewCompany({ ...newCompany, zip: e.target.value })}
            />
            <Button onClick={handleAddCompany}>Add Company</Button>
          </div>
        )}

        {/* Site Dropdown */}
        <div>
          <label htmlFor="siteId" className="block text-sm font-medium">
            Select Site
          </label>
          <Select
            options={siteOptions}
            value={siteOptions.find((option) => option.value === formData.siteId)}
            onChange={(selectedOption) => setFormData({ ...formData, siteId: selectedOption.value })}
            className="w-full"
            placeholder="Choose a site"
            isDisabled={!formData.companyId} // Disable if no company is selected
          />
          <Button
            variant="link"
            className="mt-2 text-sm"
            onClick={() => setShowAddSite((prev) => !prev)}
            disabled={!formData.companyId} // Disable if no company is selected
          >
            {showAddSite ? "Cancel" : "Add New Site"}
          </Button>
        </div>

        {showAddSite && (
          <div className="space-y-2">
            <Input
              placeholder="Site Name"
              value={newSite.name}
              onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={newSite.address}
              onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
            />
            <Input
              placeholder="City"
              value={newSite.city}
              onChange={(e) => setNewSite({ ...newSite, city: e.target.value })}
            />
            <Input
              placeholder="State"
              value={newSite.state}
              onChange={(e) => setNewSite({ ...newSite, state: e.target.value })}
            />
            <Input
              placeholder="Zip"
              value={newSite.zip}
              onChange={(e) => setNewSite({ ...newSite, zip: e.target.value })}
            />
            <Button onClick={handleAddSite}>Add Site</Button>
          </div>
        )}

        {/* Class Type Checkboxes */}
        <div>
          <label htmlFor="classTypes" className="block text-sm font-medium">
            Select Class Types
          </label>
          <div className="grid grid-cols-2 gap-2">
            {classTypes.map((classType) => (
              <div key={classType} className="flex items-center">
                <input
                  type="checkbox"
                  id={classType}
                  checked={formData.classTypes.includes(classType)}
                  onChange={() => handleClassTypeChange(classType)}
                  className="mr-2"
                />
                <label htmlFor={classType} className="text-sm">
                  {classType}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Dates */}
        <div>
          <label htmlFor="preferredDateStart" className="block text-sm font-medium">
            Preferred Start Date
          </label>
          <Input
            id="preferredDateStart"
            name="preferredDateStart"
            type="date"
            value={formData.preferredDateStart}
            onChange={(e) => setFormData({ ...formData, preferredDateStart: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="preferredDateEnd" className="block text-sm font-medium">
            Preferred End Date
          </label>
          <Input
            id="preferredDateEnd"
            name="preferredDateEnd"
            type="date"
            value={formData.preferredDateEnd}
            onChange={(e) => setFormData({ ...formData, preferredDateEnd: e.target.value })}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="block w-full border rounded-md p-2"
          />
        </div>

        <Button type="submit" disabled={!formData.companyId || !formData.siteId || formData.classTypes.length === 0}>
          Submit Request
        </Button>
      </form>
    </div>
  )
}

export default CreateClassRequest