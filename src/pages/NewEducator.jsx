"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const NewEducator = () => {
  const [formData, setFormData] = useState({
    first: "",
    last: "",
    email1: "",
    email2: "",
    cell: "",
    work: "",
    home: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    teach_state: "",
    rate1: "",
    rate2: "",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase.from("educators").insert({
        ...formData,
        rate1: parseFloat(formData.rate1) || null,
        rate2: parseFloat(formData.rate2) || null,
      })

      if (error) throw error

      toast({
        title: "Educator Added",
        description: "The educator has been successfully added.",
      })
      navigate("/educators")
    } catch (error) {
      console.error("Error adding educator:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the educator.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add New Educator</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first">First Name</Label>
            <Input
              id="first"
              name="first"
              value={formData.first}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last">Last Name</Label>
            <Input
              id="last"
              name="last"
              value={formData.last}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email1">Primary Email</Label>
            <Input
              id="email1"
              name="email1"
              type="email"
              value={formData.email1}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email2">Secondary Email</Label>
            <Input
              id="email2"
              name="email2"
              type="email"
              value={formData.email2}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cell">Cell Phone</Label>
            <Input
              id="cell"
              name="cell"
              value={formData.cell}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="work">Work Phone</Label>
            <Input
              id="work"
              name="work"
              value={formData.work}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="home">Home Phone</Label>
            <Input
              id="home"
              name="home"
              value={formData.home}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="teach_state">Teaching State</Label>
          <Input
            id="teach_state"
            name="teach_state"
            value={formData.teach_state}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rate1">Rate 1 (Hourly)</Label>
            <Input
              id="rate1"
              name="rate1"
              type="number"
              step="0.01"
              value={formData.rate1}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate2">Rate 2 (Hourly)</Label>
            <Input
              id="rate2"
              name="rate2"
              type="number"
              step="0.01"
              value={formData.rate2}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add Educator"}
        </Button>
      </form>
    </div>
  )
}

export default NewEducator