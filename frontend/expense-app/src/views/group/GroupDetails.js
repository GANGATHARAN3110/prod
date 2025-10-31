import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  CCard,
  CCardHeader,
  CNav,
  CNavItem,
  CNavLink,
  CSpinner,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const GroupDetails = () => {
  const { groupId } = useParams()
  const token = localStorage.getItem('token')

  const [group, setGroup] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [chartData, setChartData] = useState({})
  const [activities, setActivities] = useState([])

  // 🟢 Fetch group details
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/group/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setGroup(res.data.group)
        setMembers(res.data.members || [])
      } catch (err) {
        console.error('Error fetching group details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [groupId, token])

  // 🟢 Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/expenses/group/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const exp = res.data.expenses || []
        setExpenses(exp)

        // Prepare chart data
        const expenseByType = {}
        exp.forEach((e) => {
          if (!expenseByType[e.expenseType]) expenseByType[e.expenseType] = 0
          expenseByType[e.expenseType] += parseFloat(e.amount)
        })

        const labels = Object.keys(expenseByType)
        const data = Object.values(expenseByType)

        setChartData({
          labels,
          datasets: [
            {
              label: 'Expenses by Type',
              data,
              backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
              ],
              borderWidth: 1,
            },
          ],
        })
      } catch (err) {
        console.error('Error fetching expenses:', err)
      }
    }
    fetchExpenses()
  }, [groupId, token])

  // 🟢 Fetch activities (Timeline)
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/activities/group/${groupId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        setActivities(res.data.activities || [])
        console.log('✅ Timeline API called for group', groupId)
      } catch (err) {
        console.error('Error fetching activities:', err)
      }
    }

    if (activeTab === 'timeline') fetchActivities()
  }, [activeTab, groupId, token])

  if (loading)
    return (
      <div className="text-center mt-5">
        <CSpinner color="primary" />
      </div>
    )

  if (!group) return <div className="text-center mt-5">Group not found</div>

  return (
    <div className="m-3">
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <strong>{group.groupName}</strong>
            <CNav variant="tabs">
              {['overview', 'timeline'].map((tab) => (
                <CNavItem key={tab}>
                  <CNavLink
                    href="#"
                    active={activeTab === tab}
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveTab(tab)
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </CNavLink>
                </CNavItem>
              ))}
            </CNav>
          </div>
        </CCardHeader>

        <CCardBody>
          {/* 🟢 Overview */}
          {activeTab === 'overview' && chartData.labels && (
            <div className="text-center mt-3">
              <h6>Expense Overview</h6>
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Pie data={chartData} />
              </div>
            </div>
          )}

          {/* 🟢 Expenses */}
          {activeTab === 'expenses' && (
            <div className="mt-3">
              <h6>Expenses List</h6>
              {expenses.length === 0 ? (
                <p>No expenses found.</p>
              ) : (
                <CTable striped hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell>Amount</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {expenses.map((e, i) => (
                      <CTableRow key={i}>
                        <CTableDataCell>
                          {new Date(e.createdAt).toLocaleDateString()}
                        </CTableDataCell>
                        <CTableDataCell>{e.description}</CTableDataCell>
                        <CTableDataCell>{e.expenseType}</CTableDataCell>
                        <CTableDataCell>₹{e.amount}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </div>
          )}

          {/* 🟢 Members */}
          {activeTab === 'members' && (
            <div className="mt-3">
              <h6>Group Members</h6>
              {members.length === 0 ? (
                <p>No members found.</p>
              ) : (
                <ul className="list-group">
                  {members.map((m, i) => (
                    <li key={i} className="list-group-item">
                      {m.firstName} {m.lastName} — <strong>{m.email}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 🟢 Timeline */}
          {activeTab === 'timeline' && (
            <div className="mt-3">
              <h6>Group Activity Timeline</h6>
              {activities.length === 0 ? (
                <p>No activities found.</p>
              ) : (
                <ul className="list-group mt-3">
                  {activities.map((a, i) => (
                    <li key={i} className="list-group-item">
                      <strong>{a.userName}</strong>{' '}
                      <span className="text-muted">({a.type})</span>
                      <br />
                      <small>
                        On {new Date(a.createdAt).toLocaleString()} from {a.ipAddress}
                      </small>

                      <div className="mt-2">
                        {a.tableName === 'expense' && (
                          <span>
                            💰 <strong>{a.userName}</strong> added expense{' '}
                            <strong>{a.details.title}</strong> — ₹
                            {a.details.amount} ({a.details.expenseType})
                          </span>
                        )}

                        {a.tableName === 'settlement' && (
                          <span>
                            🤝 <strong>{a.userName}</strong> recorded settlement:{' '}
                            <strong>{a.details.fromUserName}</strong> →{' '}
                            <strong>{a.details.toUserName}</strong> of ₹{a.details.amount}
                          </span>
                        )}

                        {a.tableName === 'groupList' && (
                          <span>
                            📝 <strong>{a.userName}</strong> updated group details —{' '}
                            <em>{a.details.name}</em>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default GroupDetails
