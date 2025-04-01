"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Dashboard = ({ userRole }) => {
  const [stats, setStats] = useState({
    upcomingClasses: 0,
    totalEducators: 0,
    totalStudents: 0,
    pendingRequests: 0,
  });
  const [pendingClasses, setPendingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classDate, setClassDate] = useState({}); // State to track class dates for each record
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch stats
        const [classesResponse, educatorsResponse, studentsResponse, requestsResponse] = await Promise.all([
          supabase.from("trainingLog").select("count", { count: "exact" }).gte("dateofclass", new Date().toISOString().split("T")[0]),
          supabase.from("educators").select("count", { count: "exact" }),
          supabase.from("students").select("count", { count: "exact" }),
          supabase.from("pending_class").select("*"), // Fetch pending requests
        ]);

        setStats({
          upcomingClasses: classesResponse.count || 0,
          totalEducators: educatorsResponse.count || 0,
          totalStudents: studentsResponse.count || 0,
          pendingRequests: requestsResponse.data?.length || 0,
        });

        setPendingClasses(requestsResponse.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleClassDateChange = (pktrainingclassid, value) => {
    setClassDate((prev) => ({
      ...prev,
      [pktrainingclassid]: value,
    }));
  };

  const handleContactEducator = async (pktrainingclassid) => {
    try {
      const { error } = await supabase
        .from("pending_class")
        .update({
          status: "Awaiting Date",
          offer_sent_at: new Date().toISOString(),
        })
        .eq("pktrainingclassid", pktrainingclassid);

      if (error) throw error;

      setPendingClasses((prev) =>
        prev.map((pendingClass) =>
          pendingClass.pktrainingclassid === pktrainingclassid
            ? { ...pendingClass, status: "Awaiting Date", offer_sent_at: new Date().toISOString() }
            : pendingClass
        )
      );
    } catch (error) {
      console.error("Error contacting educator:", error);
    }
  };

  const handleDateReceived = async (pktrainingclassid) => {
    if (!classDate[pktrainingclassid]) {
      alert("Please provide a class date before submitting.");
      return;
    }

    try {
      const { error } = await supabase
        .from("pending_class")
        .update({
          status: "Final Confirmation",
          educator_response_at: new Date().toISOString(),
          class_date: classDate[pktrainingclassid],
        })
        .eq("pktrainingclassid", pktrainingclassid);

      if (error) throw error;

      setPendingClasses((prev) =>
        prev.map((pendingClass) =>
          pendingClass.pktrainingclassid === pktrainingclassid
            ? {
                ...pendingClass,
                status: "Final Confirmation",
                educator_response_at: new Date().toISOString(),
                class_date: classDate[pktrainingclassid],
              }
            : pendingClass
        )
      );
    } catch (error) {
      console.error("Error updating final confirmation:", error);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
        {userRole === "admin" && (
          <Link to="/create-class" className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600">
            Create New Class Request
          </Link>
        )}
      </div>

      {/* Stats Section */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Upcoming Classes */}
            <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-500 p-3 rounded-full">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Upcoming Classes</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.upcomingClasses}</div>
              </div>
            </div>

            {/* Total Educators */}
            <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
              <div className="bg-green-100 text-green-500 p-3 rounded-full">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Educators</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.totalEducators}</div>
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
              <div className="bg-yellow-100 text-yellow-500 p-3 rounded-full">
                <i className="fas fa-user-graduate"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.totalStudents}</div>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
              <div className="bg-red-100 text-red-500 p-3 rounded-full">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.pendingRequests}</div>
              </div>
            </div>
          </div>

          {/* Pending Classes Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Classes</h2>
            {pendingClasses.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-100 text-gray-800">
                    <tr>
                      <th className="px-4 py-2">Class Type</th>
                      <th className="px-4 py-2">Preferred Dates</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClasses.map((cls) => (
                      <tr key={cls.pktrainingclassid} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{cls.class_type || "N/A"}</td>
                        <td className="px-4 py-2">
                          {formatDate(cls.preferred_date_start)} - {formatDate(cls.preferred_date_end)}
                        </td>
                        <td className="px-4 py-2">{cls.status || "Pending"}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleContactEducator(cls.pktrainingclassid)}
                            className="text-blue-500 hover:underline"
                          >
                            Contact
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No pending classes at the moment.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;