"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar, MapPin } from "lucide-react";
import Sidebar from "../components/Sidebar"; // Import Sidebar

const ClientDashboard = () => {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar toggle
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch upcoming classes
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("trainingLog")
        .select(
          "pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), subjects, educator:fkEducatorID(first, last), review"
        )
        .gte("dateofclass", today) // Filter for future dates
        .order("dateofclass", { ascending: true });

      if (upcomingError) throw upcomingError;

      setUpcomingClasses(upcomingData || []);

      // Fetch past classes
      const { data: pastData, error: pastError } = await supabase
        .from("trainingLog")
        .select(
          "pkTrainingLogID, dateofclass, sites:fkSiteID(SiteName, SiteCity, SiteState), subjects, educator:fkEducatorID(first, last), review"
        )
        .lt("dateofclass", today) // Filter for past dates
        .order("dateofclass", { descending: true });

      if (pastError) throw pastError;

      setPastClasses(pastData || []);

      // Map upcoming classes to calendar events
      const formattedEvents = (upcomingData || []).map((classItem) => ({
        title: classItem.sites?.SiteName || "Class",
        start: classItem.dateofclass,
        extendedProps: {
          classId: classItem.pkTrainingLogID,
        },
      }));

      setEvents(formattedEvents);
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

  const handleEventClick = (info) => {
    const classId = info.event.extendedProps.classId;
    navigate(`/classes/${classId}`);
  };

  const handleReviewSubmit = async (classId, review) => {
    try {
      const { error } = await supabase
        .from("trainingLog")
        .update({ review })
        .eq("pkTrainingLogID", classId);

      if (error) throw error;

      // Update the review in the local state
      setPastClasses((prev) =>
        prev.map((classItem) =>
          classItem.pkTrainingLogID === classId
            ? { ...classItem, review }
            : classItem
        )
      );

      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error.message);
      alert("Failed to submit review. Please try again.");
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userRole="client_admin" />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Client Dashboard</h1>
          <button
            onClick={() => navigate("/request-class")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition"
          >
            Request Class
          </button>
        </div>

        <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
          {/* Left Section: Upcoming and Past Classes */}
          <div className="w-full md:w-1/4 space-y-8">
            {/* Upcoming Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Classes</h2>
              {loading ? (
                <p>Loading classes...</p>
              ) : upcomingClasses.length > 0 ? (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="border p-4 rounded-md bg-white shadow hover:shadow-lg transition cursor-pointer"
                      onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        <p className="text-lg font-medium">{formatDate(classItem.dateofclass)}</p>
                      </div>
                      <p className="text-xl font-semibold">{classItem.subjects}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        <p>
                          {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Educator: {classItem.educator?.first} {classItem.educator?.last}
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
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Past Classes</h2>
              {loading ? (
                <p>Loading past classes...</p>
              ) : pastClasses.length > 0 ? (
                <div className="space-y-4">
                  {pastClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="border p-4 rounded-md bg-white shadow hover:shadow-lg transition"
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/class-details/${classItem.pkTrainingLogID}`)}
                      >
                        <div className="flex items-center mb-2">
                          <Calendar className="mr-2 h-5 w-5 text-primary" />
                          <p className="text-lg font-medium">{formatDate(classItem.dateofclass)}</p>
                        </div>
                        <p className="text-xl font-semibold">{classItem.subjects}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4" />
                          <p>
                            {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Educator: {classItem.educator?.first} {classItem.educator?.last}
                        </p>
                      </div>
                      <div className="mt-4">
                        <label htmlFor={`review-${classItem.pkTrainingLogID}`} className="block text-sm font-medium text-gray-700">
                          Leave a Review
                        </label>
                        <textarea
                          id={`review-${classItem.pkTrainingLogID}`}
                          rows="3"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          defaultValue={classItem.review || ""}
                          onBlur={(e) => handleReviewSubmit(classItem.pkTrainingLogID, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past classes available.</p>
              )}
            </div>
          </div>

          {/* Right Section: Calendar */}
          <div className="w-full md:w-3/4">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;