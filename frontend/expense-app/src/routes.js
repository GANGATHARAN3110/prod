import React from 'react'

// Dashboard & Theme
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))

// Base
const Accordion = React.lazy(() => import('./views/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

// Forms
const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

// Charts & Widgets
const Charts = React.lazy(() => import('./views/charts/Charts'))
const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

// Expense Tracker
const Groups = React.lazy(() => import('./views/group/group'))
const Login = React.lazy(() => import('./views/pages/login/Login'))
const GroupMembers = React.lazy(() => import('./views/group/GroupMember'))
const myInvites = React.lazy(() => import('./views/group/MyInvites'))
const expense = React.lazy(() => import('./views/expense/Expense'))
const ExpenseUser = React.lazy(() => import('./views/expense/ExpenseUser'))
const Profile = React.lazy(() => import('./views/profile/Profile'))
const GroupDetails = React.lazy(() => import('./views/group/GroupDetails'))
const Activities = React.lazy(() => import('./views/group/Activities'))

const routes = [
  // Public Routes
  { path: '/login', name: 'Login', element: Login, public: true },

  // Protected Routes
  { path: '/', exact: true, name: 'Home', protected: true },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard, protected: true },
  { path: '/groups', name: 'Groups', element: Groups, protected: true },
  { path: '/groups/:id/members', name: 'Group Members', element: GroupMembers, protected: true },
  { path: '/my-invites', name: 'My Invites', element: myInvites, protected: true },
  { path: '/groups/:id/expenses', name: 'Group Expenses', element: expense, protected: true },
  { path: '/expenses/:id/details', name: 'Expense Details', element: ExpenseUser, protected: true },
  { path: '/profile', name: 'Profile', element: Profile, protected: true },
  { path: '/groups/:groupId/details', name: 'Group Details', element: GroupDetails },
  { path: '/groups/:groupId/activities', name: 'Activities', element: Activities, protected: true },

  { path: '/theme', name: 'Theme', element: Colors, exact: true, protected: true },
  { path: '/theme/colors', name: 'Colors', element: Colors, protected: true },
  { path: '/theme/typography', name: 'Typography', element: Typography, protected: true },

  { path: '/base', name: 'Base', element: Cards, exact: true, protected: true },
  { path: '/base/accordion', name: 'Accordion', element: Accordion, protected: true },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs, protected: true },
  { path: '/base/cards', name: 'Cards', element: Cards, protected: true },
  { path: '/base/carousels', name: 'Carousel', element: Carousels, protected: true },
  { path: '/base/collapses', name: 'Collapse', element: Collapses, protected: true },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups, protected: true },
  { path: '/base/navs', name: 'Navs', element: Navs, protected: true },
  { path: '/base/paginations', name: 'Paginations', element: Paginations, protected: true },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders, protected: true },
  { path: '/base/popovers', name: 'Popovers', element: Popovers, protected: true },
  { path: '/base/progress', name: 'Progress', element: Progress, protected: true },
  { path: '/base/spinners', name: 'Spinners', element: Spinners, protected: true },
  { path: '/base/tabs', name: 'Tabs', element: Tabs, protected: true },
  { path: '/base/tables', name: 'Tables', element: Tables, protected: true },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips, protected: true },

  { path: '/buttons', name: 'Buttons', element: Buttons, exact: true, protected: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons, protected: true },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns, protected: true },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups, protected: true },

  { path: '/charts', name: 'Charts', element: Charts, protected: true },

  { path: '/forms', name: 'Forms', element: FormControl, exact: true, protected: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl, protected: true },
  { path: '/forms/select', name: 'Select', element: Select, protected: true },
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: ChecksRadios, protected: true },
  { path: '/forms/range', name: 'Range', element: Range, protected: true },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup, protected: true },
  {
    path: '/forms/floating-labels',
    name: 'Floating Labels',
    element: FloatingLabels,
    protected: true,
  },
  { path: '/forms/layout', name: 'Layout', element: Layout, protected: true },
  { path: '/forms/validation', name: 'Validation', element: Validation, protected: true },

  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons, protected: true },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons, protected: true },
  { path: '/icons/flags', name: 'Flags', element: Flags, protected: true },
  { path: '/icons/brands', name: 'Brands', element: Brands, protected: true },

  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true, protected: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts, protected: true },
  { path: '/notifications/badges', name: 'Badges', element: Badges, protected: true },
  { path: '/notifications/modals', name: 'Modals', element: Modals, protected: true },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts, protected: true },

  { path: '/widgets', name: 'Widgets', element: Widgets, protected: true },
]

export default routes
