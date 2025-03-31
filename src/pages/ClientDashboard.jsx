"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

const ClientDashboard = () => {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Fetch upcoming classes
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), class_type, review")
        .gte("dateofclass", new Date().toISOString().split("T")[0]) // Filter for future dates
        .order("dateofclass", { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past classes
      const { data: pastData, error: pastError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), class_type, review")
        .lt("dateofclass", new Date().toISOString().split("T")[0]) // Filter for past dates
        .order("dateofclass", { ascending: false });

      if (pastError) throw pastError;

      setUpcomingClasses(upcomingData || []);
      setPastClasses(pastData || []);
    } catch (error) {
      console.error("Error fetching classes:", error.message);
    } finally {
      setLoading(false);
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

  const handleReviewSubmit = async (classId, review) => {
    try {
      const { error } = await supabase
        .from("trainingLog")
        .update({ review })
        .eq("pkTrainingLogID", classId);

      if (error) throw error;

      alert("Review submitted successfully!");
      fetchClasses(); // Refresh the class list
    } catch (error) {
      console.error("Error submitting review:", error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Upcoming Classes */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Classes</h2>
            {upcomingClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.pkTrainingLogID}
                    className="p-4 border rounded-md hover:shadow-lg transition"
                  >
                    <div className="flex items-center mb-2">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(classItem.dateofclass)}</p>
                    </div>
                    <p className="font-semibold">{classItem.class_type}</p>
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
                  >
                    <div className="flex items-center mb-2">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(classItem.dateofclass)}</p>
                    </div>
                    <p className="font-semibold">{classItem.class_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                    </p>
                    <textarea
                      placeholder="Leave a review..."
                      defaultValue={classItem.review || ""}
                      onBlur={(e) => handleReviewSubmit(classItem.pkTrainingLogID, e.target.value)}
                      className="w-full mt-2 p-2 border rounded-md"
                    />
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
  );
};

export default ClientDashboard;