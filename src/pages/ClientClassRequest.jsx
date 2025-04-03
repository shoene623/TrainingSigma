"use client";

import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Modal from "../components/ui/Modal";
import { Button } from "@/components/ui/button";

const ClientClassRequest = () => {
  const [formData, setFormData] = useState({
    classTypes: [],
    preferredDateStart: "",
    preferredDateEnd: "",
    notes: "",
  });
  const [emailPreview, setEmailPreview] = useState(null); // State for email preview
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
      // Insert the class request into the `pending_class` table
      const { data, error } = await supabase
        .from("pending_class")
        .insert({
          class_type: formData.classTypes.join(", "),
          preferred_date_start: formData.preferredDateStart,
          preferred_date_end: formData.preferredDateEnd,
          notes: formData.notes,
          status: "Pending Review",
        })
        .select("*")
        .single();

      if (error) throw error;

      // Format the email content
      const emailContent = `
        <p>A new class request has been submitted:</p>
        <ul>
          <li><strong>Class Types:</strong> ${data.class_type}</li>
          <li><strong>Preferred Start Date:</strong> ${new Date(data.preferred_date_start).toLocaleDateString()}</li>
          <li><strong>Preferred End Date:</strong> ${new Date(data.preferred_date_end).toLocaleDateString()}</li>
          <li><strong>Notes:</strong> ${data.notes || "None"}</li>
        </ul>
      `;

      // Set the email preview state and open the modal
      setEmailPreview({
        to: "sean@lifesafeservices.com",
        subject: "New Class Request Submitted",
        html: emailContent,
      });
    } catch (error) {
      console.error("Error submitting class request:", error);
      alert("Failed to submit the class request.");
    }
  };

  const handleSendEmail = async () => {
    if (!emailPreview) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(emailPreview),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Error sending email:", data);
        alert("Failed to send the email notification.");
        return;
      }

      alert("Class request submitted successfully and email sent!");
      setEmailPreview(null); // Close the modal
      navigate("/client-dashboard");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("An unexpected error occurred while sending the email.");
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">

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

        {/* Email Preview Modal */}
        {emailPreview && (
          <Modal isOpen={!!emailPreview} onClose={() => setEmailPreview(null)}>
            <div>
              <h2 className="text-xl font-bold mb-4">Email Preview</h2>
              <p><strong>To:</strong> {emailPreview.to}</p>
              <p><strong>Subject:</strong> {emailPreview.subject}</p>
              <div className="border p-2 rounded-md whitespace-pre-line">
                {emailPreview.html}
              </div>
              <div className="mt-4 text-right">
                <Button
                  onClick={handleSendEmail}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Send Email
                </Button>
                <Button
                  onClick={() => setEmailPreview(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded ml-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ClientClassRequest;