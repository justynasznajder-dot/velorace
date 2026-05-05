'use client'

import { useEffect, useState } from 'react'
import styles from './AdminDashboard.module.css'
import { parseTime24 } from './adminRaceFormShared'

function timeFromParentValue(value: string): string {
  return value.length >= 16 ? value.slice(11, 16) : ''
}

type Props = {
  label: string
  value: string
  onChange: (next: string) => void
}

/**
 * Data (kalendarz) + godzina 24h w jednym wierszu; nieprawidłowa godzina jest odrzucana po wyjściu z pola.
 */
export default function RegistrationDateTimeBlock({ label, value, onChange }: Props) {
  const [dateDraft, setDateDraft] = useState(() => (value.length >= 10 ? value.slice(0, 10) : ''))
  const [timeDraft, setTimeDraft] = useState(() => timeFromParentValue(value))
  const [timeErr, setTimeErr] = useState(false)

  useEffect(() => {
    setDateDraft(value.length >= 10 ? value.slice(0, 10) : '')
    setTimeDraft(timeFromParentValue(value))
    setTimeErr(false)
  }, [value])

  function emitDateAndTime(d: string, timeRaw: string) {
    const t = timeRaw.trim()
    if (!d) {
      onChange('')
      return
    }
    if (!t) {
      onChange(d)
      return
    }
    const parsed = parseTime24(t)
    if (parsed) {
      onChange(`${d}T${parsed.hh}:${parsed.mm}`)
      return
    }
    if (value.length >= 16) {
      onChange(`${d}T${value.slice(11, 16)}`)
      return
    }
    onChange(d)
  }

  function handleDateChange(d: string) {
    setDateDraft(d)
    setTimeErr(false)
    if (!d) {
      onChange('')
      setTimeDraft('')
      return
    }
    emitDateAndTime(d, timeDraft)
  }

  function handleTimeChange(raw: string) {
    setTimeErr(false)
    setTimeDraft(raw)
    const d = dateDraft.trim()
    if (!d) return
    const t = raw.trim()
    if (!t) {
      onChange(d)
      return
    }
    const parsed = parseTime24(t)
    if (parsed) {
      onChange(`${d}T${parsed.hh}:${parsed.mm}`)
    }
  }

  function handleTimeBlur() {
    const d = dateDraft.trim()
    const t = timeDraft.trim()
    if (!t) {
      setTimeErr(false)
      if (d) onChange(d)
      return
    }
    const parsed = parseTime24(t)
    if (!parsed) {
      setTimeErr(true)
      setTimeDraft(timeFromParentValue(value))
      return
    }
    setTimeErr(false)
    if (d) onChange(`${d}T${parsed.hh}:${parsed.mm}`)
  }

  return (
    <div className={styles.formField}>
      <span className={styles.formLabel}>{label}</span>
      <div className={styles.regDtDateTimeRow}>
        <input
          className={styles.formInput}
          type="date"
          value={dateDraft}
          onChange={e => handleDateChange(e.target.value)}
        />
        <input
          className={`${styles.formInput} ${timeErr ? styles.formInputInvalid : ''}`}
          data-reg-time-input
          type="text"
          inputMode="numeric"
          placeholder="np. 07:30"
          autoComplete="off"
          value={timeDraft}
          onChange={e => handleTimeChange(e.target.value)}
          onBlur={handleTimeBlur}
          maxLength={8}
          aria-invalid={timeErr}
        />
      </div>
      {timeErr ? (
        <p className={styles.regDtTimeErr} role="alert">
          Podaj godzinę w formacie 24h (00:00–23:59), np. 07:30.
        </p>
      ) : (
        <p className={styles.regDtHint}>
          Godzina w zakresie 00:00–23:59 (minuty 00–59). Najpierw data, potem godzina.
        </p>
      )}
    </div>
  )
}
