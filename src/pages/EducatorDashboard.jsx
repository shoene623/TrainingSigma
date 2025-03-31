"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

const EducatorDashboard = () => {
  const [pendingClasses, setPendingClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [educatorId, setEducatorId] = useState(null);
  const navigate = useNavigate();

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

  const handleClassDateChange = async (pktrainingclassid, newDate) => {
    try {
      const { error } = await supabase
        .from("pending_class")
        .update({ class_date: newDate })
        .eq("pktrainingclassid", pktrainingclassid);

      if (error) throw error;

      // Update local state
      setPendingClasses((prev) =>
        prev.map((classItem) =>
          classItem.pktrainingclassid === pktrainingclassid
            ? { ...classItem, class_date: newDate }
            : classItem
        )
      );
    } catch (error) {
      console.error("Error updating class date:", error.message);
    }
  };

  const handleMoveToFinalConfirmation = async (classItem) => {
    if (!classItem.class_date) {
      alert("Please provide a class date before moving to Final Confirmation.");
      return;
    }

    try {
      const { error } = await supabase
        .from("pending_class")
        .update({
          status: "Final Confirmation",
          queue_user_id: classItem.coordinator_id, // Assign back to the coordinator
        })
        .eq("pktrainingclassid", classItem.pktrainingclassid);

      if (error) throw error;

      // Update local state
      setPendingClasses((prev) =>
        prev.map((pendingClass) =>
          pendingClass.pktrainingclassid === classItem.pktrainingclassid
            ? { ...pendingClass, status: "Final Confirmation", queue_user_id: classItem.coordinator_id }
            : pendingClass
        )
      );
    } catch (error) {
      console.error("Error moving to Final Confirmation:", error.message);
    }
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
                      <th className="px-4 py-2 border-b">Coordinator</th>
                      <th className="px-4 py-2 border-b">Assigned To</th>
                      <th className="px-4 py-2 border-b">Site</th>
                      <th className="px-4 py-2 border-b">Educator</th>
                      <th className="px-4 py-2 border-b">Status</th>
                      <th className="px-4 py-2 border-b">Class Date</th>
                      <th className="px-4 py-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingClasses.map((classItem) => (
                      <tr key={classItem.pktrainingclassid}>
                        <td className="px-4 py-2 border-b">{classItem.class_type}</td>
                        <td className="px-4 py-2 border-b">
                          {formatDate(classItem.preferred_date_start)} - {formatDate(classItem.preferred_date_end)}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {classItem.profiles_coordinator?.firstName} {classItem.profiles_coordinator?.lastName}
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
                        <td className="px-4 py-2 border-b">
                          <input
                            type="date"
                            value={classItem.class_date || ""}
                            onChange={(e) => handleClassDateChange(classItem.pktrainingclassid, e.target.value)}
                            className="border rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-4 py-2 border-b space-y-2">
                          {classItem.status === "Confirm Educator Dates" && (
                            <button
                              onClick={() => handleMoveToFinalConfirmation(classItem)}
                              className="bg-blue-500 text-white px-2 py-1 rounded"
                            >
                              Move to Final Confirmation
                            </button>
                          )}
                        </td>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="p-4 border rounded-md hover:shadow-lg transition"
                      onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(classItem.dateofclass)}</p>
                      </div>
                      <p className="font-semibold">{classItem.subjects}</p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No upcoming classes scheduled.</p>
              )}
            </div>

            {/* Past Classes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Past Classes</h2>
              {pastClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="p-4 border rounded-md hover:shadow-lg transition"
                      onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(classItem.dateofclass)}</p>
                      </div>
                      <p className="font-semibold">{classItem.subjects}</p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past classes found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EducatorDashboard;