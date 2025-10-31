import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CToaster,
  CToast,
  CToastBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormSelect,
  CFormInput,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ExpenseUser = () => {
  const { id: expenseId } = useParams()
  const navigate = useNavigate()
  const [expense, setExpense] = useState(null)
  const [toasts, setToasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [settleModal, setSettleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [settleAmount, setSettleAmount] = useState('')
  const [settling, setSettling] = useState(false)

  const token = localStorage.getItem('token')
  const API_URL = `http://localhost:5000/api/expenses/${expenseId}`

  // Toast helper
  const showToast = (message, color = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, color }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  // Fetch expense details
  const fetchExpense = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setExpense(res.data)
    } catch (err) {
      console.error(err)
      showToast('Failed to fetch expense details', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpense()
  }, [expenseId])

  // Handle partial settlement
  const handlePartialSettle = async () => {
    if (!selectedUser || !settleAmount) return
    setSettling(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/settleup',
        {
          groupId: expense.groupId,
          toUser: selectedUser,
          fromUser: expense.paidBy, // creditor
          amount: parseFloat(settleAmount),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast(res.data.message)
      fetchExpense() // refresh
      setSettleModal(false)
      setSelectedUser('')
      setSettleAmount('')
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.error || 'Failed to settle', 'danger')
    } finally {
      setSettling(false)
    }
  }

  // Handle full settlement
  const handleSettleAll = async () => {
    setSettling(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/settleup',
        {
          groupId: expense.groupId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast(res.data.message)
      fetchExpense()
      setSettleModal(false)
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.error || 'Failed to settle', 'danger')
    } finally {
      setSettling(false)
    }
  }

  if (loading)
    return (
      <div className="text-center pt-5">
        <CSpinner color="primary" variant="grow" />
      </div>
    )

  if (!expense)
    return (
      <div className="text-center mt-5">
        <p>Expense not found</p>
      </div>
    )

  const { description, amount, paidByName, splitType, splits } = expense

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560']
  const chartData =
    splits?.map((s) => ({
      name: s.fullName,
      value: splitType === 'share' ? parseFloat(s.splitValue || 0) : parseFloat(s.percentage || 0),
    })) || []

  const owesSummary = splits
    ?.filter((s) => s.balance > 0)
    .map((s) => `${s.fullName} owes ₹${s.balance?.toFixed(2)} to ${paidByName}`)
    .join(', ')

  return (
    <>
      {/* Toasts */}
      <CToaster position="top-end">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide delay={3000} color={t.color}>
            <CToastBody>{t.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      {/* Expense Card */}
      <CCard className="m-3 shadow-sm">
        <CCardHeader className="d-flex align-items-center gap-2">
          <CIcon
            icon={cilArrowLeft}
            size="lg"
            style={{ cursor: 'pointer' }}
            title="Back"
            onClick={() => navigate(-1)}
          />
          <strong>Expense Details</strong>
        </CCardHeader>

        <CCardBody>
          {/* Info + Chart */}
          <div className="d-flex justify-content-between flex-wrap align-items-start">
            <div className="flex-grow-1 me-4">
              <p>
                <strong>Description:</strong> {description || '-'}
              </p>
              <p>
                <strong>Total Amount:</strong> ₹{Number(amount).toFixed(2)}
              </p>
              <p>
                <strong>Paid By:</strong> {paidByName}
              </p>
              <p>
                <strong>Split Type:</strong> {splitType}
              </p>
              {owesSummary && <p className="mt-3 fw-bold text-danger">{owesSummary}</p>}

              {/* Settle Up Button */}
              <CButton color="primary" className="mt-3" onClick={() => setSettleModal(true)}>
                Settle Up
              </CButton>
            </div>

            {/* Pie Chart */}
            {splits && splits.length > 0 && (
              <div style={{ width: '350px', height: '250px' }}>
                <h6 className="text-center mb-2 fw-semibold">
                  Expense Split {splitType === 'share' ? '(Share)' : '(%)'}
                </h6>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}${splitType === 'share' ? '' : '%'}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Splits Table */}
          <CTable hover bordered className="mt-4">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Member</CTableHeaderCell>
                <CTableHeaderCell>Amount (₹)</CTableHeaderCell>
                <CTableHeaderCell>Balance (₹)</CTableHeaderCell>
                <CTableHeaderCell>
                  {splitType === 'share' ? 'Share' : 'Percentage (%)'}
                </CTableHeaderCell>
                <CTableHeaderCell>Owes To</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {splits && splits.length > 0 ? (
                splits.map((s) => {
                  const owesMoney = s.balance > 0
                  return (
                    <CTableRow
                      key={s.userId}
                      style={{ backgroundColor: owesMoney ? '#fff0f0' : '#e0ffe0' }}
                    >
                      <CTableDataCell>{s.fullName}</CTableDataCell>
                      <CTableDataCell>₹{s.amount?.toFixed(2) || '0.00'}</CTableDataCell>
                      <CTableDataCell>₹{s.balance?.toFixed(2) || '0.00'}</CTableDataCell>
                      <CTableDataCell>
                        {splitType === 'share' ? s.splitValue : Math.round(s.percentage) || 0}
                        {splitType !== 'share' && '%'}
                      </CTableDataCell>
                      <CTableDataCell>{owesMoney ? paidByName : '-'}</CTableDataCell>
                    </CTableRow>
                  )
                })
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan="5" className="text-center">
                    No members found
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Settle Modal */}
      <CModal visible={settleModal} onClose={() => setSettleModal(false)}>
        <CModalHeader>
          <CModalTitle>Settle Up</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            <strong>Full Settlement:</strong> Settle all pending balances in this expense.
          </p>
          <CButton color="success" className="mb-3" disabled={settling} onClick={handleSettleAll}>
            {settling ? 'Settling...' : 'Settle All'}
          </CButton>

          <hr />

          <p>
            <strong>Partial Settlement:</strong> Select member and amount to settle.
          </p>
          <CFormSelect
            className="mb-2"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select Member</option>
            {splits
              ?.filter((s) => s.balance > 0)
              .map((s) => (
                <option key={s.userId} value={s.userId}>
                  {s.fullName} (₹{s.balance.toFixed(2)})
                </option>
              ))}
          </CFormSelect>

          <CFormInput
            type="number"
            placeholder="Amount"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            min="0.01"
            max={splits.find((s) => s.userId === selectedUser)?.balance || undefined}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setSettleModal(false)}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            disabled={!selectedUser || !settleAmount || settling}
            onClick={handlePartialSettle}
          >
            {settling ? 'Settling...' : 'Settle'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default ExpenseUser
