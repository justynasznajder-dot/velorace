'use client'

import { useCallback, useEffect, useState } from 'react'
import AdminRaceForm from '@/components/admin/AdminRaceForm'
import {
  emptyCategoryRow,
  emptyStartWave,
  getDuplicateCategoryKeys,
  initialRaceForm,
  parseOptionalInt,
  parseOptionalNumber,
  reorderCategories,
  scrollRaceFormToTop,
  type CategoryRow,
  type RaceFormState,
  type StartWaveRow,
} from '@/components/admin/adminRaceFormShared'
import { birthYearTemplateHint, templateGenderToForm } from '@/components/admin/adminCategoryTemplateUtils'
import { useCategoryTemplates } from '@/hooks/useCategoryTemplates'
import AdminFeedbackToast from '@/components/admin/AdminFeedbackToast'
import AdminRegulationUpload from '@/components/admin/AdminRegulationUpload'
import styles from './AdminDashboard.module.css'

export default function AdminAddRaceTab() {
  const {
    templates: categoryTemplates,
    loading: categoryTemplatesLoading,
    error: categoryTemplatesError,
    empty: categoryTemplatesEmpty,
  } = useCategoryTemplates()
  const [form, setForm] = useState(() => initialRaceForm())
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [startWaves, setStartWaves] = useState<StartWaveRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [invalidCategoryKeys, setInvalidCategoryKeys] = useState<string[]>([])
  const [categoryRequiredError, setCategoryRequiredError] = useState(false)
  const [createdRaceForRegulation, setCreatedRaceForRegulation] = useState<{ id: string; name: string } | null>(null)
  const [startlistQueueByCategoryKey, setStartlistQueueByCategoryKey] = useState<
    Record<string, { file: File; fileName: string } | undefined>
  >({})
  const [resetAfterStartlistUploads, setResetAfterStartlistUploads] = useState(false)

  const onStartlistQueueChange = useCallback(
    (categoryKey: string, next: { file: File; fileName: string } | null) => {
      setStartlistQueueByCategoryKey(prev => {
        const copy = { ...prev }
        if (!next) delete copy[categoryKey]
        else copy[categoryKey] = next
        return copy
      })
    },
    [],
  )

  useEffect(() => {
    if (!resetAfterStartlistUploads) return
    const hasQueued = Object.keys(startlistQueueByCategoryKey).length > 0
    if (hasQueued) return

    setResetAfterStartlistUploads(false)
    setForm(initialRaceForm())
    setCategories([])
    setStartWaves([])
    setInvalidCategoryKeys([])
    setCategoryRequiredError(false)
  }, [resetAfterStartlistUploads, startlistQueueByCategoryKey])

  const setField = useCallback((key: keyof RaceFormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateCategory = useCallback((key: string, patch: Partial<CategoryRow>) => {
    if (typeof patch.name === 'string' && patch.name.trim()) {
      setInvalidCategoryKeys(prev => prev.filter(k => k !== key))
    }
    setCategories(prev => prev.map(c => (c.key === key ? { ...c, ...patch } : c)))
  }, [])

  const toggleCategory = useCallback((key: string) => {
    setCategories(prev => prev.map(c => (c.key === key ? { ...c, open: !c.open } : c)))
  }, [])

  const addCategory = useCallback(() => {
    setCategoryRequiredError(false)
    setCategories(prev => [...prev, emptyCategoryRow()])
  }, [])

  const removeCategory = useCallback((key: string) => {
    setCategories(prev => prev.filter(c => c.key !== key))
    setStartWaves(prev => prev.map(w => ({ ...w, categoryKeys: w.categoryKeys.filter(k => k !== key) })))
  }, [])

  const moveCategory = useCallback((key: string, dir: 'up' | 'down') => {
    setCategories(prev => reorderCategories(prev, key, dir))
  }, [])

  const onCategoryTemplateSelect = useCallback(
    (categoryKey: string, value: string) => {
      if (value === 'custom') {
        updateCategory(categoryKey, {
          templateSelect: 'custom',
          name: '',
          gender: '',
          birthYearHint: '',
          min_age: '',
          max_age: '',
        })
        return
      }
      if (value === '') {
        updateCategory(categoryKey, { templateSelect: '', birthYearHint: '', min_age: '', max_age: '' })
        return
      }
      const id = Number(value)
      const t = categoryTemplates.find(x => x.id === id)
      if (!t) return
      updateCategory(categoryKey, {
        templateSelect: String(id),
        name: t.name,
        gender: templateGenderToForm(t.gender),
        birthYearHint: birthYearTemplateHint(t),
        min_age: t.birthYearMin != null ? String(t.birthYearMin) : '',
        max_age: t.birthYearMax != null ? String(t.birthYearMax) : '',
      })
    },
    [categoryTemplates, updateCategory],
  )

  const addStartWave = useCallback(() => {
    setStartWaves(prev => [...prev, emptyStartWave()])
  }, [])

  const removeStartWave = useCallback((waveKey: string) => {
    setStartWaves(prev => prev.filter(w => w.key !== waveKey))
  }, [])

  const toggleWaveCategory = useCallback((waveKey: string, catKey: string, checked: boolean) => {
    setStartWaves(prev => {
      if (checked) {
        return prev.map(w => {
          const keys =
            w.key === waveKey
              ? [...w.categoryKeys.filter(k => k !== catKey), catKey]
              : w.categoryKeys.filter(k => k !== catKey)
          return { ...w, categoryKeys: keys }
        })
      }
      return prev.map(w =>
        w.key === waveKey ? { ...w, categoryKeys: w.categoryKeys.filter(k => k !== catKey) } : w,
      )
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setInvalidCategoryKeys([])
    setCategoryRequiredError(false)

    const validCats = categories.filter(c => c.name.trim())
    if (categories.length > 0 && validCats.length !== categories.length) {
      const missingKeys = categories.filter(c => !c.name.trim()).map(c => c.key)
      setInvalidCategoryKeys(missingKeys)
      setCategories(prev =>
        prev.map(c => (missingKeys.includes(c.key) && !c.open ? { ...c, open: true } : c)),
      )
      const firstMissing = missingKeys[0]
      if (firstMissing) {
        requestAnimationFrame(() => {
          const el = document.getElementById(`race-category-name-${firstMissing}`) as HTMLInputElement | null
          if (!el) return
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.focus()
        })
      }
      setMessage({ type: 'err', text: 'Każda dodana kategoria musi mieć nazwę — uzupełnij lub usuń pustą kartę.' })
      return
    }

    const duplicateKeys = getDuplicateCategoryKeys(categories)
    if (duplicateKeys.length > 0) {
      setInvalidCategoryKeys(duplicateKeys)
      setCategories(prev =>
        prev.map(c => (duplicateKeys.includes(c.key) && !c.open ? { ...c, open: true } : c)),
      )
      const firstDup = duplicateKeys[0]
      if (firstDup) {
        requestAnimationFrame(() => {
          const el = document.getElementById(`race-category-name-${firstDup}`) as HTMLInputElement | null
          if (!el) return
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.focus()
        })
      }
      setMessage({ type: 'err', text: 'Kategorie muszą mieć unikalne nazwy — popraw zduplikowane pozycje.' })
      return
    }

    for (const w of startWaves) {
      const hasT = w.startTime.trim().length > 0
      const hasC = w.categoryKeys.length > 0
      if (hasT !== hasC) {
        setMessage({
          type: 'err',
          text: 'Dla każdej fali startu ustaw godzinę i wybierz co najmniej jedną kategorię (albo usuń niepełną falę).',
        })
        return
      }
      if (hasT && hasC) {
        const allNamed = w.categoryKeys.every(k => validCats.some(c => c.key === k))
        if (!allNamed) {
          setMessage({
            type: 'err',
            text: 'W fali startu są kategorie bez nazwy — uzupełnij nazwy lub odznacz je w fali.',
          })
          return
        }
      }
    }

    if (validCats.length === 0) {
      setCategoryRequiredError(true)
      requestAnimationFrame(() => {
        const btn = document.getElementById('add-category-button')
        if (!btn) return
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return
    }

    setSubmitting(true)

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      city: form.city.trim(),
      race_date: form.race_date,
      race_type: form.race_type,
      status: form.status,
    }

    const desc = form.description.trim()
    if (desc) body.description = desc

    const ro = form.registration_opens.trim()
    if (ro) body.registration_opens = ro
    const rc = form.registration_closes.trim()
    if (rc) body.registration_closes = rc

    body.categories = validCats.map((c, index) => ({
      name: c.name.trim(),
      min_age: parseOptionalInt(c.min_age),
      max_age: parseOptionalInt(c.max_age),
      gender: c.gender === 'M' || c.gender === 'F' ? c.gender : null,
      entry_fee_pln: parseOptionalNumber(c.entry_fee_pln),
      display_order: index,
      distance_km: parseOptionalNumber(c.distance_km),
      lap_count: parseOptionalInt(c.lap_count),
      laps_distance_km: parseOptionalNumber(c.laps_distance_km),
    }))
    const wavesPayload = startWaves
      .filter(w => w.startTime.trim() && w.categoryKeys.length > 0)
      .map(w => {
        const wt = w.startTime.trim()
        return {
          start_time: wt.length <= 5 ? `${wt}:00` : wt,
          category_indexes: Array.from(
            new Set(w.categoryKeys.map(k => validCats.findIndex(c => c.key === k)).filter(i => i >= 0)),
          ).sort((a, b) => a - b),
        }
      })
      .filter(w => w.category_indexes.length > 0)
    if (wavesPayload.length > 0) body.startWaves = wavesPayload

    try {
      const res = await fetch('/api/admin/races', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { ok?: boolean; message?: string; slug?: string; id?: string }
      const categoryIds = (data as { categoryIds?: string[] }).categoryIds ?? []

      if (!res.ok || !data.ok) {
        setMessage({ type: 'err', text: data.message || `Błąd (${res.status})` })
        return
      }

      setMessage({
        type: 'ok',
        text: data.message || `Zapisano (slug: ${data.slug ?? '—'}).`,
      })

      const nextRaceId = data?.id ?? null
      setCreatedRaceForRegulation(nextRaceId ? { id: nextRaceId, name: form.name.trim() } : null)
      scrollRaceFormToTop()

      const hasQueuedStartlists = Object.keys(startlistQueueByCategoryKey).length > 0
      if (hasQueuedStartlists && nextRaceId && categoryIds.length > 0) {
        // Żeby auto-upload mógł się wykonać, zostawiamy kategorie/akordeon aż do zakończenia wysyłki.
        setCategories(prev =>
          prev.map((c, idx) => ({
            ...c,
            dbId: categoryIds[idx] ?? c.dbId,
          })),
        )
        setResetAfterStartlistUploads(true)
        // Reset pól formularza (kategorie pozostają do momentu uploadu).
        setForm(initialRaceForm())
      } else {
        setForm(initialRaceForm())
        setCategories([])
        setStartWaves([])
        setInvalidCategoryKeys([])
        setCategoryRequiredError(false)
        setStartlistQueueByCategoryKey({})
        setResetAfterStartlistUploads(false)
      }
    } catch {
      setMessage({ type: 'err', text: 'Brak połączenia z serwerem.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.panel}>
      <AdminRegulationUpload
        raceId={createdRaceForRegulation?.id ?? null}
        raceName={createdRaceForRegulation?.name ?? ''}
      />
      <AdminRaceForm
        form={form}
        setField={setField}
        categories={categories}
        updateCategory={updateCategory}
        toggleCategory={toggleCategory}
        addCategory={addCategory}
        removeCategory={removeCategory}
        moveCategory={moveCategory}
        categoryTemplates={categoryTemplates}
        categoryTemplatesLoading={categoryTemplatesLoading}
        categoryTemplatesError={categoryTemplatesError}
        categoryTemplatesEmpty={categoryTemplatesEmpty}
        onCategoryTemplateSelect={onCategoryTemplateSelect}
        startWaves={startWaves}
        setStartWaves={setStartWaves}
        addStartWave={addStartWave}
        removeStartWave={removeStartWave}
        toggleWaveCategory={toggleWaveCategory}
        onSubmit={handleSubmit}
        submitLabel="Zapisz wyścig"
        submitting={submitting}
        invalidCategoryKeys={invalidCategoryKeys}
        categoryRequiredError={categoryRequiredError}
        raceId={createdRaceForRegulation?.id ?? null}
        startlistQueueByCategoryKey={startlistQueueByCategoryKey}
        onStartlistQueueChange={onStartlistQueueChange}
      />

      <AdminFeedbackToast message={message} onDismiss={() => setMessage(null)} />
    </div>
  )
}
