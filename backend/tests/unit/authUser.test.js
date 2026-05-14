// ✅ ES Modules mein jest.unstable_mockModule use hota hai
import { jest } from '@jest/globals'

// jwt mock — import se PEHLE mock banana padta hai ES modules mein
const mockVerify = jest.fn()

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  }
}))

// Mock ke BAAD import karo
const { default: authUser } = await import('../../middleware/authUser.js')

// =============================================
// HELPER
// =============================================
const mockRes = () => {
  const res = {}
  res.json = jest.fn()
  return res
}

// =============================================
// TESTS: authUser middleware
// =============================================
describe('authUser middleware', () => {

  beforeEach(() => {
    mockVerify.mockReset()  // har test se pehle mock reset
  })

  // Test 1: Token nahi diya
  test('token missing hone par Not Authorized return karo', async () => {
    const req = { headers: {} }
    const res = mockRes()
    const next = jest.fn()

    await authUser(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized Login Again'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 2: Galat token
  test('invalid token par error return karo', async () => {
    const req = { headers: { token: 'bad_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    await authUser(req, res, next)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
    expect(next).not.toHaveBeenCalled()
  })

  // Test 3: Doctor token — patient middleware reject kare
  test('doctor role token par Not Authorized return karo', async () => {
    const req = { headers: { token: 'doctor_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ id: 5, role: 'doctor' })

    await authUser(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 4: Sahi patient token
  test('valid patient token par next() call ho aur req.userId set ho', async () => {
    const req = { headers: { token: 'patient_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ id: 42, role: 'patient' })

    await authUser(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.userId).toBe(42)
    expect(res.json).not.toHaveBeenCalled()
  })

})