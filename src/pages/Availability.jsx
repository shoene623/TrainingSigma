"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import DatePicker from "react-datepicker";
import * as ical from "node-ical"; // ✅ Import node-ical for frontend parsing
import "react-datepicker/dist/react-datepicker.css";

const Availability = () => {
  const [availability, setAvailability] = useState([]); // Availability events
  const [startDate, setStartDate] = useState(null); // Start date
  const [endDate, setEndDate] = useState(null); // End date
  const [summary, setSummary] = useState(""); // Event summary
  const [isAllDay, setIsAllDay] = useState(false); // All-day event flag
  const [loading, setLoading] = useState(true);
  const [educatorId, setEducatorId] = useState(null); // Educator ID

  useEffect(() => {
    // Fetch the logged-in educator's ID
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

    fetchEducatorId();
  }, []);

  useEffect(() => {
    if (educatorId) {
      fetchAvailability();
    }
  }, [educatorId]);

  // Fetch availability for the logged-in educator
  const fetchAvailability = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Add availability manually
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

      // Refresh availability after adding
      fetchAvailability();
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

  // Handle file upload and parse ICS file
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

        // Filter only VEVENT types
        const events = Object.values(parsedData).filter(
          (event) => event.type === "VEVENT" && event.start && event.end
        );

        if (events.length === 0) {
          alert("No valid calendar events found in the file.");
          return;
        }

        const entries = events.map((event) => ({
          fkEducatorID: educatorId,
          start_datetime: new Date(event.start).toISOString(),
          end_datetime: new Date(event.end).toISOString(),
          summary: event.summary || "Available",
          is_all_day:
            event.datetype === "date" ||
            (!event.start.getHours && !event.end.getHours),
        }));

        // Insert parsed events into Supabase
        const { error } = await supabase.from("availability").insert(entries);
        if (error) throw error;

        alert(`✅ Imported ${entries.length} events!`);
        fetchAvailability(); // Refresh availability after syncing
      } catch (error) {
        console.error("Error parsing ICS file:", error.message);
        alert("❌ Failed to parse ICS file: " + error.message);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Manage Availability</h1>

      {/* Add Availability Form */}
      <div className="bg-white shadow rounded-lg p-4 space-y-4">
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
      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Upload ICS File</h2>
        <input
          type="file"
          accept=".ics"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
        />
      </div>

      {/* Availability Calendar */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Availability</h2>
        {loading ? (
          <p>Loading availability...</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={availability}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek,dayGridDay",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Availability;