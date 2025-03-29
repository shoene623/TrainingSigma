"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Calendar, Search, Plus, ChevronUp, ChevronDown } from "lucide-react"

const Classes = ({ userRole }) => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("upcoming")
  const [stateFilter, setStateFilter] = useState("")
  const [states, setStates] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortColumn, setSortColumn] = useState("dateofclass")
  const [sortOrder, setSortOrder] = useState("asc") // "asc" or "desc"
  const itemsPerPage = 10

  useEffect(() => {
    fetchStates()
    fetchClasses()
  }, [timeFilter, stateFilter, page, sortColumn, sortOrder])

  const fetchStates = async () => {
    try {
      const { data } = await supabase.from("trainingLog").select("state").not("state", "is", null).order("state", { ascending: true })

      const uniqueStates = [...new Set(data.map((item) => item.state))]
      setStates(uniqueStates)
    } catch (error) {
      console.error("Error fetching states:", error)
    }
  }

  const fetchClasses = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("trainingLog")
        .select(
          `
          pkTrainingLogID,
          dateofclass,
          company,
          state,
          instructor,
          fkEducatorID,
          educators:fkEducatorID (
            pkEducatorID,
            first,
            last
          )
        `,
          { count: "exact" } // Include the count option here
        )
        .order(sortColumn, { ascending: sortOrder === "asc" })
  
      const today = new Date().toISOString().split("T")[0]
      if (timeFilter === "upcoming") {
        query = query.gte("dateofclass", today)
      } else if (timeFilter === "past") {
        query = query.lt("dateofclass", today)
      }
  
      if (stateFilter) {
        query = query.eq("state", stateFilter)
      }
  
      if (userRole === "educator") {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          const { data: educatorData } = await supabase
            .from("educators")
            .select("pkEducatorID")
            .eq("auth_id", userData.user.id)
            .single()
  
          if (educatorData) {
            query = query.eq("fkEducatorID", educatorData.pkEducatorID)
          }
        }
      }
  
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)
  
      const { data, count, error } = await query
  
      if (error) throw error
      setClasses(data || [])
      setTotalPages(Math.ceil(count / itemsPerPage)) // Use the count value here
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchClasses()
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getEducatorName = (classItem) => {
    if (classItem.educators) {
      return `${classItem.educators.first} ${classItem.educators.last}`
    }
    return classItem.instructor || "Not assigned"
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortOrder("asc")
    }
  }

  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEducatorName(classItem).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
        {userRole === "admin" && (
          <Button asChild>
            <Link to="/classes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Class
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex w-full sm:w-auto">
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-r-none"
          />
          <Button variant="secondary" className="rounded-l-none" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 gap-4">
        <Select
  value={timeFilter}
  onValueChange={setTimeFilter}
>
        <SelectTrigger className="w-full sm:w-[180px] bg-white border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder="Time period" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 rounded-md shadow-lg">
          <SelectItem value="all">All Classes</SelectItem>
          <SelectItem value="upcoming">Upcoming Classes</SelectItem>
          <SelectItem value="past">Past Classes</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={stateFilter}
        onValueChange={setStateFilter}
      >
        <SelectTrigger className="w-full sm:w-[180px] bg-white border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder="Select state" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-300 rounded-md shadow-lg">
          <SelectItem value="">All States</SelectItem>
          {states.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("dateofclass")}>
                Date {sortColumn === "dateofclass" && (sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </TableHead>
              <TableHead onClick={() => handleSort("company")}>
                Company {sortColumn === "company" && (sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </TableHead>
              <TableHead onClick={() => handleSort("state")}>
                State {sortColumn === "state" && (sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </TableHead>
              <TableHead onClick={() => handleSort("instructor")}>
                Educator {sortColumn === "instructor" && (sortOrder === "asc" ? <ChevronUp /> : <ChevronDown />)}
              </TableHead>
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
            ) : filteredClasses.length > 0 ? (
              filteredClasses.map((classItem) => (
                <TableRow key={classItem.pkTrainingLogID}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDate(classItem.dateofclass)}
                    </div>
                  </TableCell>
                  <TableCell>{classItem.company || "N/A"}</TableCell>
                  <TableCell>{classItem.state || "N/A"}</TableCell>
                  <TableCell>{getEducatorName(classItem)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/classes/${classItem.pkTrainingLogID}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No classes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
            </PaginationItem>

            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default Classes