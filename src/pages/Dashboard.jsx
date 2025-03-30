"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

const Dashboard = ({ userRole }) => {
  const [stats, setStats] = useState({
    upcomingClasses: 0,
    totalEducators: 0,
    totalStudents: 0,
    pendingRequests: 0,
    queueCount: 0, // New state for queue count
  })
  const [recentClasses, setRecentClasses] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch the current user
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const userId = session?.user?.id

        // Fetch stats
        const [classesResponse, educatorsResponse, studentsResponse, requestsResponse, queueResponse] = await Promise.all([
          supabase.from("trainingLog").select("count", { count: "exact" }).gte("dateofclass", new Date().toISOString().split("T")[0]),
          supabase.from("educators").select("count", { count: "exact" }),
          supabase.from("students").select("count", { count: "exact" }),
          supabase.from("pending_class").select("count", { count: "exact" }).eq("status", "pending"),
          supabase.from("pending_class").select("count", { count: "exact" }).eq("queue_user_id", userId), // Count for queue_user_id
        ])

        // Fetch recent classes
        const { data: recentClassesData } = await supabase
          .from("trainingLog")
          .select(`
            pkTrainingLogID,
            dateofclass,
            company,
            state,
            instructor,
            educators:fkEducatorID (
              first,
              last
            )
          `)
          .order("dateofclass", { ascending: true })
          .limit(5)

        // Fetch pending requests
        const { data: pendingRequestsData, error } = await supabase
            .from("pending_class")
            .select(`
              pktrainingclassid,
              class_type,
              preferred_date_start,
              preferred_date_end,
              status
            `)
            .order("preferred_date_start", { ascending: true }) // Order by preferred_date_start without filtering by status

          if (error) {
            console.error("Error fetching pending requests:", error) 
          } else {
            setPendingRequests(pendingRequestsData || [])
          }

        setStats({
          upcomingClasses: classesResponse.count || 0,
          totalEducators: educatorsResponse.count || 0,
          totalStudents: studentsResponse.count || 0,
          pendingRequests: requestsResponse.count || 0,
          queueCount: queueResponse.count || 0, // Set queue count
        })

        setRecentClasses(recentClassesData || [])
        setPendingRequests(pendingRequestsData || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {userRole === "admin" && (
          <Link to="/create-class" className="btn btn-primary">
            Create New Class Request
          </Link>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium">Upcoming Classes</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
              <p className="text-xs text-muted-foreground">Classes scheduled for future dates</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium">Total Educators</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.totalEducators}</div>
              <p className="text-xs text-muted-foreground">Active educators in the system</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium">Total Students</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Students enrolled in classes</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium">Pending Requests</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Class requests awaiting action</p>
            </div>
          </div>

          {/* New Queue Count Alert */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium">Your Queue</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.queueCount}</div>
              <p className="text-xs text-muted-foreground">Requests assigned to you</p>
            </div>
          </div>
        </div>
      )}

      {userRole === "admin" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pending Class Requests</h3>
            <p className="card-description">Requests awaiting coordinator action</p>
          </div>
          <div className="card-content">
            {pendingRequests.length > 0 ? (
              <ul className="space-y-4">
                {pendingRequests.map((request) => (
                  <li key={request.pktrainingclassid} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{request.class_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.preferred_date_start)} - {formatDate(request.preferred_date_end)}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.address}</p>
                    </div>
                    <Link to={`/assign-educator/${request.pktrainingclassid}`} className="btn btn-outline">
                      Assign Educator
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No pending requests found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard