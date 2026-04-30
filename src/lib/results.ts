export type ResultCategoryFile = {
  position: number
  fileName: string
}

export const RESULT_FILES: ResultCategoryFile[] = [
  { position: 1, fileName: 'junior_mlodszy.pdf' },
  { position: 2, fileName: 'mlodzik_mlodziczka_juniorka_ml.pdf' },
  { position: 3, fileName: 'mlodziez_szkolna.pdf' },
  { position: 4, fileName: 'elita_orlik.pdf' },
  { position: 5, fileName: 'junior.pdf' },
]

export function getResultFileNameByPosition(position: number) {
  return RESULT_FILES.find(f => f.position === position)?.fileName ?? null
}

export function getResultPublicUrlByPosition(position: number) {
  const fileName = getResultFileNameByPosition(position)
  return fileName ? `/wyniki/${fileName}` : null
}
