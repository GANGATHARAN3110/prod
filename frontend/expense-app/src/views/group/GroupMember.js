import React, { useEffect, useState, useCallback } from 'react'
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
  CButton,
  CFormInput,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CToaster,
  CToast,
  CToastBody,
  CPagination,
  CPaginationItem,
  CNav,
  CNavItem,
  CNavLink,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilTrash } from '@coreui/icons'

const GroupMembers = () => {
  const { id: groupId } = useParams()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [toasts, setToasts] = useState([])
  const [inviteVisible, setInviteVisible] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [currentGroup, setCurrentGroup] = useState(null)

  const token = localStorage.getItem('token')
  const API_URL = 'http://localhost:5000/api/group-members'
  const GROUP_URL = 'http://localhost:5000/api/group'

  // ---------- Toast helper ----------
  const showToast = (message, color = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, color }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  // ---------- Email validation ----------
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // ---------- Fetch group members ----------
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, page },
      })
      setMembers(res.data.members || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to fetch members', 'danger')
    } finally {
      setLoading(false)
    }
  }, [groupId, token, search, page])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // ---------- Fetch group details ----------
  const fetchGroupDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${GROUP_URL}/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCurrentGroup(res.data.group)
    } catch (err) {
      console.error('Error fetching group details:', err)
    }
  }, [groupId, token])

  useEffect(() => {
    fetchGroupDetails()
  }, [fetchGroupDetails])

  // ---------- Remove member ----------
  const handleRemove = async () => {
    if (!memberToDelete) return
    setLoading(true)
    try {
      await axios.delete(`${API_URL}/remove/${memberToDelete.groupUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast('Member removed successfully', 'success')
      setDeleteModalVisible(false)
      setMemberToDelete(null)
      if (members.length === 1 && page > 1) setPage(page - 1)
      else fetchMembers()
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to remove member', 'danger')
      setDeleteModalVisible(false)
    } finally {
      setLoading(false)
    }
  }

  // ---------- Change member role ----------
  const handleRoleChange = async (groupUserId, newRole) => {
    try {
      await axios.put(
        `${API_URL}/update`,
        { groupUserId, role: newRole },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast('Member role updated successfully', 'success')
      fetchMembers()
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to update role', 'danger')
    }
  }

  // ---------- Invite member ----------
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    if (!isValidEmail(inviteEmail.trim())) {
      showToast('Enter a valid email', 'danger')
      return
    }
    setLoading(true)
    try {
      await axios.post(
        `${API_URL}/invite`,
        { groupId, invitedEmail: inviteEmail.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast('Invite sent successfully', 'success')
      setInviteEmail('')
      setInviteVisible(false)
      fetchMembers()
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to send invite', 'danger')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ---------- Toasts ---------- */}
      <CToaster className="position-fixed top-0 end-0 p-3" position="top-end">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide delay={3000} color={t.color}>
            <CToastBody>{t.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      {/* ---------- Card ---------- */}
      <CCard className="m-3 shadow-sm rounded-4">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <CIcon
                icon={cilArrowLeft}
                size="lg"
                style={{ cursor: 'pointer' }}
                title="Back"
                onClick={() => navigate(-1)}
              />
              <strong>{currentGroup ? currentGroup.groupName : 'Loading group...'}</strong>
            </div>

            {/* ✅ Navigation Tabs */}
            <CNav variant="tabs" role="tablist" className="ms-auto">
              <CNavItem>
                <CNavLink active>Members</CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  onClick={() => navigate(`/groups/${groupId}/expenses`)}
                  style={{ cursor: 'pointer' }}
                >
                  Expenses
                </CNavLink>
              </CNavItem>
            </CNav>
          </div>
        </CCardHeader>

        <CCardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <CFormInput
              placeholder="Search Members"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              style={{ width: '250px' }}
            />
            <CButton color="primary" onClick={() => setInviteVisible(true)}>
              Invite Member
            </CButton>
          </div>

          <CTable hover bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Role</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {members.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center">
                    No members found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                members.map((m) => (
                  <CTableRow key={m.groupUserId}>
                    <CTableDataCell>
                      {m.firstName || m.lastName
                        ? `${m.firstName || ''} ${m.lastName || ''}`.trim()
                        : m.username || '-'}
                    </CTableDataCell>
                    <CTableDataCell>{m.email || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {m.isCreator ? (
                        <strong>Creator</strong>
                      ) : (
                        <CFormSelect
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.groupUserId, e.target.value)}
                          disabled={loading || m.isCreator}
                        >
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </CFormSelect>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{m.status}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="danger"
                        size="sm"
                        onClick={() => {
                          setMemberToDelete(m)
                          setDeleteModalVisible(true)
                        }}
                        disabled={loading || m.isCreator}
                        title={m.isCreator ? 'Cannot remove creator' : 'Remove member'}
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
            <CPagination aria-label="Member pagination">
              <CPaginationItem
                disabled={page === 1 || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </CPaginationItem>
              {Array.from({ length: totalPages || 1 }, (_, i) => (
                <CPaginationItem key={i} active={page === i + 1} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </CPaginationItem>
              ))}
              <CPaginationItem
                disabled={page === totalPages || loading}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </CPaginationItem>
            </CPagination>
          </div>
        </CCardBody>
      </CCard>

      {/* ---------- Invite Modal ---------- */}
      <CModal visible={inviteVisible} onClose={() => setInviteVisible(false)}>
        <CModalHeader>
          <CModalTitle>Invite Member</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label htmlFor="inviteEmail" className="form-label">
              User Email
            </label>
            <CFormInput
              id="inviteEmail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={!isValidEmail(inviteEmail) && inviteEmail ? 'border-danger' : ''}
            />
            {!isValidEmail(inviteEmail) && inviteEmail && (
              <small className="text-danger">Enter a valid email</small>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setInviteVisible(false)}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleInvite}
            disabled={!inviteEmail || !isValidEmail(inviteEmail) || loading}
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ---------- Delete Confirmation Modal ---------- */}
      <CModal visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to remove <strong>{memberToDelete?.email}</strong> from the group?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleRemove} disabled={loading}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default GroupMembers
