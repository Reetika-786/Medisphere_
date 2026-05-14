import { jest } from '@jest/globals'

const mockVerify = jest.fn()

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify }
}))

const { default: authDoctor } = await import('../../middleware/authDoctor.js')

const mockRes = () => {
  const res = {}
  res.json = jest.fn()
  return res
}

describe('authDoctor middleware', () => {

  beforeEach(() => {
    mockVerify.mockReset()
  })

  // Test 1: Token nahi diya
  test('dtoken missing hone par Not Authorized return karo', async () => {
    const req = { headers: {} }
    const res = mockRes()
    const next = jest.fn()

    authDoctor(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized Login Again'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 2: Galat token
  test('invalid dtoken par error return karo', async () => {
    const req = { headers: { dtoken: 'bad_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockImplementation(() => {
      throw new Error('invalid signature')
    })

    authDoctor(req, res, next)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
    expect(next).not.toHaveBeenCalled()
  })

  // Test 3: Patient token — doctor middleware reject kare
  test('patient role token par Not Authorized return karo', async () => {
    const req = { headers: { dtoken: 'patient_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ id: 10, role: 'patient' })

    authDoctor(req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized'
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Test 4: Sahi doctor token
  test('valid doctor token par next() call ho aur req.doctorId set ho', async () => {
    const req = { headers: { dtoken: 'valid_doctor_token' } }
    const res = mockRes()
    const next = jest.fn()

    mockVerify.mockReturnValue({ id: 7, role: 'doctor' })

    authDoctor(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.doctorId).toBe(7)
    expect(res.json).not.toHaveBeenCalled()
  })

})