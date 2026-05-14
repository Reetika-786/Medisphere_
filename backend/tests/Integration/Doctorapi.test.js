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
// INTEGRATION TESTS: /api/doctor
// =============================================
describe('POST /api/doctor/login', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 1: Missing fields
  test('email/password missing ho to error return karo', async () => {
    const res = await request(app)
      .post('/api/doctor/login')
      .send({ email: 'dr@test.com' })  // password missing

    expect(res.body.success).toBe(false)
  })

  // Test 2: Wrong credentials
  test('galat credentials par Invalid credentials return karo', async () => {
    mockQuery.mockResolvedValueOnce([[]])  // koi doctor nahi mila

    const res = await request(app)
      .post('/api/doctor/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass' })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid credentials')
  })

  // Test 3: Successful doctor login
  test('sahi credentials par token return karo', async () => {
    mockQuery.mockResolvedValueOnce([[{
      user_id: 3,
      email:   'dr.sharma@hospital.com',
      role:    'doctor',
      doctor_id: 1
    }]])

    const res = await request(app)
      .post('/api/doctor/login')
      .send({ email: 'dr.sharma@hospital.com', password: 'drpass123' })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
  })

})

describe('GET /api/doctor/appointments', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 4: No token — blocked
  test('dtoken nahi diya to Not Authorized return karo', async () => {
    const res = await request(app)
      .get('/api/doctor/appointments')
    // no dtoken header

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Not Authorized Login Again')
  })

  // Test 5: With valid token — appointments return ho
  test('valid dtoken par appointments return karo', async () => {
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign(
      { id: 3, role: 'doctor', doctor_id: 1 },
      process.env.JWT_SECRET || 'testsecret'
    )

    // DB query 1: doctor_id fetch
    mockQuery.mockResolvedValueOnce([[{ doctor_id: 1 }]])
    // DB query 2: appointments fetch
    mockQuery.mockResolvedValueOnce([[
      {
        appointment_id:   1,
        patient_name:     'Rahul Kumar',
        appointment_date: '2026-05-15',
        appointment_time: '10:00:00',
        status:           'Pending',
        gender:           'Male',
        date_of_birth:    '1995-03-10'
      }
    ]])

    const res = await request(app)
      .get('/api/doctor/appointments')
      .set('dtoken', token)

    expect(res.body.success).toBe(true)
    expect(res.body.appointments).toHaveLength(1)
    expect(res.body.appointments[0].patient_name).toBe('Rahul Kumar')
  })

})

describe('GET /api/doctor/list', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 6: Public route — no token needed
  test('token ke bina bhi doctor list return karo', async () => {
    mockQuery.mockResolvedValueOnce([[
      {
        doctor_id:      1,
        doctor_name:    'Dr. Anjali Mehta',
        specialization: 'Neurologist',
        experience_yrs: 8,
        fee:            1000,
        about:          'Expert neurologist'
      }
    ]])

    const res = await request(app)
      .get('/api/doctor/list')

    expect(res.body.success).toBe(true)
    expect(res.body.doctors).toHaveLength(1)
    expect(res.body.doctors[0].name).toBe('Dr. Anjali Mehta')
  })

})