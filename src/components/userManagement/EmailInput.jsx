import React from "react";

function EmailInput({ email, setEmail }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Email</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded-md"
        placeholder="Enter user's email"
      />
    </div>
  );
}

export default EmailInput;