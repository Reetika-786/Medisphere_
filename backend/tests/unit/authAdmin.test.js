import { jest } from '@jest/globals'

const mockVerify = jest.fn()

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify }
}))

const { default: authAdmin } = await import('../../middleware/authAdmin.js')

const mockRes = () => {
  const res = {}
  res.json = jest.fn()
  return res
}

describe('authAdmin middleware', () => {

  beforeEach(() => {
    mockVerify.mockReset()
  })

  // Test 1: Token nahi diya
  test('atoken missing hone par Not Authorized return karo', () => {
    const req = { headers: {} }
    const res = mockRes()
    const next = jest.fn()

    authAdmin(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized Login Again'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 2: Galat token
  test('invalid atoken par Invalid Token return karo', () => {
    const req = { headers: { atoken: 'bad_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockImplementation(() => {
      throw new Error('jwt malformed')
    })

    authAdmin(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Token'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 3: Doctor token — admin middleware reject kare
  test('doctor role token par Not Authorized return karo', () => {
    const req = { headers: { atoken: 'doctor_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ role: 'doctor', email: 'dr@test.com' })

    authAdmin(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 4: Patient token — admin middleware reject kare
  test('patient role token par Not Authorized return karo', () => {
    const req = { headers: { atoken: 'patient_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ role: 'patient', email: 'p@test.com' })

    authAdmin(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 5: Sahi admin token
  test('valid admin token par next() call ho', () => {
    const req = { headers: { atoken: 'valid_admin_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ role: 'admin', email: 'admin@hospital.com' })

    authAdmin(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

})