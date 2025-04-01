import React from "react";
import { Textarea } from "@/components/ui/textarea";

const NotesInput = ({ formData, setFormData }) => {
  return (
    <div>
      <label htmlFor="notes" className="block text-sm font-medium">
        Notes
      </label>
      <Textarea
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Enter any additional notes here"
        rows={4}
      />
    </div>
  );
};

export default NotesInput;