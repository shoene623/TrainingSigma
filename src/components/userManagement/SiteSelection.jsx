import React from "react";

function SiteSelection({ filteredSites, selectedSites, handleSiteCheckboxChange }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Assign Sites</h2>
      <div className="w-full p-2 border rounded-md max-h-64 overflow-y-auto">
        {filteredSites.map((site) => (
          <div key={site.pkSiteID} className="flex items-center">
            <input
              type="checkbox"
              id={`site-${site.pkSiteID}`}
              value={site.pkSiteID}
              checked={selectedSites.includes(site.pkSiteID)}
              onChange={() => handleSiteCheckboxChange(site.pkSiteID)}
              className="mr-2"
            />
            <label htmlFor={`site-${site.pkSiteID}`}>
              {site.SiteName} - {site.SiteAdd1}, {site.SiteCity}, {site.SiteZip}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SiteSelection;