import React from "react";
import { Input } from "@/components/ui/input";

const PreferredDates = ({ formData, setFormData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="preferredDateStart" className="block text-sm font-medium">
          Preferred Start Date
        </label>
        <Input
          type="date"
          value={formData.preferredDateStart}
          onChange={(e) => setFormData({ ...formData, preferredDateStart: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="preferredDateEnd" className="block text-sm font-medium">
          Preferred End Date
        </label>
        <Input
          type="date"
          value={formData.preferredDateEnd}
          onChange={(e) => setFormData({ ...formData, preferredDateEnd: e.target.value })}
        />
      </div>
    </div>
  );
};

export default PreferredDates;