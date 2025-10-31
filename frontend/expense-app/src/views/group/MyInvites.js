import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CToast,
  CToastBody,
  CToaster,
} from '@coreui/react'

const MyInvites = () => {
  const [invites, setInvites] = useState([])
  const [toasts, setToasts] = useState([])

  const token = localStorage.getItem('token')
  const API_URL = 'http://localhost:5000/api/group-members'

  const showToast = (message, color = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, color }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const fetchInvites = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/my-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // 🔹 Filter out invites that are already accepted
      const filteredInvites = (res.data.members || []).filter(
        (invite) => invite.status !== 'accepted',
      )

      setInvites(filteredInvites)
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to fetch invites', 'danger')
    }
  }, [token])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleResponse = async (groupUserId, status) => {
    try {
      await axios.post(
        `${API_URL}/respond`,
        { groupuserId: groupUserId, status },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      showToast(`Invitation ${status} successfully`)
      fetchInvites()
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || `Failed to ${status} invite`, 'danger')
    }
  }

  return (
    <>
      <CToaster position="top-end">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide delay={3000} color={t.color}>
            <CToastBody>{t.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      <CCard className="m-3">
        <CCardHeader>
          <strong>My Group Invitations</strong>
        </CCardHeader>
        <CCardBody>
          <CTable hover bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Group Name</CTableHeaderCell>
                <CTableHeaderCell>Invited By</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {invites.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={3} className="text-center">
                    No invitations found
                  </CTableDataCell>
                </CTableRow>
              ) : (
                invites.map((invite) => (
                  <CTableRow key={invite.groupUserId}>
                    <CTableDataCell>{invite.groupName}</CTableDataCell>
                    <CTableDataCell>
                      {invite.invitedByFirstName || invite.invitedByEmail}
                    </CTableDataCell>
                    <CTableDataCell>
                      {invite.status === 'pending' ? (
                        <>
                          <CButton
                            color="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleResponse(invite.groupUserId, 'accepted')}
                          >
                            Accept
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleResponse(invite.groupUserId, 'rejected')}
                          >
                            Reject
                          </CButton>
                        </>
                      ) : (
                        <span>{invite.status}</span>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default MyInvites
