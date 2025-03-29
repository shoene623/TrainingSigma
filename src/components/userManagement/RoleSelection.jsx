import React from "react";

function RoleSelection({ role, setRole }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Role</h2>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full p-2 border rounded-md"
      >
        <option value="" disabled>Select a role</option>
        <option value="client_admin">Client Admin</option>
        <option value="Inspector">Inspector</option>
      </select>
    </div>
  );
}

export default RoleSelection;