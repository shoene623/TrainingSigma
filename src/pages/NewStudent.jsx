"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"

const NewStudent = () => {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("trainingLog")
        .select("pkTrainingLogID, company, dateofclass")
        .order("dateofclass", { ascending: false })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClass || !studentName || !studentEmail) {
      alert("Please fill out all fields.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("students").insert({
        name: studentName,
        email: studentEmail,
        fkTrainingLogID: selectedClass,
      })

      if (error) throw error

      alert("Student added successfully!")
      navigate("/students")
    } catch (error) {
      console.error("Error adding student:", error)
      alert("Failed to add student. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add New Student</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700">
            Select Class
          </label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((classItem) => (
                <SelectItem key={classItem.pkTrainingLogID} value={classItem.pkTrainingLogID}>
                  {classItem.company} - {new Date(classItem.dateofclass).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Student Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Enter student name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Student Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter student email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Student"}
        </Button>
      </form>
    </div>
  )
}

export default NewStudent