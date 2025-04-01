import React from "react";

const EstimatedCost = ({ calculateEstimate }) => {
  return (
    <div>
      <label className="block text-sm font-medium">Estimated Cost</label>
      <p className="text-lg font-semibold">${calculateEstimate().toFixed(2)}</p>
    </div>
  );
};

export default EstimatedCost;