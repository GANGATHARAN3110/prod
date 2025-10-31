import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { CSpinner, CCard, CCardBody } from '@coreui/react'
import { useParams } from 'react-router-dom'

const Timeline = () => {
  const { groupId } = useParams()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  // 🟢 Check rendering
  console.log('✅ Hello World — Timeline component rendered')
  console.log('✅ Group ID:', groupId)

  useEffect(() => {
    const fetchActivities = async () => {
      console.log('📡 Fetching activities for group:', groupId)
      try {
        const res = await axios.get(`http://localhost:5000/api/activities/group/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log('✅ API Response:', res.data)
        setActivities(res.data.activities || [])
      } catch (err) {
        console.error('❌ Error fetching activities:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [groupId, token])

  if (loading) {
    return (
      <div className="text-center mt-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <CCard className="mt-3">
        <CCardBody>
          <h6>Hello World (No activities yet)</h6>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CCard className="mt-3">
      <CCardBody>
        <h6>Hello World — Group Activity Timeline</h6>
        <ul className="timeline list-unstyled mt-3">
          {activities.map((a, index) => (
            <li key={a.activityId || index} className="mb-3">
              <div>
                <strong>
                  {a.firstName} {a.lastName}
                </strong>{' '}
                {a.type} the group
                <br />
                <small className="text-muted">{new Date(a.createdAt).toLocaleString()}</small>
              </div>
              {a.type === 'updated' && (
                <div className="mt-1">
                  <small>Old Start: {new Date(a.oldJson.startDate).toLocaleDateString()}</small> →{' '}
                  <small>New Start: {new Date(a.newJson.startDate).toLocaleDateString()}</small>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CCardBody>
    </CCard>
  )
}

export default Timeline
