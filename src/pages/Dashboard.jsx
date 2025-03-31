"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

const Dashboard = ({ userRole }) => {
  const [stats, setStats] = useState({
    upcomingClasses: 0,
    totalEducators: 0,
    totalStudents: 0,
    pendingRequests: 0,
  })
  const [recentClasses, setRecentClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch stats
        const [classesResponse, educatorsResponse, studentsResponse, requestsResponse] = await Promise.all([
          supabase.from("trainingLog").select("count", { count: "exact" }).gte("dateofclass", new Date().toISOString().split("T")[0]),
          supabase.from("educators").select("count", { count: "exact" }),
          supabase.from("students").select("count", { count: "exact" }),
          supabase.from("pending_class").select("count", { count: "exact" }), // Count all pending requests
        ])

        setStats({
          upcomingClasses: classesResponse.count || 0,
          totalEducators: educatorsResponse.count || 0,
          totalStudents: studentsResponse.count || 0,
          pendingRequests: requestsResponse.count || 0,
        })
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

  const handleCardClick = (path) => {
    navigate(path)
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
          {/* Upcoming Classes */}
          <div
            className="card cursor-pointer hover:shadow-lg"
            onClick={() => handleCardClick("/classes")}
          >
            <div className="card-header">
              <h3 className="text-sm font-medium">Upcoming Classes</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
              <p className="text-xs text-muted-foreground">Classes scheduled for future dates</p>
            </div>
          </div>

          {/* Total Educators */}
          <div
            className="card cursor-pointer hover:shadow-lg"
            onClick={() => handleCardClick("/educators")}
          >
            <div className="card-header">
              <h3 className="text-sm font-medium">Total Educators</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.totalEducators}</div>
              <p className="text-xs text-muted-foreground">Active educators in the system</p>
            </div>
          </div>

          {/* Total Students */}
          <div
            className="card cursor-pointer hover:shadow-lg"
            onClick={() => handleCardClick("/students")}
          >
            <div className="card-header">
              <h3 className="text-sm font-medium">Total Students</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Students enrolled in classes</p>
            </div>
          </div>

          {/* Pending Requests */}
          <div
            className="card cursor-pointer hover:shadow-lg"
            onClick={() => handleCardClick("/pending-classes")}
          >
            <div className="card-header">
              <h3 className="text-sm font-medium">Pending Requests</h3>
            </div>
            <div className="card-content">
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Class requests awaiting action</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard