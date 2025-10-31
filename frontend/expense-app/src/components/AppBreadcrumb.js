import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import routes from '../routes'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.pathname.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)

      if (routeName) {
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length,
        })
      }

      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(location)

  const handleNav = (path) => {
    navigate(path)
  }

  return (
    <div className="d-flex align-items-center px-3 py-2 bg-white rounded shadow-sm mb-3">
      <CBreadcrumb className="my-0">
        <CBreadcrumbItem
          active={breadcrumbs.length === 0}
          style={{
            cursor: 'pointer',
            color: breadcrumbs.length === 0 ? '#0d6efd' : '#6c757d',
            fontWeight: breadcrumbs.length === 0 ? '600' : '500',
            transition: 'color 0.2s ease',
          }}
          onClick={() => handleNav('/dashboard')}
          onMouseEnter={(e) => (e.target.style.color = '#0d6efd')}
          onMouseLeave={(e) =>
            (e.target.style.color = breadcrumbs.length === 0 ? '#0d6efd' : '#6c757d')
          }
        >
          Home
        </CBreadcrumbItem>

        {breadcrumbs.map((breadcrumb, index) => (
          <CBreadcrumbItem
            key={index}
            active={breadcrumb.active}
            style={{
              cursor: breadcrumb.active ? 'default' : 'pointer',
              color: breadcrumb.active ? '#0d6efd' : '#6c757d',
              fontWeight: breadcrumb.active ? '600' : '500',
              transition: 'color 0.2s ease',
            }}
            onClick={() => !breadcrumb.active && handleNav(breadcrumb.pathname)}
            onMouseEnter={(e) => !breadcrumb.active && (e.target.style.color = '#0d6efd')}
            onMouseLeave={(e) => !breadcrumb.active && (e.target.style.color = '#6c757d')}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        ))}
      </CBreadcrumb>
    </div>
  )
}

export default React.memo(AppBreadcrumb)
