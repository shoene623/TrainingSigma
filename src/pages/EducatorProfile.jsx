"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "lucide-react"

const EducatorProfile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [educator, setEducator] = useState(null)
  const [upcomingClasses, setUpcomingClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEducatorProfile()
    fetchUpcomingClasses()
  }, [])

  const fetchEducatorProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        navigate("/login")
        return
      }

      const { data, error } = await supabase
        .from("educators")
        .select("*")
        .eq("auth_id", userData.user.id) // Assuming `auth_id` links the user to the educator
        .single()

      if (error) throw error
      setEducator(data)
    } catch (error) {
      console.error("Error fetching educator profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your profile",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingClasses = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) return

      const { data: educatorData, error: educatorError } = await supabase
        .from("educators")
        .select("pkEducatorID")
        .eq("auth_id", userData.user.id) // Assuming `auth_id` links the user to the educator
        .single()

      if (educatorError) throw educatorError
      if (!educatorData) return

      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("trainingLog")
        .select(`
          pkTrainingLogID,
          dateofclass,
          company,
          state,
          three_day_educator_confirm_call_email,
          educators:fkEducatorID (
            first,
            last
          )
        `)
        .eq("fkEducatorID", educatorData.pkEducatorID)
        .gte("dateofclass", today)
        .order("dateofclass", { ascending: true })

      if (error) throw error
      setUpcomingClasses(data || [])
    } catch (error) {
      console.error("Error fetching upcoming classes:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEducator({ ...educator, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from("educators")
        .update({
          first: educator.first,
          last: educator.last,
          email1: educator.email1,
          email2: educator.email2,
          cell: educator.cell,
          work: educator.work,
          home: educator.home,
          address: educator.address,
          city: educator.city,
          state: educator.state,
          zip: educator.zip,
          teach_state: educator.teach_state,
          zoom: educator.zoom,
        })
        .eq("pkEducatorID", educator.pkEducatorID)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your profile",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!educator) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <p className="text-muted-foreground mt-2">Your educator profile could not be found.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal and contact information</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact Details</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first">First Name</Label>
                      <Input id="first" name="first" value={educator.first || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last">Last Name</Label>
                      <Input id="last" name="last" value={educator.last || ""} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={educator.address || ""} onChange={handleInputChange} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" value={educator.city || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" value={educator.state || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" name="zip" value={educator.zip || ""} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teach_state">Teaching State</Label>
                    <Input
                      id="teach_state"
                      name="teach_state"
                      value={educator.teach_state || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email1">Primary Email</Label>
                      <Input
                        id="email1"
                        name="email1"
                        type="email"
                        value={educator.email1 || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email2">Secondary Email</Label>
                      <Input
                        id="email2"
                        name="email2"
                        type="email"
                        value={educator.email2 || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cell">Cell Phone</Label>
                      <Input id="cell" name="cell" value={educator.cell || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work">Work Phone</Label>
                      <Input id="work" name="work" value={educator.work || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="home">Home Phone</Label>
                      <Input id="home" name="home" value={educator.home || ""} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoom">Zoom Link</Label>
                    <Input id="zoom" name="zoom" value={educator.zoom || ""} onChange={handleInputChange} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>Your scheduled training sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {upcomingClasses.map((classItem) => (
                  <Link
                    key={classItem.pkTrainingLogID}
                    to={`/classes/${classItem.pkTrainingLogID}`}
                    className="block p-4 rounded-md border hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center mb-2">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(classItem.dateofclass)}</p>
                    </div>
                    <p>{classItem.company || "Unnamed Class"}</p>
                    <p className="text-sm text-muted-foreground">{classItem.state || "Location not specified"}</p>
                    {classItem.three_day_educator_confirm_call_email ? (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Confirmed
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          Awaiting Confirmation
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming classes scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EducatorProfile