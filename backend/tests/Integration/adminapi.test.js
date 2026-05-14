import { jest } from '@jest/globals'

// =============================================
// DB mock
// =============================================
const mockQuery = jest.fn()

jest.unstable_mockModule('../../config/mysql.js', () => ({
  default: { query: mockQuery }
}))

const { default: app }     = await import('../../server.js')
const { default: request } = await import('supertest')

// =============================================
// INTEGRATION TESTS: /api/admin
// =============================================
describe('POST /api/admin/login', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 1: Wrong credentials
  test('galat credentials par Invalid credentials return karo', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass' })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid credentials')
  })

  // Test 2: Correct admin credentials
  test('sahi admin credentials par token return karo', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email:    process.env.ADMIN_EMAIL    || 'admin@medisphere.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
  })

})

describe('GET /api/admin/all-doctors', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 3: No token — blocked
  test('atoken nahi diya to Not Authorized return karo', async () => {
    const res = await request(app)
      .get('/api/admin/all-doctors')

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Not Authorized Login Again')
  })

  // Test 4: Valid token — doctors list mile
  test('valid atoken par doctors list return karo', async () => {
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { role: 'admin', email: 'admin@medisphere.com' },
      process.env.JWT_SECRET || 'testsecret'
    )

    mockQuery.mockResolvedValueOnce([[
      {
        doctor_id:      1,
        doctor_name:    'Dr. Anjali Mehta',
        specialization: 'Neurologist',
        fee:            1000,
        experience_yrs: 8
      },
      {
        doctor_id:      2,
        doctor_name:    'Dr. Raj Sharma',
        specialization: 'Cardiologist',
        fee:            850,
        experience_yrs: 12
      }
    ]])

    const res = await request(app)
      .get('/api/admin/all-doctors')
      .set('atoken', token)

    expect(res.body.success).toBe(true)
    expect(res.body.doctors).toHaveLength(2)
  })

})

describe('GET /api/admin/appointments', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 5: No token — blocked
  test('atoken nahi diya to Not Authorized return karo', async () => {
    const res = await request(app)
      .get('/api/admin/appointments')

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Not Authorized Login Again')
  })

  // Test 6: Valid token — appointments mile
  test('valid atoken par all appointments return karo', async () => {
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { role: 'admin', email: 'admin@medisphere.com' },
      process.env.JWT_SECRET || 'testsecret'
    )

    mockQuery.mockResolvedValueOnce([[
      {
        appointment_id:   1,
        patient_name:     'Rahul Kumar',
        doctor_name:      'Dr. Anjali Mehta',
        appointment_date: '2026-05-15',
        appointment_time: '10:00:00',
        status:           'Pending'
      }
    ]])

    const res = await request(app)
      .get('/api/admin/appointments')
      .set('atoken', token)

    expect(res.body.success).toBe(true)
    expect(res.body.appointments).toHaveLength(1)
  })

})

describe('GET /api/admin/dashboard', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 7: Valid token — dashboard data mile
  test('valid atoken par dashboard stats return karo', async () => {
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { role: 'admin', email: 'admin@medisphere.com' },
      process.env.JWT_SECRET || 'testsecret'
    )

    // DB query 1: vw_admin_dashboard
    mockQuery.mockResolvedValueOnce([[{
      total_doctors:      5,
      total_patients:     20,
      total_appointments: 35,
      pending:            10,
      confirmed:          8,
      completed:          15,
      cancelled:          2
    }]])

    // DB query 2: latest appointments
    mockQuery.mockResolvedValueOnce([[
      { appointment_id: 1, patient_name: 'Rahul', doctor_name: 'Dr. Anjali' }
    ]])

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('atoken', token)

    expect(res.body.success).toBe(true)
    expect(res.body.dashData.doctors).toBe(5)
    expect(res.body.dashData.patients).toBe(20)
    expect(res.body.dashData.appointments).toBe(35)
  })

})