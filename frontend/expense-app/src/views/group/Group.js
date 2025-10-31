import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSelector } from 'react-redux'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CToast,
  CToastBody,
  CToaster,
  CPagination,
  CPaginationItem,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilTrash,
  cilUser,
  cilDollar,
  cilArrowLeft,
  cilBalanceScale,
} from '@coreui/icons'

const Groups = () => {
  const navigate = useNavigate()
  // keep existing behavior: user is taken from store root as before
  const { user } = useSelector((state) => state)
  const userId = user?.userId

  const [groups, setGroups] = useState([])
  const [visible, setVisible] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupType, setGroupType] = useState('other')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState(null)
  const [touched, setTouched] = useState(false)

  // Settle related states
  const [settleModal, setSettleModal] = useState(false)
  const [currentGroup, setCurrentGroup] = useState(null)
  const [groupPendingSplits, setGroupPendingSplits] = useState([])
  const [settling, setSettling] = useState(false)

  // Last settlement & undo
  const [lastSettlement, setLastSettlement] = useState(null)
  const [loadingLast, setLoadingLast] = useState(false)
  const [undoModalVisible, setUndoModalVisible] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const [settleSuccessModal, setSettleSuccessModal] = useState(false)
  const [settleMessage, setSettleMessage] = useState('')

  const token = localStorage.getItem('token')
  const API_URL = 'http://localhost:5000/api/group'
  const EXPENSE_URL = 'http://localhost:5000/api/expenses/group'
  // keep existing base — we've preserved your original constant name
  const SETTLEUP_BASE = 'http://localhost:5000/api/settleup'

  // ---------- Redirect Helper ----------
  const handleAuthError = (error) => {
    if (error?.response && (error.response.status === 403 || error.response.status === 401)) {
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  // ---------- DATE HELPERS ----------
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    const date = new Date(dateStr)
    // original code increments date by one day — preserved
    date.setDate(date.getDate() + 1)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = (() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  // ---------- TOAST ----------
  const showToast = (message, color = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, color }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  // ---------- FETCH TOTAL EXPENSE ----------
  const fetchTotalExpense = async (groupId) => {
    try {
      const res = await axios.get(`${EXPENSE_URL}/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.data.totalSpent || 0
    } catch (error) {
      handleAuthError(error)
      return 0
    }
  }

  // ---------- FETCH GROUPS ----------
  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, search },
      })
      const groupsData = res.data.groups || []

      const groupsWithExpense = await Promise.all(
        groupsData.map(async (g) => {
          const totalExpense = await fetchTotalExpense(g.groupId)

          try {
            const resExpenses = await axios.get(`${EXPENSE_URL}/${g.groupId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const expenses = resExpenses.data.expenses || []
            const hasPending = expenses.some((exp) =>
              exp.splits?.some((s) => parseFloat(s.balance) > 0),
            )
            return {
              ...g,
              totalExpense,
              canDelete: g.createdBy === user && !hasPending,
            }
          } catch (error) {
            handleAuthError(error)
            return {
              ...g,
              totalExpense,
              canDelete: false,
            }
          }
        }),
      )

      setGroups(groupsWithExpense)
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      handleAuthError(err)
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to fetch groups', 'danger')
    }
  }, [token, page, search, user])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // ---------- SAVE / CREATE GROUP ----------
  const handleSave = async () => {
    setTouched(true)
    if (!groupName.trim()) return
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      showToast('End date cannot be before Start date', 'danger')
      return
    }
    setLoading(true)
    try {
      if (editId) {
        const group = groups.find((g) => g.groupId === editId)
        if (!group || group.createdBy !== user) {
          showToast('Not authorized', 'danger')
          setLoading(false)
          return
        }
        await axios.put(
          `${API_URL}/${editId}`,
          { newName: groupName, newType: groupType, startDate, endDate },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        showToast('Group updated successfully')
      } else {
        await axios.post(
          API_URL,
          { groupName, type: groupType, startDate, endDate },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        showToast('Group created successfully')
      }

      setGroupName('')
      setGroupType('other')
      setStartDate('')
      setEndDate('')
      setVisible(false)
      setEditId(null)
      setTouched(false)
      fetchGroups()
    } catch (err) {
      handleAuthError(err)
      console.error(err)
      const reason =
        err.response?.data?.error || err.response?.data?.message || 'Failed to save group'
      showToast(reason, 'danger')
    } finally {
      setLoading(false)
    }
  }

  // ---------- EDIT ----------
  const handleEdit = (group) => {
    if (group.createdBy !== user) {
      showToast('Not authorized', 'danger')
      return
    }
    setEditId(group.groupId)
    setGroupName(group.groupName)
    setGroupType(group.type)
    setStartDate(group.startDate ? formatDate(group.startDate) : '')
    setEndDate(group.endDate ? formatDate(group.endDate) : '')
    setVisible(true)
    setTouched(false)
  }

  // ---------- DELETE ----------
  const handleDeleteClick = (group) => {
    if (!group.canDelete) return
    setGroupToDelete(group)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    if (!groupToDelete || !groupToDelete.canDelete) return
    try {
      await axios.delete(`${API_URL}/${groupToDelete.groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast(`Deleted "${groupToDelete.groupName}" successfully`)
      setGroups((prev) => prev.filter((g) => g.groupId !== groupToDelete.groupId))
    } catch (err) {
      handleAuthError(err)
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to delete group', 'danger')
    } finally {
      setDeleteModalVisible(false)
      setGroupToDelete(null)
    }
  }

  // ---------- SETTLE UP ----------
  const fetchPendingSplits = async (group) => {
    try {
      const res = await axios.get(`${EXPENSE_URL}/${group.groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const expenses = res.data.expenses || []
      const usersWithBalance = []
      expenses.forEach((exp) => {
        exp.splits?.forEach((s) => {
          if (parseFloat(s.balance) > 0) {
            const existing = usersWithBalance.find((u) => u.userId === s.userId)
            if (!existing) {
              usersWithBalance.push({
                userId: s.userId,
                fullName: s.fullName,
                balance: parseFloat(s.balance),
                settleAmount: 0,
              })
            }
          }
        })
      })
      setGroupPendingSplits(usersWithBalance)
      setCurrentGroup(group)
      setSettleModal(true)
      // clear lastSettlement when opening modal for a different group
      setLastSettlement(null)
    } catch (err) {
      handleAuthError(err)
      showToast('Failed to fetch pending balances', 'danger')
    }
  }

  // ---------- Get last settlement for confirmation ----------
  const fetchLastSettlement = async (groupId) => {
    if (!groupId) return
    setLoadingLast(true)
    try {
      const res = await axios.get(`${SETTLEUP_BASE}/last/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data && res.data.data) {
        setLastSettlement(res.data.data)
      } else {
        setLastSettlement({ type: null, message: 'No settlements found' })
      }
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.error || 'Failed to fetch last settlement', 'danger')
    } finally {
      setLoadingLast(false)
    }
  }

  // ---------- Undo last settlement ----------
  const handleUndoLastSettlement = async () => {
    if (!currentGroup) return
    setUndoing(true)
    try {
      await axios.post(
        `${SETTLEUP_BASE}/undo`,
        { groupId: currentGroup.groupId, undoneBy: user },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast('Undo successful')
      // refresh groups and pending splits
      fetchGroups()
      if (currentGroup) fetchPendingSplits(currentGroup)
      setUndoModalVisible(false)
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.error || 'Failed to undo last settlement', 'danger')
    } finally {
      setUndoing(false)
    }
  }

  // ---------- UI: helpers ----------
  const anySettleSelected = groupPendingSplits.some((u) => u.settleAmount > 0)
  const totalSelectedAmount = groupPendingSplits.reduce(
    (s, u) => s + (parseFloat(u.settleAmount) || 0),
    0,
  )

  return (
    <>
      {/* Toasts */}
      <CToaster className="position-fixed top-0 end-0 p-3">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide delay={3000} color={t.color}>
            <CToastBody>{t.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      {/* Groups Table */}
      <CCard className="m-3 shadow-sm rounded-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <CIcon
              icon={cilArrowLeft}
              size="lg"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(-1)}
            />
            <strong>Groups</strong>
          </div>
          <div className="d-flex gap-2">
            <CFormInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Groups by Name"
              style={{ width: '250px' }}
            />
            <CButton
              color="primary"
              onClick={() => {
                setEditId(null)
                setGroupName('')
                setGroupType('other')
                setStartDate('')
                setEndDate('')
                setVisible(true)
                setTouched(false)
              }}
            >
              Add Group
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <CTable hover bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Start Date</CTableHeaderCell>
                <CTableHeaderCell>End Date</CTableHeaderCell>
                <CTableHeaderCell>Total Expense</CTableHeaderCell>
                <CTableHeaderCell>Created At</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {groups.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center">
                    No groups found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                groups.map((g) => {
                  const isCreator = g.createdBy === user
                  return (
                    <CTableRow key={g.groupId}>
                      <CTableDataCell
                        className="text-primary cursor-pointer"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/groups/${g.groupId}/details`)}
                      >
                        {g.groupName}
                      </CTableDataCell>

                      <CTableDataCell>{g.type}</CTableDataCell>
                      <CTableDataCell>{formatDate(g.startDate)}</CTableDataCell>
                      <CTableDataCell>{formatDate(g.endDate)}</CTableDataCell>
                      <CTableDataCell>₹{g.totalExpense || 0}</CTableDataCell>
                      <CTableDataCell>{formatDate(g.createdAt)}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <div className="d-flex justify-content-center align-items-center">
                          {/* User Icon */}
                          <div style={{ width: 32, textAlign: 'center' }}>
                            <CIcon
                              icon={cilUser}
                              size="lg"
                              style={{ cursor: 'pointer', color: 'blue' }}
                              onClick={() => navigate(`/groups/${g.groupId}/members`)}
                            />
                          </div>
                          {/* <div style={{ width: 32, textAlign: 'center' }}>
                            <CIcon
                              icon={cilUser}
                              size="lg"
                              style={{ cursor: 'pointer', color: 'blue' }}
                              onClick={() => navigate(`/groups/${g.groupId}/details`)}
                            />
                          </div> */}

                          {/* Settle/Dollar Icon */}
                          <div style={{ width: 32, textAlign: 'center' }}>
                            <CIcon
                              icon={cilBalanceScale}
                              size="lg"
                              style={{ cursor: 'pointer', color: 'green' }}
                              onClick={() => fetchPendingSplits(g)}
                            />
                          </div>
                          <div style={{ width: 32, textAlign: 'center' }}>
                            <CIcon
                              icon={cilDollar}
                              size="lg"
                              style={{ cursor: 'pointer', color: 'green' }}
                              onClick={() => navigate(`/groups/${g.groupId}/expenses`)}
                            />
                          </div>

                          {/* Pencil Icon */}
                          <div style={{ width: 32, textAlign: 'center' }}>
                            {isCreator ? (
                              <CIcon
                                icon={cilPencil}
                                size="lg"
                                style={{ cursor: 'pointer', color: 'orange' }}
                                onClick={() => handleEdit(g)}
                              />
                            ) : null}
                          </div>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-3">
            <CPagination aria-label="Pagination">
              <CPaginationItem
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </CPaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <CPaginationItem key={i} active={page === i + 1} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </CPaginationItem>
              ))}
              <CPaginationItem
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </CPaginationItem>
            </CPagination>
          </div>
        </CCardBody>
      </CCard>

      {/* Add/Edit Modal */}
      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>{editId ? 'Edit Group' : 'Add Group'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label className="form-label">Group Name</label>
            <CFormInput
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onFocus={() => setTouched(true)}
              className={touched && !groupName.trim() ? 'border-danger' : ''}
            />
            {touched && !groupName.trim() && (
              <small className="text-danger">Group name is required</small>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Group Type</label>
            <CFormSelect
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              options={[
                { label: 'Trip', value: 'trip' },
                { label: 'Home', value: 'home' },
                { label: 'Office', value: 'office' },
                { label: 'Other', value: 'other' },
              ]}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <CFormInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">End Date</label>
            <CFormInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
              className={
                endDate && startDate && new Date(endDate) < new Date(startDate)
                  ? 'border-danger'
                  : ''
              }
            />
            {endDate && startDate && new Date(endDate) < new Date(startDate) && (
              <small className="text-danger">End date cannot be before Start date</small>
            )}
          </div>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <CTooltip
            content={
              !groups.find((g) => g.groupId === editId)?.canDelete
                ? 'Cannot delete — either pending balances exist or not authorized'
                : 'Delete this group'
            }
          >
            <div>
              <CButton
                color="danger"
                disabled={!groups.find((g) => g.groupId === editId)?.canDelete}
                onClick={() => {
                  const group = groups.find((g) => g.groupId === editId)
                  if (group?.canDelete) handleDeleteClick(group)
                }}
              >
                <CIcon icon={cilTrash} />
              </CButton>
            </div>
          </CTooltip>

          <div className="d-flex gap-2">
            <CButton color="secondary" onClick={() => setVisible(false)}>
              Cancel
            </CButton>
            <CButton color="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </CButton>
          </div>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>Are you sure you want to delete "{groupToDelete?.groupName}"?</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
      {/* =========================
   {/* =========================
     SETTLE UP MODAL
========================= */}
      <CModal visible={settleModal} onClose={() => setSettleModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Settle Up: {currentGroup?.groupName}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {/* Header summary */}
          <div className="mb-3">
            <strong>Pending people:</strong> {groupPendingSplits.length}
          </div>

          {/* Pending Balances Table */}
          {groupPendingSplits.length === 0 ? (
            <p className="text-center">No pending balances to settle!</p>
          ) : (
            <>
              <CTable bordered hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>
                      <input
                        type="checkbox"
                        checked={
                          groupPendingSplits.length > 0 &&
                          groupPendingSplits.every((u) => u.selected)
                        }
                        onChange={(e) => {
                          const checked = e.target.checked
                          setGroupPendingSplits((prev) =>
                            prev.map((u) => ({ ...u, selected: checked })),
                          )
                        }}
                      />{' '}
                      Select All
                    </CTableHeaderCell>
                    <CTableHeaderCell>User</CTableHeaderCell>
                    <CTableHeaderCell>Pending Balance (₹)</CTableHeaderCell>
                    <CTableHeaderCell>Amount to Settle (₹)</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {groupPendingSplits.map((u) => (
                    <CTableRow key={u.userId}>
                      <CTableDataCell>
                        <input
                          type="checkbox"
                          checked={u.selected || false}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setGroupPendingSplits((prev) =>
                              prev.map((x) =>
                                x.userId === u.userId ? { ...x, selected: checked } : x,
                              ),
                            )
                          }}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{u.fullName}</CTableDataCell>
                      <CTableDataCell>{u.balance}</CTableDataCell>
                      <CTableDataCell>
                        <CFormInput
                          type="number"
                          min="0"
                          max={u.balance}
                          disabled={!u.selected}
                          value={u.settleAmount || ''}
                          onChange={(e) => {
                            const value = Math.min(parseFloat(e.target.value) || 0, u.balance)
                            setGroupPendingSplits((prev) =>
                              prev.map((x) =>
                                x.userId === u.userId ? { ...x, settleAmount: value } : x,
                              ),
                            )
                          }}
                          placeholder={`Max ₹${u.balance}`}
                        />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Footer Summary + Settle Button */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <small>
                    Total selected:{' '}
                    <strong>
                      ₹
                      {groupPendingSplits
                        .filter((u) => u.selected && u.settleAmount > 0)
                        .reduce((sum, u) => sum + u.settleAmount, 0)
                        .toFixed(2)}
                    </strong>
                  </small>
                </div>

                <CButton
                  color="primary"
                  disabled={settling || !groupPendingSplits.some((u) => u.selected)}
                  onClick={async () => {
                    // ✅ Validation check
                    const invalidUsers = groupPendingSplits.filter(
                      (u) => u.selected && (!u.settleAmount || u.settleAmount <= 0),
                    )

                    if (invalidUsers.length > 0) {
                      showToast(
                        'Please enter amount for all selected users before settling.',
                        'danger',
                      )
                      return
                    }

                    setSettling(true)
                    try {
                      const settlements = groupPendingSplits
                        .filter((u) => u.selected && u.settleAmount > 0)
                        .map((u) => ({ toUser: u.userId, amount: u.settleAmount }))

                      const { data } = await axios.post(
                        `${SETTLEUP_BASE}/group/${currentGroup.groupId}`,
                        { settledBy: user, partialSettlements: settlements },
                        { headers: { Authorization: `Bearer ${token}` } },
                      )

                      setLastSettlement(data.lastSettlement)
                      showToast('Settlement successful!')

                      // ✅ Show success modal with Undo option
                      setSettleMessage('Settlement completed successfully!')
                      setSettleSuccessModal(true)

                      // ✅ Update UI instantly
                      setGroupPendingSplits((prev) =>
                        prev.map((u) => {
                          const settled = settlements.find((s) => s.toUser === u.userId)
                          return settled
                            ? {
                                ...u,
                                balance: Math.max(u.balance - settled.amount, 0),
                                settleAmount: 0,
                                selected: false,
                              }
                            : u
                        }),
                      )

                      await fetchGroups()
                      await fetchLastSettlement(currentGroup.groupId)
                    } catch (err) {
                      console.error(err)
                      showToast(err.response?.data?.error || 'Failed to settle', 'danger')
                    } finally {
                      setSettling(false)
                    }
                  }}
                >
                  {settling ? 'Settling...' : 'Settle'}
                </CButton>
              </div>
            </>
          )}
        </CModalBody>
      </CModal>

      {/* =========================
     SUCCESS + UNDO MODAL
========================= */}
      <CModal visible={settleSuccessModal} onClose={() => setSettleSuccessModal(false)}>
        <CModalHeader>
          <CModalTitle>Settlement Status</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>{settleMessage}</p>

          {lastSettlement && (
            <div className="mt-2">
              <CButton
                color="danger"
                size="sm"
                disabled={undoing}
                onClick={async () => {
                  if (!currentGroup) return
                  setUndoing(true)
                  try {
                    await handleUndoLastSettlement(currentGroup.groupId)
                    await fetchGroups()
                    await fetchLastSettlement(currentGroup.groupId)
                    showToast('Last settlement has been undone successfully!')
                    setSettleMessage('Last settlement has been undone successfully!')
                  } catch (err) {
                    console.error(err)
                    showToast('Failed to undo settlement', 'danger')
                  } finally {
                    setUndoing(false)
                  }
                }}
              >
                {undoing ? 'Undoing...' : 'Undo Last Settlement'}
              </CButton>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={() => {
              setSettleSuccessModal(false)
              setSettleModal(false)
            }}
          >
            OK
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Groups
