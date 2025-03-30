"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabaseClient"

const Navbar = ({ user, onMenuClick }) => {
  const [notifications] = useState([
    { id: 1, message: "New class scheduled", read: false },
    { id: 2, message: "Educator confirmed availability", read: true },
  ])
  const [queueCount, setQueueCount] = useState(0) // State for queue count
  const [showProfileMenu, setShowProfileMenu] = useState(false) // State for profile menu visibility

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const fetchQueueCount = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const userId = session?.user?.id

        if (userId) {
          const { count, error } = await supabase
            .from("pending_class")
            .select("pktrainingclassid", { count: "exact" })
            .eq("queue_user_id", userId)

          if (error) throw error

          setQueueCount(count || 0)
        }
      } catch (error) {
        console.error("Error fetching queue count:", error)
      }
    }

    fetchQueueCount()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    } else {
      window.location.reload() // Reload the page after logout
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section: Menu Button and Logo */}
          <div className="flex items-center">
            <button className="md:hidden mr-2 p-2 rounded-md hover:bg-gray-100" onClick={onMenuClick}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span className="sr-only">Open sidebar</span>
            </button>
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">LifeSafe Training Portal</span>
            </Link>
          </div>

          {/* Right Section: Notifications and Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-gray-100 relative"
                onClick={() => {
                  if (queueCount > 0) {
                    window.location.href = "/pending-classes"
                  }
                }}
              >
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
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {queueCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    {queueCount}
                  </span>
                )}
              </button>
            </div>

            {/* Pending Classes Link */}
            {queueCount > 0 && (
              <Link to="/pending-classes" className="btn btn-secondary">
                Pending Classes
              </Link>
            )}

            {/* Profile */}
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowProfileMenu((prev) => !prev)}
              >
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar