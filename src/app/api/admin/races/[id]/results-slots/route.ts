import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { getRaceResultsPdfContext } from '@/lib/raceDb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  const resolved = ctx.params instanceof Promise ? await ctx.params : ctx.params
  const id = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!id) {
    return NextResponse.json({ ok: false, message: 'Brak identyfikatora wyścigu.' }, { status: 400 })
  }

  try {
    const ctxData = await getRaceResultsPdfContext(id)
    if (!ctxData) {
      return NextResponse.json({ ok: false, message: 'Nie znaleziono wyścigu.' }, { status: 404 })
    }
    return NextResponse.json({
      ok: true,
      raceId: id,
      slug: ctxData.slug,
      resultsPdfSlotMode: ctxData.resultsPdfSlotMode,
      effectiveMode: ctxData.effectiveMode,
      categorySlots: ctxData.categorySlots,
      waveSlots: ctxData.waveSlots,
    })
  } catch (e) {
    console.error('[admin/races/.../results-slots]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się odczytać slotów wyników.' }, { status: 500 })
  }
}
