"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Calendar, MapPin } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const EducatorDashboard = () => {
  const [pendingClasses, setPendingClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // State for selected class
  const [events, setEvents] = useState([]); // Calendar events
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

      // Fetch pending classes
      const { data: pendingData, error: pendingError } = await supabase
        .from("pending_class")
        .select(`
          pktrainingclassid,
          class_type,
          preferred_date_start,
          preferred_date_end,
          status,
          sites:fkSiteID(SiteName, SiteCity, SiteState)
        `)
        .order("preferred_date_start", { ascending: true });

      if (pendingError) throw pendingError;

      // Fetch upcoming classes
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, subjects, sites:fkSiteID(SiteName, SiteCity, SiteState)")
        .gte("dateofclass", today)
        .order("dateofclass", { ascending: true });

      if (upcomingError) throw upcomingError;

      // Fetch past classes
      const { data: pastData, error: pastError } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, dateofclass, subjects, sites:fkSiteID(SiteName, SiteCity, SiteState)")
        .lt("dateofclass", today)
        .order("dateofclass", { ascending: false });

      if (pastError) throw pastError;

      setPendingClasses(pendingData || []);
      setUpcomingClasses(upcomingData || []);
      setPastClasses(pastData || []);

      // Map upcoming classes to calendar events
      const upcomingEvents = (upcomingData || []).map((classItem) => ({
        title: classItem.subjects || "Class",
        start: classItem.dateofclass,
        color: "skyblue", // Color for upcoming classes
        extendedProps: {
          classId: classItem.pkTrainingLogID,
          siteName: classItem.sites?.SiteName,
          siteCity: classItem.sites?.SiteCity,
          siteState: classItem.sites?.SiteState,
        },
      }));

      // Map pending classes to calendar events
      const pendingEvents = (pendingData || []).map((classItem) => ({
        title: classItem.class_type || "Pending Class",
        start: classItem.preferred_date_start,
        end: classItem.preferred_date_end, // Highlight the range
        color: "orange", // Color for pending classes
        extendedProps: {
          classId: classItem.pktrainingclassid,
          siteName: classItem.sites?.SiteName,
          siteCity: classItem.sites?.SiteCity,
          siteState: classItem.sites?.SiteState,
        },
      }));

      setEvents([...upcomingEvents, ...pendingEvents]);
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
    const selected =
      upcomingClasses.find((classItem) => classItem.pkTrainingLogID === classId) ||
      pendingClasses.find((classItem) => classItem.pktrainingclassid === classId);
    setSelectedClass(selected);
  };

  const handleClassClick = (classId) => {
    navigate(`/classes/${classId}`); // Navigate to the ClassDetail page
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userRole="educator" />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Educator Dashboard</h1>
        </div>

        <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
          {/* Left Section: Pending, Upcoming, and Past Classes */}
          <div className="w-full md:w-1/4 space-y-8">
            {/* Pending Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Classes</h2>
              {loading ? (
                <p>Loading pending classes...</p>
              ) : pendingClasses.length > 0 ? (
                <div className="space-y-4">
                  {pendingClasses.map((classItem) => (
                    <div
                      key={classItem.pktrainingclassid}
                      className="border p-4 rounded-md bg-white shadow hover:shadow-lg transition cursor-pointer"
                      onClick={() => navigate("/pending-classes")} // Navigate to Pending Classes page
                    >
                      <div className="flex items-center mb-2">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        <p className="text-lg font-medium">
                          {formatDate(classItem.preferred_date_start)} - {formatDate(classItem.preferred_date_end)}
                        </p>
                      </div>
                      <p className="text-xl font-semibold">{classItem.class_type}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        <p>
                          {classItem.sites?.SiteName}, {classItem.sites?.SiteCity}, {classItem.sites?.SiteState}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">Status: {classItem.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No pending classes found.</p>
              )}
            </div>

            {/* Upcoming Classes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Classes</h2>
              {loading ? (
                <p>Loading upcoming classes...</p>
              ) : upcomingClasses.length > 0 ? (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.pkTrainingLogID}
                      className="border p-4 rounded-md bg-white shadow hover:shadow-lg transition cursor-pointer"
                      onClick={() => handleClassClick(classItem.pkTrainingLogID)} // Navigate to ClassDetail page
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
                      className="border p-4 rounded-md bg-white shadow hover:shadow-lg transition cursor-pointer"
                      onClick={() => handleClassClick(classItem.pkTrainingLogID)} // Navigate to ClassDetail page
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past classes found.</p>
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

export default EducatorDashboard;