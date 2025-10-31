import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilAccountLogout } from '@coreui/icons' // 👈 use logout icon
import avatar2 from 'src/assets/images/avatars/2.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleLogoutClick = () => {
    navigate('/logout') // 👈 this will open your LogoutPopup component
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar2} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>

        {/* Profile Option */}
        <CDropdownItem onClick={handleProfileClick}>
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>

        <CDropdownDivider />

        {/* ✅ Logout Option */}
        <CDropdownItem onClick={handleLogoutClick}>
          <CIcon icon={cilAccountLogout} className="me-2 text-danger" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
