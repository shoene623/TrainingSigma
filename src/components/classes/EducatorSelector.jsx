import React from "react";
import Select from "react-select";

const EducatorSelector = ({ educators, formData, setFormData, setSelectedEducator }) => { // Expecting 'educators' prop here
  const educatorOptions = educators?.map((educator) => ({ // Add optional chaining
    value: educator.pkEducatorID,
    label: `${educator.first} ${educator.last} (${educator.teach_state})`,
  })) || []; // Default to an empty array if educators is undefined

  const handleEducatorChange = (selectedOption) => {
    const selectedEducator = educators?.find((educator) => educator.pkEducatorID === selectedOption.value);
    setFormData({ ...formData, educatorId: selectedOption.value });
    setSelectedEducator(selectedEducator);
  };

  return (
    <div>
      <label htmlFor="educatorId" className="block text-sm font-medium">
        Select Educator
      </label>
      <Select
        options={educatorOptions}
        value={educatorOptions.find((option) => option.value === formData.educatorId)}
        onChange={handleEducatorChange}
        className="w-full"
        placeholder="Choose an educator"
      />
    </div>
  );
};

export default EducatorSelector;