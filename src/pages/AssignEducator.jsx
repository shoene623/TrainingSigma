"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const AssignEducator = () => {
  const { requestId } = useParams()
  const [educators, setEducators] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEligibleEducators()
  }, [])

  const fetchEligibleEducators = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("educators")
        .select("*")
        .order("first", { ascending: true })
        .order("last", { ascending: true })

      if (error) throw error

      setEducators(data || [])
    } catch (error) {
      console.error("Error fetching educators:", error)
    } finally {
      setLoading(false)
    }
  }

  const assignEducator = async (educatorId) => {
    try {
      const { error } = await supabase
        .from("pending_class") // Updated table name
        .update({ educator_id: educatorId, status: "offered" }) // Update educator_id and status
        .eq("pktrainingclassid", requestId) // Match the primary key

      if (error) throw error

      navigate("/dashboard")
    } catch (error) {
      console.error("Error assigning educator:", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Assign Educator</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {educators.map((educator) => (
              <TableRow key={educator.pkEducatorID}>
                <TableCell>{`${educator.first} ${educator.last}`}</TableCell>
                <TableCell>{educator.teach_state || "N/A"}</TableCell>
                <TableCell>{educator.email1 || "N/A"}</TableCell>
                <TableCell>
                  <Button onClick={() => assignEducator(educator.pkEducatorID)}>Assign</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default AssignEducator