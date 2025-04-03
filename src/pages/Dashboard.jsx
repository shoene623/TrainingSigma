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
    pendingBills: 0,
  });
  const [pendingClasses, setPendingClasses] = useState([]);
  const [pendingBills, setPendingBills] = useState([]); // State for pending bills
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Role-based redirection
  useEffect(() => {
    if (userRole === "educator") {
      navigate("/educator-dashboard");
    } else if (userRole === "client_admin" || userRole === "client_site") {
      navigate("/client-dashboard");
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          classesResponse,
          educatorsResponse,
          studentsResponse,
          requestsResponse,
          billsResponse, 
          pendingBillsResponse, 
        ] = await Promise.all([
          supabase
            .from("trainingLog")
            .select("count", { count: "exact" })
            .gte("dateofclass", new Date().toISOString().split("T")[0]),
          supabase.from("educators").select("count", { count: "exact" }),
          supabase.from("students").select("count", { count: "exact" }),
          supabase.from("pending_class").select(`
            pktrainingclassid,
            class_type,
            preferred_date_start,
            preferred_date_end,
            status,
            sites:fkSiteID (SiteName) // <--- IMPORTANT: Ensure you are selecting SiteName here
          `),
          supabase
            .from("trainingLog")
            .select("count", { count: "exact" })
            .is("billdate", null)
            .lt("dateofclass", new Date().toISOString()), // Fetch pending bills count
          supabase
            .from("trainingLog")
            .select("pkTrainingLogID, dateofclass, subjects, sites:fkSiteID (SiteName)")
            .is("billdate", null)
            .lt("dateofclass", new Date().toISOString())
            .order("dateofclass", { ascending: true })
            .limit(5), // Fetch the 5 oldest pending bills
        ]);

        setStats({
          upcomingClasses: classesResponse.count || 0,
          totalEducators: educatorsResponse.count || 0,
          totalStudents: studentsResponse.count || 0,
          pendingRequests: requestsResponse.data?.length || 0,
          pendingBills: billsResponse.count || 0, // Assign pending bills count
        });

        setPendingClasses(requestsResponse.data || []);
        setPendingBills(pendingBillsResponse.data || []); // Set the pending bills data
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

  return (
    <div className="space-y-6 p-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
        {userRole === "admin" && (
          <Link
            to="/create-class"
            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
          >
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


            {/* Pending Requests */}
            <div
              className="bg-white shadow rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:shadow-lg"
              onClick={() => navigate("/pending-classes")}
            >
              <div className="bg-yellow-100 text-red-500 p-3 rounded-full">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.pendingRequests}</div>
              </div>
            </div>

            {/* Pending Bills */}
            <div
              className="bg-white shadow rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:shadow-lg"
              onClick={() => navigate("/pending-bill")}
            >
              <div className="bg-red-100 text-red-500 p-3 rounded-full">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pending Bills</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.pendingBills}</div>
              </div>
            </div>

            {/* Upcoming Classes */}
            <div
              className="bg-white shadow rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:shadow-lg"
              onClick={() => navigate("/classes")}
            >
              <div className="bg-blue-100 text-blue-500 p-3 rounded-full">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Upcoming Classes</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.upcomingClasses}</div>
              </div>
            </div>

            {/* Total Educators */}
            <div
              className="bg-white shadow rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:shadow-lg"
              onClick={() => navigate("/educators")}
            >
              <div className="bg-green-100 text-green-500 p-3 rounded-full">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Educators</h3>
                <div className="text-2xl font-bold text-gray-800">{stats.totalEducators}</div>
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
                      <th className="px-4 py-2">Site</th>
                      <th className="px-4 py-2">Class</th>
                      <th className="px-4 py-2">Preferred Dates</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClasses.map((cls) => (
                      <tr
                        key={cls.pktrainingclassid}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/pending-classes")}
                      >
                        <td className="px-4 py-2">{cls.sites?.SiteName || "N/A"}</td>
                        <td className="px-4 py-2">{cls.class_type || "N/A"}</td>
                        <td className="px-4 py-2">
                          {formatDate(cls.preferred_date_start)} - {formatDate(cls.preferred_date_end)}
                        </td>
                        <td className="px-4 py-2">{cls.status || "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No pending classes at the moment.</p>
            )}
          </div>

          {/* Pending Bills Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Bills</h2>
            {pendingBills.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-100 text-gray-800">
                    <tr>
                      <th className="px-4 py-2">Date of Class</th>
                      <th className="px-4 py-2">Class</th>
                      <th className="px-4 py-2">Site Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBills.map((bill) => (
                      <tr
                        key={bill.pkTrainingLogID}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/pending-bill")}
                      >
                        <td className="px-4 py-2">{formatDate(bill.dateofclass)}</td>
                        <td className="px-4 py-2">{bill.subjects || "N/A"}</td>
                        <td className="px-4 py-2">{bill.sites?.SiteName || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No pending bills at the moment.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;