"use client"

import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./supabaseClient"
import MainLayout from "./layouts/MainLayout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Classes from "./pages/Classes"
import Educators from "./pages/Educators"
import Students from "./pages/Students"
import ClassDetails from "./pages/ClassDetails"
import EducatorProfile from "./pages/EducatorProfile"
import CreateClassRequest from "./pages/CreateClassRequest"
import AssignEducator from "./pages/AssignEducator"
import EducatorResponse from "./pages/EducatorResponse"
import ConfirmClass from "./pages/ConfirmClass"
import NotFound from "./pages/NotFound"
import NewStudent from "./pages/NewStudent"
import PendingClass from "./pages/PendingClass"
import TrainingLog from "./pages/TrainingLog"
import NewEducator from "./pages/NewEducator"
import InviteUser from "./pages/InviteUser"
import EducatorDashboard from "./pages/EducatorDashboard"
import ClientDashboard from "./pages/ClientDashboard"

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        getUserRole(session.user.id);
      }
      setLoading(false);
    });
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });
  
    return () => subscription.unsubscribe();
  }, []);
  
  async function getUserRole(userId) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
  
      if (profileError) throw profileError;
  
      const role = profileData.role || "user";
      setUserRole(role);
  
      // Redirect based on role
      if (role === "educator") {
        navigate("/educator-dashboard");
      } else if (role === "client_admin" || role === "client_site") {
        navigate("/client-dashboard");
      } else {
        navigate("/dashboard"); // Default dashboard for other roles
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("user");
      navigate("/dashboard"); // Default fallback
    }
  }

  async function getUserRole(userId) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError
      setUserRole(profileData.role || "user")
    } catch (error) {
      console.error("Error fetching user role:", error)
      setUserRole("user")
    }
  }

  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (loading) return <div>Loading...</div>
    if (!session) return <Navigate to="/login" replace />
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole) && userRole !== "LifeSafe") {
      return <Navigate to="/dashboard" replace />
    }
    return children
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard userRole={userRole} />} />
          <Route path="classes" element={<Classes userRole={userRole} />} />
          <Route path="classes/:id" element={<ClassDetails userRole={userRole} />} />
          <Route
            path="educators"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <Educators />
              </ProtectedRoute>
            }
          />
          <Route
            path="educators/profile"
            element={
              <ProtectedRoute allowedRoles={["educator", "LifeSafe"]}>
                <EducatorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="students"
            element={
              <ProtectedRoute allowedRoles={["admin", "educator", "LifeSafe"]}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-class"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <CreateClassRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="assign-educator/:requestId"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <AssignEducator />
              </ProtectedRoute>
            }
          />
          <Route
            path="educator-response/:requestId"
            element={
              <ProtectedRoute allowedRoles={["educator", "LifeSafe"]}>
                <EducatorResponse />
              </ProtectedRoute>
            }
          />
          <Route
            path="confirm-class/:requestId"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <ConfirmClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="students/new"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <NewStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="pending-classes"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <PendingClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="training-log"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <TrainingLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/educators/new-educator"
            element={
              <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
                <NewEducator />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/invite-user"
          element={
            <ProtectedRoute allowedRoles={["admin", "LifeSafe"]}>
              <InviteUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/educator-dashboard"
          element={
            <ProtectedRoute allowedRoles={["educator"]}>
              <EducatorDashboard />
            </ProtectedRoute>
          }
        />    
        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        {/* Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App