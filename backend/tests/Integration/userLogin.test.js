import { jest } from '@jest/globals'

// =============================================
// DB mock — real database use nahi karni test mein
// =============================================
const mockQuery = jest.fn()

jest.unstable_mockModule('../../config/mysql.js', () => ({
  default: { query: mockQuery }
}))

// imports BAAD mein
const { default: app }    = await import('../../server.js')
const { default: request } = await import('supertest')

// =============================================
// INTEGRATION TESTS: /api/user
// =============================================
describe('POST /api/user/register', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 1: Missing fields
  test('name/email/password missing ho to error return karo', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test@test.com' })  // name aur password missing

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Missing Details')
  })

  // Test 2: Email already registered
  test('already registered email par error return karo', async () => {
    // DB query: email already exists
    mockQuery.mockResolvedValueOnce([[{ user_id: 1 }]])

    const res = await request(app)
      .post('/api/user/register')
      .send({ name: 'Test', email: 'existing@test.com', password: '123456' })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Email already registered')
  })

  // Test 3: Successful registration
  test('sahi data se registration successful ho', async () => {
    // DB query 1: email check — koi result nahi (naya user)
    mockQuery.mockResolvedValueOnce([[]])
    // DB query 2: INSERT into users
    mockQuery.mockResolvedValueOnce([{ insertId: 10 }])
    // DB query 3: INSERT into patients
    mockQuery.mockResolvedValueOnce([{}])

    const res = await request(app)
      .post('/api/user/register')
      .send({ name: 'New User', email: 'new@test.com', password: '123456', role: 'patient' })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(res.body.role).toBe('patient')
  })

})

describe('POST /api/user/login', () => {

  beforeEach(() => {
    mockQuery.mockReset()
  })

  // Test 4: Missing fields
  test('email/password missing ho to error return karo', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@test.com' })  // password missing

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Missing Details')
  })

  // Test 5: Wrong credentials
  test('galat credentials par Invalid Credentials return karo', async () => {
    // DB: koi user nahi mila
    mockQuery.mockResolvedValueOnce([[]])

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass' })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid Credentials')
  })

  // Test 6: Successful patient login
  test('sahi patient credentials par token aur role return karo', async () => {
    // DB: patient user mila
    mockQuery.mockResolvedValueOnce([[{
      user_id: 5,
      email: 'patient@test.com',
      role: 'patient',
      is_active: 1
    }]])

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'patient@test.com', password: 'correctpass' })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
    expect(res.body.role).toBe('patient')
  })

  // Test 7: Doctor login from user route
  test('doctor login par bhi token aur role:doctor return karo', async () => {
    mockQuery.mockResolvedValueOnce([[{
      user_id: 8,
      email: 'dr@test.com',
      role: 'doctor',
      is_active: 1
    }]])

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'dr@test.com', password: 'drpass' })

    expect(res.body.success).toBe(true)
    expect(res.body.role).toBe('doctor')
  })

})