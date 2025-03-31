"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

const EducatorDashboard = () => {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAndUpdateEducatorProfile();
    fetchClasses();
  }, []);

  const checkAndUpdateEducatorProfile = async () => {
    try {
      // Fetch the current session to get the educator's email
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const educatorEmail = session?.user?.email; // Get the educator's email from the session

      if (!educatorEmail) {
        throw new Error("Educator email not found.");
      }

      // Fetch the educator's record
      const { data: educatorData, error: educatorError } = await supabase
        .from("educators")
        .select("pkEducatorID, fkProfileID")
        .eq("email", educatorEmail)
        .single();

      if (educatorError) throw educatorError;

      // Check if fkProfileID is null
      if (!educatorData.fkProfileID) {
        // Search for a matching profile by email
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", educatorEmail)
          .single();

        if (profileError) throw profileError;

        // Update the educator's fkProfileID with the profile's id
        const { error: updateError } = await supabase
          .from("educators")
          .update({ fkProfileID: profileData.id })
          .eq("pkEducatorID", educatorData.pkEducatorID);

        if (updateError) throw updateError;

        console.log("Educator's fkProfileID updated successfully.");
      }
    } catch (error) {
      console.error("Error checking or updating educator profile:", error.message);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Fetch the current session to get the educator's ID
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const educatorId = session?.user?.id; // Get the educator's ID from the session

      if (!educatorId) {
        throw new Error("Educator is not authenticated.");
      }

      // Fetch upcoming classes
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), class_type")
        .eq("fkEducatorID", educatorId)
        .gte("dateofclass", new Date().toISOString().split("T")[0]) // Filter for future dates
        .order("dateofclass", { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past classes
      const { data: pastData, error: pastError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), class_type")
        .eq("fkEducatorID", educatorId)
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Educator Dashboard</h1>

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
                    onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
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
                    onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
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
              <p className="text-muted-foreground">No past classes found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EducatorDashboard;