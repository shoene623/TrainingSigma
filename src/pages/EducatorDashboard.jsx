"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Calendar } from "lucide-react";

const EducatorDashboard = () => {
  const [pendingClasses, setPendingClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // State for selected class
  const [loading, setLoading] = useState(true);
  const [educatorId, setEducatorId] = useState(null);

  useEffect(() => {
    fetchEducatorId();
    fetchClasses();
  }, []);

  const fetchEducatorId = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const educatorEmail = session?.user?.email;

      if (!educatorEmail) {
        throw new Error("Educator email not found.");
      }

      const { data: educatorData, error: educatorError } = await supabase
        .from("educators")
        .select("pkEducatorID")
        .eq("email1", educatorEmail)
        .maybeSingle();

      if (educatorError) throw educatorError;

      setEducatorId(educatorData?.pkEducatorID || null);
    } catch (error) {
      console.error("Error fetching educator ID:", error.message);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Fetch pending classes
      const { data: pendingData, error: pendingError } = await supabase
        .from("pending_class")
        .select(`
          pktrainingclassid,
          class_type,
          preferred_date_start,
          preferred_date_end,
          status,
          fkEducatorID,
          coordinator_id,
          class_date,
          profiles_coordinator:coordinator_id (firstName, lastName),
          profiles_assigned:queue_user_id (firstName, lastName),
          sites:fkSiteID(SiteName, SiteCity, SiteState),
          educators:fkEducatorID(first, last)
        `)
        .order("preferred_date_start", { ascending: true });

      if (pendingError) throw pendingError;

      // Fetch upcoming classes
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, subjects, sites:fkSiteID(SiteName, SiteCity, SiteState)")
        .gte("dateofclass", new Date().toISOString().split("T")[0])
        .order("dateofclass", { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past classes
      const { data: pastData, error: pastError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, subjects, sites:fkSiteID(SiteName, SiteCity, SiteState)")
        .lt("dateofclass", new Date().toISOString().split("T")[0])
        .order("dateofclass", { ascending: false });

      if (pastError) throw pastError;

      setPendingClasses(pendingData || []);
      setUpcomingClasses(upcomingData || []);
      setPastClasses(pastData || []);
    } catch (error) {
      console.error("Error fetching classes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classItem) => {
    setSelectedClass(classItem); // Set the selected class
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col">
      {/* Top Navbar */}
      <div className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Educator Dashboard</h1>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Pending Classes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Pending Classes</h2>
              {pendingClasses.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Class Type</th>
                      <th className="px-4 py-2 border-b">Preferred Dates</th>
                      <th className="px-4 py-2 border-b">Assigned To</th>
                      <th className="px-4 py-2 border-b">Site</th>
                      <th className="px-4 py-2 border-b">Educator</th>
                      <th className="px-4 py-2 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClasses.map((classItem) => (
                      <tr
                        key={classItem.pktrainingclassid}
                        onClick={() => handleClassClick(classItem)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <td className="px-4 py-2 border-b">{classItem.class_type}</td>
                        <td className="px-4 py-2 border-b">
                          {formatDate(classItem.preferred_date_start)} - {formatDate(classItem.preferred_date_end)}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {classItem.profiles_assigned
                            ? `${classItem.profiles_assigned.firstName} ${classItem.profiles_assigned.lastName}`
                            : "Unassigned"}
                        </td>
                        <td className="px-4 py-2 border-b">{classItem.sites?.SiteName || "N/A"}</td>
                        <td className="px-4 py-2 border-b">
                          {classItem.educators?.first} {classItem.educators?.last}
                        </td>
                        <td className="px-4 py-2 border-b">{classItem.status || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No pending classes found.</p>
              )}
            </div>

            {/* Upcoming Classes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upcoming Classes</h2>
              {upcomingClasses.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Date</th>
                      <th className="px-4 py-2 border-b">Subjects</th>
                      <th className="px-4 py-2 border-b">Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingClasses.map((classItem) => (
                      <tr
                        key={classItem.pkTrainingLogID}
                        onClick={() => handleClassClick(classItem)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <td className="px-4 py-2 border-b">{formatDate(classItem.dateofclass)}</td>
                        <td className="px-4 py-2 border-b">{classItem.subjects}</td>
                        <td className="px-4 py-2 border-b">
                          {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No upcoming classes scheduled.</p>
              )}
            </div>

            {/* Past Classes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Past Classes</h2>
              {pastClasses.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Date</th>
                      <th className="px-4 py-2 border-b">Subjects</th>
                      <th className="px-4 py-2 border-b">Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastClasses.map((classItem) => (
                      <tr
                        key={classItem.pkTrainingLogID}
                        onClick={() => handleClassClick(classItem)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <td className="px-4 py-2 border-b">{formatDate(classItem.dateofclass)}</td>
                        <td className="px-4 py-2 border-b">{classItem.subjects}</td>
                        <td className="px-4 py-2 border-b">
                          {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No past classes found.</p>
              )}
            </div>

            {/* Selected Class Details */}
            {selectedClass && (
              <div className="p-4 border rounded-md bg-gray-50">
                <h2 className="text-xl font-semibold mb-4">Class Details</h2>
                <p><strong>Class Type:</strong> {selectedClass.class_type || "N/A"}</p>
                <p><strong>Date:</strong> {formatDate(selectedClass.dateofclass || selectedClass.class_date)}</p>
                <p><strong>Subjects:</strong> {selectedClass.subjects || "N/A"}</p>
                <p><strong>Site:</strong> {selectedClass.sites?.SiteName || "N/A"}</p>
                <p><strong>City:</strong> {selectedClass.sites?.SiteCity || "N/A"}</p>
                <p><strong>State:</strong> {selectedClass.sites?.SiteState || "N/A"}</p>
                <p><strong>Status:</strong> {selectedClass.status || "N/A"}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EducatorDashboard;