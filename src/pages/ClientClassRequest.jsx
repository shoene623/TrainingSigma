"use client";

import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // Import Sidebar
import { Input } from "@/components/ui/input";

const ClientClassRequest = () => {
  const [formData, setFormData] = useState({
    classTypes: [],
    preferredDateStart: "",
    preferredDateEnd: "",
    notes: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar toggle
  const navigate = useNavigate();

  const classTypes = [
    { name: "AED", hours: 2 },
    { name: "CPR", hours: 3 },
    { name: "BBP", hours: 1 },
    { name: "SFA", hours: 2 },
    { name: "EFA", hours: 3 },
    { name: "40 Hour First Responder", hours: 40 },
    { name: "Advanced SFA", hours: 4 },
    { name: "AHA CPR Pro", hours: 3 },
    { name: "ASHI BLS", hours: 3 },
    { name: "ASHI CABS", hours: 2 },
    { name: "ASHI CPR Pro", hours: 3 },
    { name: "Babysitter Safety 101", hours: 2 },
    { name: "Babysitter Safety 102", hours: 2 },
    { name: "Earthquake Preparedness", hours: 1 },
    { name: "ECSI CPR Pro", hours: 3 },
    { name: "Infant CPR", hours: 2 },
    { name: "Pediatric CPR", hours: 3 },
  ];

  const handleClassTypeChange = (classType) => {
    setFormData((prev) => {
      const isSelected = prev.classTypes.includes(classType);
      const updatedClassTypes = isSelected
        ? prev.classTypes.filter((type) => type !== classType)
        : [...prev.classTypes, classType];
      return { ...prev, classTypes: updatedClassTypes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User is not authenticated.");
      }

      const { error } = await supabase.from("pending_class").insert({
        class_type: formData.classTypes.join(", "),
        preferred_date_start: formData.preferredDateStart,
        preferred_date_end: formData.preferredDateEnd,
        notes: formData.notes,
        coordinator_id: userId,
        status: "Pending Review",
      });

      if (error) throw error;

      alert("Class request submitted successfully!");
      navigate("/client-dashboard");
    } catch (error) {
      console.error("Error submitting class request:", error);
      alert("Failed to submit the class request.");
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userRole="client_admin" />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Request a Class</h1>
          <button
            onClick={() => navigate("/client-dashboard")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition"
          >
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Type Checkboxes */}
          <div>
            <label htmlFor="classTypes" className="block text-sm font-medium text-gray-700">
              Select Class Types
            </label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {classTypes.map((classType) => (
                <div key={classType.name} className="flex items-center">
                  <input
                    type="checkbox"
                    id={classType.name}
                    checked={formData.classTypes.includes(classType.name)}
                    onChange={() => handleClassTypeChange(classType.name)}
                    className="mr-2"
                  />
                  <label htmlFor={classType.name} className="text-sm">
                    {classType.name} ({classType.hours} Hours)
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Dates */}
          <div>
            <label htmlFor="preferredDateStart" className="block text-sm font-medium text-gray-700">
              Preferred Start Date
            </label>
            <Input
              id="preferredDateStart"
              name="preferredDateStart"
              type="date"
              value={formData.preferredDateStart}
              onChange={(e) => setFormData({ ...formData, preferredDateStart: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="preferredDateEnd" className="block text-sm font-medium text-gray-700">
              Preferred End Date
            </label>
            <Input
              id="preferredDateEnd"
              name="preferredDateEnd"
              type="date"
              value={formData.preferredDateEnd}
              onChange={(e) => setFormData({ ...formData, preferredDateEnd: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter location, estimated students, and any additional details..."
              className="block w-full border rounded-md p-2"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-600 transition"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClientClassRequest;