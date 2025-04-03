"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Select from "react-select"; // Use Select for the educator dropdown

const Calendar = () => {
  const [events, setEvents] = useState([]); // Calendar events
  const [educators, setEducators] = useState([]); // List of educators
  const [selectedEducator, setSelectedEducator] = useState(null); // Selected educator filter
  const [showAvailability, setShowAvailability] = useState(false); // Checkbox for availability
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducators();
    fetchClasses();
  }, [selectedEducator, showAvailability]);

  // Fetch educators for the dropdown
  const fetchEducators = async () => {
    try {
      const { data, error } = await supabase
        .from("educators")
        .select("pkEducatorID, first, last, teach_state");

      if (error) throw error;

      // Map educators to the format required by the dropdown
      const educatorOptions = data.map((educator) => ({
        value: educator.pkEducatorID,
        label: `${educator.first} ${educator.last} (${educator.teach_state})`,
      }));

      setEducators(educatorOptions); // Set the educators state
    } catch (error) {
      console.error("Error fetching educators:", error.message);
      setEducators([]); // Ensure educators is always an array
    }
  };

  // Fetch classes and availability from pending_class, trainingLog, and availability
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
          fkEducatorID,
          sites:fkSiteID(SiteName, SiteCity, SiteState)
        `)
        .order("preferred_date_start", { ascending: true });
  
      if (pendingError) throw pendingError;
  
      // Filter pending classes by selected educator if applicable
      const filteredPendingData = selectedEducator
        ? pendingData.filter((classItem) => classItem.fkEducatorID === selectedEducator.value)
        : pendingData;
  
      // Fetch confirmed classes
      const { data: confirmedData, error: confirmedError } = await supabase
        .from("trainingLog")
        .select(`
          pkTrainingLogID,
          dateofclass,
          subjects,
          fkEducatorID,
          sites:fkSiteID(SiteName, SiteCity, SiteState)
        `)
        .gte("dateofclass", today)
        .order("dateofclass", { ascending: true });
  
      if (confirmedError) throw confirmedError;
  
      // Filter confirmed classes by selected educator if applicable
      const filteredConfirmedData = selectedEducator
        ? confirmedData.filter((classItem) => classItem.fkEducatorID === selectedEducator.value)
        : confirmedData;
  
      // Fetch availability if checkbox is checked and an educator is selected
      let availabilityData = [];
      if (showAvailability && selectedEducator) {
        const { data: availability, error: availabilityError } = await supabase
          .from("availability")
          .select(`
            id,
            start_datetime,
            end_datetime,
            is_all_day,
            rrule,
            summary,
            description,
            timezone,
            status,
            transparency,
            dtstamp,
            sequence
          `)
          .eq("fkEducatorID", selectedEducator.value);
  
        if (availabilityError) {
          console.error("Error fetching availability:", availabilityError.message);
        } else {
          availabilityData = availability.map((item) => {
            const isAllDay = item.is_all_day;
            const start = new Date(item.start_datetime).toISOString();
            const end = isAllDay
              ? new Date(new Date(item.end_datetime).getTime() + 24 * 60 * 60 * 1000).toISOString()
              : new Date(item.end_datetime).toISOString();
  
            return {
              title: item.summary || "Available",
              start,
              end,
              color: "green",
              allDay: isAllDay,
              extendedProps: {
                description: item.description,
                timezone: item.timezone,
                status: item.status,
                transparency: item.transparency,
                dtstamp: item.dtstamp,
                sequence: item.sequence,
                rrule: item.rrule,
              },
            };
          });
        }
      }
  
      // Combine and filter data
      const combinedData = [
        ...filteredPendingData.map((classItem) => ({
          title: classItem.class_type || "Pending Class",
          start: classItem.preferred_date_start,
          end: classItem.preferred_date_end,
          color: "orange", // Pending class color
          extendedProps: {
            educatorId: classItem.fkEducatorID,
            siteName: classItem.sites?.SiteName,
            siteCity: classItem.sites?.SiteCity,
            siteState: classItem.sites?.SiteState,
          },
        })),
        ...filteredConfirmedData.map((classItem) => ({
          title: classItem.subjects || "Confirmed Class",
          start: classItem.dateofclass,
          color: "skyblue", // Confirmed class color
          extendedProps: {
            educatorId: classItem.fkEducatorID,
            siteName: classItem.sites?.SiteName,
            siteCity: classItem.sites?.SiteCity,
            siteState: classItem.sites?.SiteState,
          },
        })),
        ...availabilityData, // Add availability data
      ];
  
      console.log("Combined data for calendar:", combinedData); // Debugging log
  
      setEvents(combinedData);
    } catch (error) {
      console.error("Error fetching classes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for the Select dropdown
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "white",
      borderColor: "#d1d5db", // Tailwind gray-300
      boxShadow: "none",
      "&:hover": {
        borderColor: "#9ca3af", // Tailwind gray-400
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 10, // Ensure dropdown appears above other elements
    }),
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Training Calendar</h1>

      {/* Educator Filter */}
      <div className="w-1/3">
        <label className="block text-sm font-medium text-gray-700">Filter by Educator</label>
        <Select
          options={educators} // Use the fetched educators
          value={selectedEducator}
          onChange={(option) => setSelectedEducator(option)}
          isClearable
          placeholder="Select an educator"
          styles={customStyles} // Apply custom styles
        />
      </div>

     {/* Availability Checkbox */}
{selectedEducator && (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="showAvailability"
      checked={showAvailability}
      onChange={(e) => setShowAvailability(e.target.checked)}
      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <label htmlFor="showAvailability" className="text-sm font-medium text-gray-700">
      Show Availability
    </label>
  </div>
)}
      {/* Calendar */}
      <div className="bg-white shadow rounded-lg p-4">
        {loading ? (
          <p>Loading calendar...</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
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

export default Calendar;