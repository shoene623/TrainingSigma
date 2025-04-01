import React from "react";
import Select from "react-select";

const classTypes = [
  { value: "CPR", label: "CPR", hours: 4 },
  { value: "First Aid", label: "First Aid", hours: 3 },
  { value: "OSHA", label: "OSHA", hours: 6 },
];

const ClassTypeSelector = ({ formData, setFormData }) => {
  const handleClassTypeChange = (selectedOptions) => {
    const selectedClassTypes = selectedOptions.map((option) => option.value);
    setFormData({ ...formData, classTypes: selectedClassTypes });
  };

  return (
    <div>
      <label htmlFor="classTypes" className="block text-sm font-medium">
        Select Class Types
      </label>
      <Select
        options={classTypes}
        value={classTypes.filter((type) => formData.classTypes.includes(type.value))}
        onChange={handleClassTypeChange}
        isMulti
        className="w-full"
        placeholder="Choose class types"
      />
    </div>
  );
};

export default ClassTypeSelector;