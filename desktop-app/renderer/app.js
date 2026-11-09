const app = document.getElementById('app')
const BASE_URL = 'http://localhost:8000'

const demoRestaurant = {
  name: 'Harbor & Hearth Bistro',
  summary: 'Fresh, vibrant, fast-service restaurant operations',
  menu: [
    { name: 'Truffle Pasta', category: 'Main', price: 24.5 },
    { name: 'Grilled Salmon Bowl', category: 'Healthy', price: 22.0 },
    { name: 'Classic Burger', category: 'Burger', price: 18.5 },
    { name: 'Crispy Calamari', category: 'Starters', price: 14.0 },
    { name: 'Avocado Toast', category: 'Breakfast', price: 12.0 },
    { name: 'Berry Cheesecake', category: 'Dessert', price: 9.75 },
  ],
  tables: 12,
  activeOrders: 7,
  kitchenQueue: 5,
  revenue: '$14,280',
  view: 'Today',
}

const state = {
  licenseKey: '',
  validationState: 'initial',
  isUnlocked: false,
  expiresAt: null,
  remainingSeconds: 0,
  validationResult: null,
  lockMessage: '',
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizedLicenseKey() {
  return state.licenseKey.trim()
}

function getSelectedOS() {
  return window.restaurantDemoAPI.platform === 'win32' ? 'windows' : 'linux'
}

async function validateLicense() {
  const key = sanitizedLicenseKey()
  if (!key) {
    state.validationState = 'initial'
    render()
    return { valid: false }
  }

  try {
    const result = await window.restaurantDemoAPI.validateLicense({
      licenseKey: key,
      os: getSelectedOS(),
      baseUrl: BASE_URL,
    })

    const payload = result?.data || {}
    const isValid = payload?.valid === true

    if (result.status >= 500 || (!payload && !result)) {
      state.validationState = 'error'
      state.lockMessage = 'License server unavailable. Access is temporarily denied under the short validation policy.'
      state.isUnlocked = false
      render()
      return { valid: false }
    }

    state.validationState = isValid ? 'success' : 'error'
    state.isUnlocked = isValid
    state.validationResult = payload
    state.expiresAt = payload.expires_at || null
    state.remainingSeconds = Number(payload.remaining_seconds || 0)
    if (!isValid) {
      state.lockMessage = payload.message || 'Your demo subscription has expired. Please contact the administrator to renew your subscription.'
    }
    render()
    return payload
  } catch (error) {
    state.validationState = 'error'
    state.isUnlocked = false
    state.lockMessage = 'Unable to reach the licensing server. Access is blocked.'
    render()
    return { valid: false }
  }
}

function renderActivation() {
  app.innerHTML = `
    <div class="app-shell">
      <div class="panel">
        <div class="topbar">
          <div class="brand">RestaurantSoftware</div>
          <div class="status-pill">Demo License</div>
        </div>
        <div class="content activation-screen">
          <div class="activation-card">
            <div class="eyebrow">Licensed desktop application</div>
            <h1>Activate your demo</h1>
            <p class="subtitle">Enter the license key from your SaaS subscription to unlock the restaurant dashboard.</p>
            <div class="form-row">
              <input id="license-field" type="text" value="${escapeHtml(state.licenseKey)}" placeholder="Enter license key" />
              <button id="activate-btn" class="primary-btn">Validate license</button>
            </div>
            <div class="notice">Server status: ${BASE_URL} • Validation checks every 20 seconds</div>
            ${state.validationState === 'error' ? `<div class="error">${escapeHtml(state.lockMessage || 'License validation failed.')}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `

  const input = document.getElementById('license-field')
  const button = document.getElementById('activate-btn')
  input.addEventListener('input', (event) => {
    state.licenseKey = event.target.value
  })
  button.addEventListener('click', async () => {
    await validateLicense()
  })
}

function renderLockScreen() {
  app.innerHTML = `
    <div class="app-shell">
      <div class="panel">
        <div class="topbar">
          <div class="brand">RestaurantSoftware</div>
          <div class="status-pill">Locked</div>
        </div>
        <div class="content lock-screen">
          <div class="lock-card">
            <div class="eyebrow">Access restricted</div>
            <h2>Your demo subscription has expired.</h2>
            <div class="lock-message">${escapeHtml(state.lockMessage || 'Please contact the administrator to renew your subscription.')}</div>
            <div class="renewal-note">Renew Subscription</div>
            <div class="form-row" style="margin-top: 18px;">
              <button class="secondary-btn" id="retry-license-btn">Re-check license</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  document.getElementById('retry-license-btn').addEventListener('click', async () => {
    await validateLicense()
  })
}

function renderDashboard() {
  const menuHTML = demoRestaurant.menu.map((item) => `
    <li class="menu-item">
      <div class="menu-head">
        <strong>${item.name}</strong>
        <span>$${item.price.toFixed(2)}</span>
      </div>
      <div class="chip" style="margin-top: 8px;">${item.category}</div>
    </li>
  `).join('')

  const orderRows = [
    { id: 'A104', table: 5, customer: 'Jenna', status: 'Pending', total: '$48.00' },
    { id: 'A105', table: 2, customer: 'Alex', status: 'Ready', total: '$34.50' },
    { id: 'A106', table: 8, customer: 'Nina', status: 'Active', total: '$67.00' },
  ]

  const kitchenRows = [
    { item: 'Truffle Pasta', table: 5, eta: '4 min' },
    { item: 'Classic Burger', table: 2, eta: '2 min' },
    { item: 'Grilled Salmon Bowl', table: 8, eta: '6 min' },
  ]

  app.innerHTML = `
    <div class="app-shell">
      <div class="panel">
        <div class="topbar">
          <div class="brand">${escapeHtml(demoRestaurant.name)}</div>
          <div class="status-pill">${state.validationResult?.status === 'active' ? 'License Active' : 'Protected'}</div>
        </div>
        <div class="content">
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">Tables</div><div class="kpi-value">${demoRestaurant.tables}</div></div>
            <div class="kpi"><div class="kpi-label">Orders</div><div class="kpi-value">${demoRestaurant.activeOrders}</div></div>
            <div class="kpi"><div class="kpi-label">Kitchen</div><div class="kpi-value">${demoRestaurant.kitchenQueue}</div></div>
            <div class="kpi"><div class="kpi-label">Revenue</div><div class="kpi-value">${demoRestaurant.revenue}</div></div>
          </div>

          <div class="dashboard-layout">
            <div class="card">
              <div class="section-head">
                <h3>Restaurant overview</h3>
                <span class="chip">${escapeHtml(demoRestaurant.view)}</span>
              </div>
              <div class="grid-two">
                <div>
                  <h4>Menu highlights</h4>
                  <ul class="menu-list">${menuHTML}</ul>
                </div>
                <div>
                  <h4>Operating snapshot</h4>
                  <p>Sample restaurant name: ${escapeHtml(demoRestaurant.name)}</p>
                  <p>License key: <strong>${escapeHtml(state.licenseKey)}</strong></p>
                  <p>Expires: ${state.expiresAt ? new Date(state.expiresAt).toLocaleString() : 'N/A'}</p>
                  <p>Remaining: ${state.remainingSeconds}s</p>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="section-head">
                <h3>Live orders</h3>
                <button class="secondary-btn" id="revalidate-btn">Refresh license</button>
              </div>
              <ul class="orders-list">
                ${orderRows.map((order) => `
                  <li class="order-card">
                    <div class="order-row"><strong>Order ${order.id}</strong><span class="status-badge ${order.status === 'Pending' ? 'status-pending' : order.status === 'Ready' ? 'status-ready' : 'status-active'}">${order.status}</span></div>
                    <div class="order-row" style="margin-top: 8px;"><span>Table ${order.table}</span><span>${order.customer}</span></div>
                    <div class="order-row" style="margin-top: 8px;"><span>Total</span><strong>${order.total}</strong></div>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <div class="card" style="margin-top: 18px;">
            <div class="section-head">
              <h3>Kitchen display</h3>
              <span class="chip">Live prep</span>
            </div>
            <ul class="kitchen-list">
              ${kitchenRows.map((row) => `
                <li class="kitchen-card">
                  <div class="order-row"><strong>${row.item}</strong><span>${row.eta}</span></div>
                  <div class="order-row" style="margin-top: 8px;"><span>Table ${row.table}</span><span>Kitchen</span></div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `

  document.getElementById('revalidate-btn').addEventListener('click', async () => {
    await validateLicense()
  })
}

function render() {
  if (!state.isUnlocked) {
    if (state.validationState === 'initial') {
      renderActivation()
    } else {
      renderLockScreen()
    }
    return
  }
  renderDashboard()
}

async function bootstrap() {
  const licenseFromStorage = localStorage.getItem('restaurant-software-license') || ''
  state.licenseKey = licenseFromStorage || ''
  if (licenseFromStorage) {
    await validateLicense()
    if (state.isUnlocked) {
      localStorage.setItem('restaurant-software-license', state.licenseKey)
    }
  } else {
    render()
  }

  setInterval(async () => {
    if (state.licenseKey) {
      await validateLicense()
      if (state.isUnlocked) {
        localStorage.setItem('restaurant-software-license', state.licenseKey)
      }
    }
  }, 20000)
}

bootstrap()
