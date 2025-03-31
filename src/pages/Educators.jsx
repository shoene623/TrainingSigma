"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Mail, Phone } from "lucide-react"

const Educators = () => {
  const [educators, setEducators] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEducators()
  }, [])

  const fetchEducators = async () => {
    setLoading(true)
    try {
      // Fetch all educators, sorted by first and last name
      const { data, error } = await supabase
        .from("educators")
        .select("*") // Fetch all columns
        .order("first", { ascending: true }) // Sort by first name
        .order("last", { ascending: true }) // Then sort by last name

      if (error) throw error

      setEducators(data || [])
    } catch (error) {
      console.error("Error fetching educators:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEducators = educators.filter(
    (educator) =>
      educator.first?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.last?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.email1?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Educators</h1>
        <Button asChild>
          <Link to="/educators/new-educator">
            <Plus className="mr-2 h-4 w-4" />
            New Educator
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex w-full sm:w-auto">
          <Input
            placeholder="Search educators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-r-none"
          />
          <Button variant="secondary" className="rounded-l-none">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredEducators.length > 0 ? (
              filteredEducators.map((educator) => (
                <TableRow key={educator.pkEducatorID}>
                  <TableCell className="font-medium">{`${educator.first} ${educator.last}`}</TableCell>
                  <TableCell>{educator.teach_state || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      {educator.email1 || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>${educator.rate1 || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/educators/${educator.pkEducatorID}`}>
                          <Search className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <a href={`mailto:${educator.email1}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                      {educator.cell && (
                        <Button variant="ghost" size="icon">
                          <a href={`tel:${educator.cell}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No educators found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Educators