"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

const ClassDetails = ({ userRole }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClassDetails()
  }, [id])

  const fetchClassDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("trainingLog")
        .select(`
          pkTrainingLogID,
          dateofclass,
          fkSiteID,
          fkEducatorID,
          class_address,
          subjects,
          educators:fkEducatorID (
            first,
            last
          ),
          sites:fkSiteID (
            SiteName,
            SiteAdd1,
            SiteCity,
            SiteState,
            companies:fkCompID (
              CompName
            )
          )
        `)
        .eq("pkTrainingLogID", id)
        .single()

      if (error) throw error
      setClassData(data)
    } catch (error) {
      console.error("Error fetching class details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load class details",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Class not found</h2>
        <Button className="mt-4" onClick={() => navigate("/classes")}>
          Back to Classes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/classes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Class Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{classData.sites?.companies?.CompName || "Unnamed Company"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Date:</strong> {classData.dateofclass || "N/A"}</p>
          <p><strong>Site Name:</strong> {classData.sites?.SiteName || "N/A"}</p>
          <p><strong>Address:</strong> {classData.sites?.SiteAdd1 || "N/A"}</p>
          <p><strong>City:</strong> {classData.sites?.SiteCity || "N/A"}</p>
          <p><strong>State:</strong> {classData.sites?.SiteState || "N/A"}</p>
          <p><strong>Subjects:</strong> {classData.subjects || "N/A"}</p>
          <p><strong>Educator:</strong> {classData.educators ? `${classData.educators.first} ${classData.educators.last}` : "N/A"}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClassDetails