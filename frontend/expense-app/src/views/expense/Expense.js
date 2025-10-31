import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CToast,
  CToastBody,
  CToaster,
  CPagination,
  CPaginationItem,
  CSpinner,
  CRow,
  CCol,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilUser, cilArrowLeft } from '@coreui/icons'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const Expense = () => {
  const { id: groupId } = useParams()
  const navigate = useNavigate()

  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [toasts, setToasts] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleteExpenseId, setDeleteExpenseId] = useState(null)
  const [deleteExpenseTitle, setDeleteExpenseTitle] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expenseType, setExpenseType] = useState('other')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitType, setSplitType] = useState('equal')
  const [splitDetails, setSplitDetails] = useState({})
  const [loading, setLoading] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(true)
  const [touched, setTouched] = useState(false)
  const [chartData, setChartData] = useState({})
  const [expenseDate, setExpenseDate] = useState('')

  const token = localStorage.getItem('token')
  const API_URL = 'http://localhost:5000/api/expenses'
  const MEMBERS_API = 'http://localhost:5000/api/group-members'

  // ---------------- Toast ----------------
  const showToast = (message, color = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, color }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  // ---------------- Debounce ----------------
  const searchTimeout = useRef(null)
  const pageTimeout = useRef(null)

  // ---------------- Fetch Expenses & Members ----------------
  const fetchExpenses = useCallback(
    async (pg = page, searchQuery = search) => {
      if (!groupId) return
      setFetching(true)
      try {
        const [expRes, memRes] = await Promise.all([
          axios.get(`${API_URL}/group/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: pg, limit: 5, search: searchQuery || undefined, t: Date.now() },
          }),
          axios.get(`${MEMBERS_API}/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setExpenses(expRes.data.expenses || [])
        setMembers(memRes.data.members || [])
        setPage(expRes.data.page || 1)
        setTotalPages(expRes.data.totalPages || 1)
      } catch (err) {
        console.error(err)
        showToast('Failed to fetch expenses or members', 'danger')
      } finally {
        setFetching(false)
      }
    },
    [groupId, token],
  )

  useEffect(() => {
    fetchExpenses(1)
  }, [fetchExpenses])

  // ---------------- Initialize Split Details ----------------
  useEffect(() => {
    if (members.length === 0) return

    if (!paidBy) {
      const creator = members.find((m) => m.isCreator)
      if (creator) setPaidBy(creator.userId)
    }

    const splits = {}
    if (splitType === 'equal') {
      const equalAmount = amount ? parseFloat(amount) / members.length : 0
      members.forEach((m) => (splits[m.userId] = parseFloat(equalAmount.toFixed(2))))
    } else if (splitType === 'percentage') {
      const percent = parseFloat((100 / members.length).toFixed(2))
      members.forEach((m) => (splits[m.userId] = percent))
    } else if (splitType === 'share') {
      members.forEach((m) => (splits[m.userId] = splitDetails[m.userId] || null))
    } else {
      members.forEach((m) => (splits[m.userId] = 0))
    }
    setSplitDetails(splits)
  }, [members, splitType, amount])

  // ---------------- Form Validation ----------------
  const isValidForm = () => {
    if (!title.trim()) return false
    if (!amount || parseFloat(amount) <= 0) return false
    if (!paidBy) return false
    if (!expenseDate) return false
    if (splitType === 'exact') {
      const total = Object.values(splitDetails).reduce((sum, v) => sum + (v || 0), 0)
      if (total.toFixed(2) !== parseFloat(amount).toFixed(2)) return false
    }
    if (splitType === 'percentage') {
      const totalPercent = Object.values(splitDetails).reduce((sum, v) => sum + (v || 0), 0)
      if (Math.round(totalPercent) !== 100) return false
    }
    if (splitType === 'share') {
      const totalShare = Object.values(splitDetails).reduce((sum, v) => sum + (v || 0), 0)
      if (totalShare <= 0) return false
    }
    return true
  }

  // ---------------- Save / Update Expense ----------------
  const handleSave = async () => {
    setTouched(true)
    if (!isValidForm()) return showToast('Please fill all fields correctly', 'warning')

    const splitDetailsArray = members.map((m) => {
      const val = splitDetails[m.userId] || 0
      if (splitType === 'exact') return { userId: m.userId, amount: val }
      if (splitType === 'percentage') return { userId: m.userId, percentage: val }
      if (splitType === 'share') return { userId: m.userId, share: val }
      return { userId: m.userId }
    })

    const expenseData = {
      groupId,
      title,
      description,
      expenseType,
      amount: parseFloat(amount),
      paidBy,
      splitType,
      splitDetails: splitDetailsArray,
      expenseDate,
    }

    setLoading(true)
    try {
      if (editExpense) {
        await axios.put(`${API_URL}/${editExpense.expenseId}`, expenseData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        showToast('Expense updated successfully')
      } else {
        await axios.post(API_URL, expenseData, { headers: { Authorization: `Bearer ${token}` } })
        showToast('Expense added successfully')
      }
      setModalVisible(false)
      resetForm()
      fetchExpenses(1)
    } catch (err) {
      console.error('Error while saving expense:', err)

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save expense. Please check your inputs.'

      // Show toast with the reason
      showToast(backendMessage, 'danger')

      // Optionally, keep the modal open to let the user fix it
      setModalVisible(true)
    }
  }

  const resetForm = () => {
    setEditExpense(null)
    setTitle('')
    setDescription('')
    setExpenseType('other')
    setAmount('')
    setPaidBy('')
    setSplitType('equal')
    setSplitDetails({})
    setExpenseDate('')
    setTouched(false)
  }
  const handleEdit = (exp) => {
    setEditExpense(exp)
    setTitle(exp.title)
    setDescription(exp.description || '')
    setExpenseType(exp.expenseType || 'other')
    setAmount(exp.amount)
    setPaidBy(exp.paidBy)
    setSplitType(exp.splitType)
    setExpenseDate(exp.expenseDate ? exp.expenseDate.split('T')[0] : '')

    // Pre-fill splits based on split type
    const splitsMap = {}
    if (exp.splits?.length) {
      exp.splits.forEach((s) => {
        switch (exp.splitType) {
          case 'percentage':
            splitsMap[s.userId] = s.percentage || 0
            break
          case 'share':
            splitsMap[s.userId] = s.splitValue || 0
            break
          default:
            splitsMap[s.userId] = s.amount || 0
        }
      })
    }
    setSplitDetails(splitsMap)

    setModalVisible(true)
    setTouched(false)
  }

  const handleDelete = (expenseId, title) => {
    setDeleteExpenseId(expenseId)
    setDeleteExpenseTitle(title)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    if (!deleteExpenseId) return
    try {
      await axios.delete(`${API_URL}/${deleteExpenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast('Expense deleted successfully')
      fetchExpenses(1)
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to delete expense', 'danger')
    } finally {
      setDeleteModalVisible(false)
      setDeleteExpenseId(null)
      setDeleteExpenseTitle('')
    }
  }

  // ---------------- Pie Chart Data ----------------
  useEffect(() => {
    const expenseByType = {}
    expenses.forEach((exp) => {
      if (!expenseByType[exp.expenseType]) expenseByType[exp.expenseType] = 0
      expenseByType[exp.expenseType] += parseFloat(exp.amount)
    })
    const labels = Object.keys(expenseByType)
    const data = Object.values(expenseByType)
    setChartData({
      labels,
      datasets: [
        {
          label: 'Expenses by Type',
          data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          borderWidth: 1,
        },
      ],
    })
  }, [expenses])

  // ---------------- Debounced Search ----------------
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchExpenses(1, search)
    }, 500)
  }, [search])

  // ---------------- Debounced Pagination ----------------
  useEffect(() => {
    clearTimeout(pageTimeout.current)
    pageTimeout.current = setTimeout(() => {
      fetchExpenses(page, search)
    }, 300)
  }, [page])

  if (fetching)
    return (
      <div className="text-center pt-5">
        <CSpinner color="primary" variant="grow" />
      </div>
    )

  return (
    <>
      {/* Toasts */}
      <CToaster
        position="top-end"
        className="p-3 d-flex flex-column gap-2"
        style={{ top: '1rem', right: '1rem', zIndex: 9999 }}
      >
        {toasts.map((t) => (
          <CToast
            key={t.id}
            visible
            autohide
            delay={3000}
            color={t.color}
            className="fade-in-right"
          >
            <CToastBody>{t.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      {/* Expense Table */}
      <CCard className="m-3 shadow-sm rounded-4">
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <CIcon
              icon={cilArrowLeft}
              size="lg"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(-1)}
            />
            <strong className="fs-5">Group Expenses</strong>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <CFormInput
              placeholder="Search Expenses"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{ width: '250px' }}
            />
            <CButton
              color="primary"
              onClick={() => {
                resetForm()
                setModalVisible(true)
              }}
            >
              Add Expense
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <CTable hover bordered responsive>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Title</CTableHeaderCell>
                <CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Description</CTableHeaderCell>
                <CTableHeaderCell>Expense Date</CTableHeaderCell>
                <CTableHeaderCell>Split Type</CTableHeaderCell>
                <CTableHeaderCell>Amount</CTableHeaderCell>
                <CTableHeaderCell>Paid By</CTableHeaderCell>
                <CTableHeaderCell>Created At</CTableHeaderCell>
                <CTableHeaderCell style={{ width: '160px' }}>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {expenses.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center">
                    No expenses found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                expenses.map((exp) => (
                  <CTableRow key={exp.expenseId}>
                    <CTableDataCell>{exp.title}</CTableDataCell>
                    <CTableDataCell>{exp.expenseType}</CTableDataCell>
                    <CTableDataCell>{exp.description || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : '-'}
                    </CTableDataCell>
                    <CTableDataCell>{exp.splitType}</CTableDataCell>
                    <CTableDataCell>₹{parseFloat(exp.amount).toFixed(2)}</CTableDataCell>
                    <CTableDataCell>{exp.paidByName}</CTableDataCell>
                    <CTableDataCell>{new Date(exp.createdAt).toLocaleString()}</CTableDataCell>
                    <CTableDataCell className="d-flex justify-content-center gap-2">
                      <CButton
                        color="secondary"
                        size="sm"
                        title="View Details"
                        onClick={() => navigate(`/expenses/${exp.expenseId}/details`)}
                      >
                        <CIcon icon={cilUser} />
                      </CButton>
                      <CButton
                        color="info"
                        size="sm"
                        title="Edit Expense"
                        onClick={() => handleEdit(exp)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        size="sm"
                        title="Delete Expense"
                        onClick={() => handleDelete(exp.expenseId, exp.title)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-3">
            <CPagination aria-label="Expense pagination">
              <CPaginationItem disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </CPaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <CPaginationItem key={i} active={page === i + 1} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </CPaginationItem>
              ))}
              <CPaginationItem disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </CPaginationItem>
            </CPagination>
          </div>
        </CCardBody>
      </CCard>

      {/* Pie Chart */}
      {expenses.length > 0 && chartData.labels && (
        <CCard className="m-3 shadow-sm rounded-4">
          <CCardHeader>
            <strong className="fs-5">Expense Distribution</strong>
          </CCardHeader>
          <CCardBody>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Pie data={chartData} />
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Add/Edit Modal */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>{editExpense ? 'Edit Expense' : 'Add Expense'}</CModalTitle>
        </CModalHeader>

        <CModalBody style={{ paddingBottom: '2rem' }}>
          {/* Title & Description */}
          <CRow className="mb-3">
            <CCol md={6}>
              <label className="form-label">
                Title <span className="text-danger">*</span>
              </label>
              <CFormInput
                placeholder="Expense Title (e.g. Dinner at KFC)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ borderColor: touched && !title.trim() ? 'red' : '' }}
              />
              {touched && !title.trim() && (
                <div className="text-danger mt-1">Title is required</div>
              )}
            </CCol>

            <CCol md={6}>
              <label className="form-label">Description</label>
              <CFormInput
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </CCol>
          </CRow>

          {/* Expense Type & Amount */}
          <CRow className="mb-3">
            <CCol md={6}>
              <label className="form-label">Expense Type</label>
              <CFormSelect
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                style={{ borderColor: touched && !expenseType.trim() ? 'red' : '', zIndex: 1050 }}
              >
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="shopping">Shopping</option>
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </CFormSelect>
              {touched && !expenseType.trim() && (
                <div className="text-danger mt-1">Expense type is required</div>
              )}
            </CCol>

            <CCol md={6}>
              <label className="form-label">
                expense date <span className="text-danger">*</span>
              </label>
              <CFormInput
                type="date"
                placeholder="Expense Date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                style={{
                  borderColor: touched && !expenseDate ? 'red' : '',
                }}
              />
              {touched && !expenseDate && (
                <div className="text-danger mt-1">Expense date is required</div>
              )}
            </CCol>

            <CCol md={6}>
              <label className="form-label">
                Amount <span className="text-danger">*</span>
              </label>
              <CFormInput
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  borderColor: touched && (!amount || parseFloat(amount) <= 0) ? 'red' : '',
                }}
              />
              {touched && (!amount || parseFloat(amount) <= 0) && (
                <div className="text-danger mt-1">Enter a valid amount</div>
              )}
            </CCol>
          </CRow>

          {/* Paid By & Split Type */}
          <CRow className="mb-3">
            <CCol md={6}>
              <label className="form-label">
                Paid By <span className="text-danger">*</span>
              </label>
              <CFormSelect
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                style={{ borderColor: touched && !paidBy ? 'red' : '', zIndex: 1050 }}
              >
                <option value="">Select Member</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.username}
                  </option>
                ))}
              </CFormSelect>
              {touched && !paidBy && <div className="text-danger mt-1">Please select who paid</div>}
            </CCol>

            <CCol md={6}>
              <label className="form-label">Split Type</label>
              <CFormSelect
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                style={{ width: '100%', zIndex: 1050 }}
              >
                <option value="equal">Equal</option>
                <option value="exact">Exact</option>
                <option value="percentage">Percentage</option>
                <option value="share">Share</option>
              </CFormSelect>
            </CCol>
          </CRow>

          {/* Splits Table */}
          {members.length > 0 && (
            <div className="table-responsive" style={{ position: 'relative', zIndex: 1 }}>
              <table className="table table-bordered mb-2">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>
                      {splitType === 'percentage'
                        ? 'Percentage (%)'
                        : splitType === 'share'
                          ? 'Share'
                          : 'Amount'}
                      <span className="text-danger">*</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.userId}>
                      <td>{m.username}</td>
                      <td>
                        <CFormInput
                          type="number"
                          placeholder={
                            splitType === 'percentage'
                              ? '%'
                              : splitType === 'share'
                                ? 'Share'
                                : 'Amount'
                          }
                          value={splitDetails[m.userId] || ''}
                          onChange={(e) =>
                            setSplitDetails({
                              ...splitDetails,
                              [m.userId]: parseFloat(e.target.value) || 0,
                            })
                          }
                          style={{
                            borderColor:
                              touched && (!splitDetails[m.userId] || splitDetails[m.userId] <= 0)
                                ? 'red'
                                : '',
                            width: '100%',
                          }}
                        />
                        {touched && (!splitDetails[m.userId] || splitDetails[m.userId] <= 0) && (
                          <div className="text-danger mt-1">Value is required</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={() => {
              setTouched(true)
              handleSave()
            }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        color="danger"
        size="sm"
      >
        <CModalHeader>
          <CModalTitle>Delete Expense</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete <strong>{deleteExpenseTitle}</strong>?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Expense
