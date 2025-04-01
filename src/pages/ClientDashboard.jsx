"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button"; // Import the Button component

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
        .select(
          "pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), subjects, review, educator:fkEducatorID(first, last)"
        )
        .gte("dateofclass", new Date().toISOString().split("T")[0]) // Filter for future dates
        .order("dateofclass", { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past classes
      const { data: pastData, error: pastError } = await supabase
        .from("trainingLog")
        .select(
          "pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), subjects, review, educator:fkEducatorID(first, last)"
        )
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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">LifeSafe Services Training Portal</h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/client-dashboard")}
              className="text-gray-700 hover:text-primary font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/classes")}
              className="text-gray-700 hover:text-primary font-medium"
            >
              Classes
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
          {/* Add Request a Class Button */}
          <Button onClick={() => navigate("/client-class-request")}>
            Request a Class
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-lg font-medium">Loading classes...</p>
          </div>
        ) : (
          <>
            {/* Upcoming Classes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upcoming Classes</h2>
              {upcomingClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="p-6 bg-white border rounded-lg shadow-md hover:shadow-lg transition"
                    >
                      <div className="flex items-center mb-4">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        <p className="text-lg font-medium">
                          {formatDate(classItem.dateofclass)}
                        </p>
                      </div>
                      <p className="text-xl font-semibold mb-2">
                        {classItem.class_type}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="mr-2 h-4 w-4" />
                        <p>
                          {classItem.sites?.SiteName},{" "}
                          {classItem.sites?.SiteCity},{" "}
                          {classItem.sites?.SiteState}
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <p>
                          Educator: {classItem.educator?.first}{" "}
                          {classItem.educator?.last}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No upcoming classes scheduled.
                </p>
              )}
            </div>

            {/* Past Classes */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Past Classes</h2>
              {pastClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="p-6 bg-white border rounded-lg shadow-md hover:shadow-lg transition"
                    >
                      <div className="flex items-center mb-4">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        <p className="text-lg font-medium">
                          {formatDate(classItem.dateofclass)}
                        </p>
                      </div>
                      <p className="text-xl font-semibold mb-2">
                        {classItem.class_type}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="mr-2 h-4 w-4" />
                        <p>
                          {classItem.sites?.SiteName},{" "}
                          {classItem.sites?.SiteCity},{" "}
                          {classItem.sites?.SiteState}
                        </p>
                      </div>
                      <textarea
                        placeholder="Leave a review..."
                        defaultValue={classItem.review || ""}
                        onBlur={(e) =>
                          handleReviewSubmit(
                            classItem.pkTrainingLogID,
                            e.target.value
                          )
                        }
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
    </div>
  );
};

export default ClientDashboard;