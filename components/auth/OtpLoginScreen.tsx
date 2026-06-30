'use client'

import { useState } from 'react'
import { TsdLogo } from '@/components/TsdLogo'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useDemoStore } from '@/lib/demo-store'

export function OtpLoginScreen() {
  const { login } = useDemoStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function submit(nextCode: string) {
    const normalized = nextCode.trim()
    if (normalized.length < 3) return

    const user = login(normalized)
    if (!user) {
      setError('Неверный код')
      setCode('')
      return
    }

    setError('')
    setCode('')
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-white px-5 py-8">
      <div className="login-card">
        <div className="login-header">
          <TsdLogo />
          <h1 className="login-title">Атамекен-Агро</h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(code)
          }}
        >
          <div className="mt-6 flex justify-center">
            <InputOTP
              maxLength={3}
              value={code}
              onChange={(value) => {
                setCode(value)
                setError('')
                if (value.length === 3) submit(value)
              }}
              inputMode="numeric"
              pattern="[0-9]*"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={code.length < 3}>
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
