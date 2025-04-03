"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import DatePicker from "react-datepicker";
import * as ical from "node-ical"; // ✅ Import node-ical for frontend parsing
import "react-datepicker/dist/react-datepicker.css";

const EducatorDashboard = () => {
  const [pendingClasses, setPendingClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // State for selected class
  const [events, setEvents] = useState([]); // Calendar events
  const [availability, setAvailability] = useState([]); // Availability events
  const [startDate, setStartDate] = useState(null); // Start date
  const [endDate, setEndDate] = useState(null); // End date
  const [summary, setSummary] = useState(""); // Event summary
  const [isAllDay, setIsAllDay] = useState(false); // All-day event flag
  const [loading, setLoading] = useState(true);
  const [educatorId, setEducatorId] = useState(null); // Educator ID
  const navigate = useNavigate();

  useEffect(() => {
    fetchEducatorId();
  }, []);

  useEffect(() => {
    if (educatorId) {
      fetchClasses();
      fetchAvailability();
    }
  }, [educatorId]);

  const fetchEducatorId = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      // Query the educators table to get the pkEducatorID
      const { data: educatorData, error: educatorError } = await supabase
        .from("educators")
        .select("pkEducatorID")
        .eq("fkProfileID", user.id)
        .single();

      if (educatorError) throw educatorError;

      setEducatorId(educatorData.pkEducatorID);
    } catch (error) {
      console.error("Error fetching educator ID:", error.message);
    }
  };

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

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("id, start_datetime, end_datetime, summary, is_all_day")
        .eq("fkEducatorID", educatorId);

      if (error) throw error;

      // Map availability data to calendar events
      const availabilityEvents = data.map((item) => ({
        id: item.id,
        title: item.summary || "Available",
        start: item.start_datetime,
        end: item.end_datetime,
        allDay: item.is_all_day,
        color: "green", // Availability color
      }));

      setAvailability(availabilityEvents);
    } catch (error) {
      console.error("Error fetching availability:", error.message);
    }
  };

  const addAvailability = async () => {
    if (!startDate) {
      alert("Please select a start date.");
      return;
    }

    try {
      const { data, error } = await supabase.from("availability").insert([
        {
          fkEducatorID: educatorId,
          start_datetime: startDate.toISOString(),
          end_datetime: endDate ? endDate.toISOString() : startDate.toISOString(),
          is_all_day: isAllDay,
          summary: summary || "Available",
        },
      ]);

      if (error) throw error;

      fetchAvailability(); // Refresh availability after adding
      alert("Availability added successfully!");

      // Clear form fields
      setStartDate(null);
      setEndDate(null);
      setSummary("");
      setIsAllDay(false);
    } catch (error) {
      console.error("Error adding availability:", error.message);
      alert("❌ Failed to add availability: " + error.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please select a file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const icsText = e.target.result;
        const parsedData = ical.parseICS(icsText);

        // Filter only VEVENT types and future events
        const now = new Date();
        const events = Object.values(parsedData).filter(
          (event) =>
            event.type === "VEVENT" &&
            event.start &&
            event.end &&
            new Date(event.start) > now // Only future events
        );

        if (events.length === 0) {
          alert("No valid future calendar events found in the file.");
          return;
        }

        // Check for duplicates in the database
        const { data: existingEvents, error: fetchError } = await supabase
          .from("availability")
          .select("start_datetime, end_datetime")
          .eq("fkEducatorID", educatorId);

        if (fetchError) throw fetchError;

        const existingEventSet = new Set(
          existingEvents.map(
            (event) => `${event.start_datetime}-${event.end_datetime}`
          )
        );

        // Filter out duplicates
        const newEntries = events
          .map((event) => ({
            fkEducatorID: educatorId,
            start_datetime: new Date(event.start).toISOString(),
            end_datetime: new Date(event.end).toISOString(),
            summary: event.summary || "Available",
            is_all_day:
              event.datetype === "date" ||
              (!event.start.getHours && !event.end.getHours),
          }))
          .filter(
            (entry) =>
              !existingEventSet.has(
                `${entry.start_datetime}-${entry.end_datetime}`
              )
          );

        if (newEntries.length === 0) {
          alert("No new events to add. All events are already in the database.");
          return;
        }

        // Insert parsed events into Supabase
        const { error } = await supabase.from("availability").insert(newEntries);
        if (error) throw error;

        alert(`✅ Imported ${newEntries.length} new events!`);
        fetchAvailability(); // Refresh availability after syncing
      } catch (error) {
        console.error("Error parsing ICS file:", error.message);
        alert("❌ Failed to parse ICS file: " + error.message);
      }
    };

    reader.readAsText(file);
  };

  const handleEventClick = (info) => {
    const classId = info.event.extendedProps.classId;
    const selected =
      upcomingClasses.find((classItem) => classItem.pkTrainingLogID === classId) ||
      pendingClasses.find((classItem) => classItem.pktrainingclassid === classId);
    setSelectedClass(selected);
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">


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
                        <p className="text-lg font-medium">
                          {classItem.preferred_date_start} - {classItem.preferred_date_end}
                        </p>
                      </div>
                      <p className="text-xl font-semibold">{classItem.class_type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No pending classes found.</p>
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
                      onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
                    >
                      <p className="text-lg font-medium">{classItem.dateofclass}</p>
                      <p className="text-xl font-semibold">{classItem.subjects}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No upcoming classes found.</p>
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
                      onClick={() => navigate(`/classes/${classItem.pkTrainingLogID}`)}
                    >
                      <p className="text-lg font-medium">{classItem.dateofclass}</p>
                      <p className="text-xl font-semibold">{classItem.subjects}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No past classes found.</p>
              )}
            </div>
          </div>

          {/* Right Section: Calendar */}
          <div className="w-full md:w-3/4">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={[...events, ...availability]} // Combine class and availability events
              eventClick={handleEventClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay",
              }}
            />
          </div>
        </div>

        {/* Add Availability Form */}
        <div className="bg-white shadow rounded-lg p-4 space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Add Availability</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showTimeSelect
                dateFormat="yyyy-MM-dd HH:mm"
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                showTimeSelect
                dateFormat="yyyy-MM-dd HH:mm"
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Event Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Event summary (e.g., Meeting)"
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* All-Day Event */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">All-Day Event</label>
            </div>
          </div>

          <button
            onClick={addAvailability}
            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
          >
            Add Availability
          </button>
        </div>

        {/* Upload ICS File */}
        <div className="bg-white shadow rounded-lg p-4 space-y-4 mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Upload ICS File</h2>
          <input
            type="file"
            accept=".ics"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default EducatorDashboard;