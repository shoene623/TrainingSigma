import React from "react";

function InviteButton({ inviteUser }) {
  return (
    <button
      onClick={inviteUser}
      className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
    >
      Invite User
    </button>
  );
}

export default InviteButton;