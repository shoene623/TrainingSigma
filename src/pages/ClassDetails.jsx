"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const CreateClassRequest = () => {
  const [formData, setFormData] = useState({
    siteId: "",
    classType: "",
    preferredDateStart: "",
    preferredDateEnd: "",
    address: "",
    notes: "",
  })
  const [sites, setSites] = useState([])
  const [newSiteName, setNewSiteName] = useState("")
  const [showAddSite, setShowAddSite] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from("Site")
        .select("pkSiteID, SiteName") // Fetch pkSiteID and SiteName
        .order("SiteName", { ascending: true })

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error("Error fetching sites:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddSite = async () => {
    if (!newSiteName) {
      alert("Please enter a site name.")
      return
    }

    try {
      const { data, error } = await supabase.from("Site").insert({ SiteName: newSiteName }).select()
      if (error) throw error

      toast({
        title: "Site Added",
        description: "The new site has been successfully added.",
      })

      // Add the new site to the dropdown and select it
      setSites((prev) => [...prev, ...data])
      setFormData({ ...formData, siteId: data[0].pkSiteID }) // Use pkSiteID
      setNewSiteName("")
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from("pending_class").insert({
        site_id: formData.siteId, // Use site_id referencing pkSiteID
        class_type: formData.classType,
        preferred_date_start: formData.preferredDateStart,
        preferred_date_end: formData.preferredDateEnd,
        address: formData.address,
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Class Request</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="siteId" className="block text-sm font-medium">
            Select Site
          </label>
          <Select
            value={formData.siteId}
            onValueChange={(value) => setFormData({ ...formData, siteId: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.pkSiteID} value={site.pkSiteID}>
                  {site.SiteName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="link"
            className="mt-2 text-sm"
            onClick={() => setShowAddSite((prev) => !prev)}
          >
            {showAddSite ? "Cancel" : "Add New Site"}
          </Button>
        </div>

        {showAddSite && (
          <div>
            <label htmlFor="newSiteName" className="block text-sm font-medium">
              New Site Name
            </label>
            <Input
              id="newSiteName"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              placeholder="Enter new site name"
            />
            <Button className="mt-2" onClick={handleAddSite}>
              Add Site
            </Button>
          </div>
        )}

        <div>
          <label htmlFor="classType" className="block text-sm font-medium">
            Class Type
          </label>
          <Input
            id="classType"
            name="classType"
            value={formData.classType}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="preferredDateStart" className="block text-sm font-medium">
            Preferred Start Date
          </label>
          <Input
            id="preferredDateStart"
            name="preferredDateStart"
            type="date"
            value={formData.preferredDateStart}
            onChange={handleInputChange}
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
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium">
            Address
          </label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="block w-full border rounded-md p-2"
          />
        </div>
        <Button type="submit" disabled={!formData.siteId}>
          Submit Request
        </Button>
      </form>
    </div>
  )
}

export default CreateClassRequest