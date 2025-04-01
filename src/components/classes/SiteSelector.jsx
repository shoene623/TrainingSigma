import React from "react";
import Select from "react-select";

const SiteSelector = ({ sites, formData, setFormData }) => {
  const siteOptions = sites.map((site) => ({
    value: site.pkSiteID,
    label: `${site.SiteName} (${site.SiteCity}, ${site.SiteState})`,
  }));

  return (
    <div>
      <label htmlFor="siteId" className="block text-sm font-medium">
        Select Site
      </label>
      <Select
        options={siteOptions}
        value={siteOptions.find((option) => option.value === formData.siteId)}
        onChange={(selectedOption) => setFormData({ ...formData, siteId: selectedOption.value })}
        className="w-full"
        placeholder="Choose a site"
        isDisabled={!formData.companyId} // Disable if no company is selected
      />
    </div>
  );
};

export default SiteSelector;