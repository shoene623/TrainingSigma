"use client";

import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ClientClassRequest = () => {
  const [formData, setFormData] = useState({
    classTypes: [], // Updated to allow multiple selections
    preferredDateStart: "",
    preferredDateEnd: "",
    notes: "",
  });
  const { toast } = useToast();
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
        class_type: formData.classTypes.join(", "), // Join selected class types into a string
        preferred_date_start: formData.preferredDateStart,
        preferred_date_end: formData.preferredDateEnd,
        notes: formData.notes,
        coordinator_id: userId,
        status: "Pending Review",
      });

      if (error) throw error;

      toast({
        title: "Class Request Submitted",
        description: "Your class request has been successfully submitted.",
      });
      navigate("/client-dashboard");
    } catch (error) {
      console.error("Error submitting class request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit the class request.",
      });
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
        <h1 className="text-3xl font-bold tracking-tight">Request a Class</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Type Checkboxes */}
          <div>
            <label htmlFor="classTypes" className="block text-sm font-medium">
              Select Class Types
            </label>
            <div className="grid grid-cols-2 gap-2">
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
            <label htmlFor="preferredDateStart" className="block text-sm font-medium">
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
            <label htmlFor="preferredDateEnd" className="block text-sm font-medium">
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
            <label htmlFor="notes" className="block text-sm font-medium">
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

          <Button type="submit">Submit Request</Button>
        </form>
      </div>
    </div>
  );
};

export default ClientClassRequest;