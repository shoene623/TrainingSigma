"use client";

import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const Sidebar = ({ open, setOpen, userRole }) => {
  const location = useLocation();
  const [pendingClassOpen, setPendingClassOpen] = useState(false); // State for Pending Class dropdown toggle
  const [emailsOpen, setEmailsOpen] = useState(false); // State for Emails dropdown toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // State for sidebar collapse

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Classes", href: "/classes", icon: "calendar" },
    ...(userRole === "client_admin"
      ? [
          { name: "Request Class", href: "/request-class", icon: "user-plus" },
        ]
      : []),
    // The following items will only be visible to LifeSafe users
    ...(userRole === "LifeSafe"
      ? [
          { name: "Educators", href: "/educators", icon: "users" },
          { name: "Invite User", href: "/invite-user", icon: "user-plus" },
        ]
      : []),
  ];

  const pendingClassActions = [
    { name: "Create Class", href: "/create-class" },
    { name: "View Pending Classes", href: "/pending-classes" },
    { name: "pending-bill", href: "/pending-bill" },
  ];

  const emailActions = [
    { name: "3-Day Confirmation", href: "/emails/three-day-reminders" },
    { name: "2-Year Reminder", href: "/emails/2-year-reminder" },
    { name: "Class Follow Up", href: "/emails/class-follow-up" },
  ];

  const icons = {
    home: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    calendar: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
        <line x1="16" x2="16" y1="2" y2="6"></line>
        <line x1="8" x2="8" y1="2" y2="6"></line>
        <line x1="3" x2="21" y1="10" y2="10"></line>
      </svg>
    ),
    users: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    "user-plus": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <line x1="19" x2="19" y1="8" y2="14"></line>
        <line x1="22" x2="16" y1="11" y2="11"></line>
      </svg>
    ),
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`sidebar ${
          isCollapsed ? "w-16" : "w-64"
        } bg-gray-100 h-screen transition-all duration-300`}
      >
        <button
          className="p-2 text-gray-700 hover:bg-gray-200"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? ">" : "<"}
        </button>
        <nav>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname === item.href
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setOpen(false)}
            >
              <span className="mr-3">{icons[item.icon]}</span>
              {!isCollapsed && item.name}
            </Link>
          ))}

          {/* Pending Class Dropdown (Visible only for educator or LifeSafe roles) */}
          {(userRole === "educator" || userRole === "LifeSafe") && (
            <div className="flex flex-col">
              <button
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setPendingClassOpen(!pendingClassOpen)}
              >
                <span className="mr-3 text-gray-400">{icons.calendar}</span>
                {!isCollapsed && "Pending Class"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`ml-auto h-4 w-4 transform ${
                    pendingClassOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {pendingClassOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {pendingClassActions.map((action) => (
                    <Link
                      key={action.name}
                      to={action.href}
                      className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      {action.name}
                    </Link>
                  ))}
                </div>
                
              )}
            </div>
          )}

          {/* Emails Dropdown (Visible only for LifeSafe users) */}
          {userRole === "LifeSafe" && (
            <div className="flex flex-col">
              <button
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setEmailsOpen(!emailsOpen)}
              >
                <span className="mr-3 text-gray-400">{icons.users}</span>
                {!isCollapsed && "Emails"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`ml-auto h-4 w-4 transform ${
                    emailsOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {emailsOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {emailActions.map((action) => (
                    <Link
                      key={action.name}
                      to={action.href}
                      className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      {action.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;