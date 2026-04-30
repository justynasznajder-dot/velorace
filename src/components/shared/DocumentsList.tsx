import Widget from '@/components/shared/Widget'
import { DOCUMENTS, docTypeIcon } from '@/lib/data'
import styles from './DocumentsList.module.css'

export default function DocumentsList() {
  return (
    <Widget title="Dokumenty do pobrania" moreLabel="Wszystkie →" moreHref="/dokumenty">
      {DOCUMENTS.map(doc => (
        <div key={doc.id} className={styles.row}>
          <span className={styles.icon}>{docTypeIcon(doc.type)}</span>
          <div className={styles.info}>
            <div className={styles.name}>{doc.name}</div>
            <div className={styles.meta}>
              PDF · {doc.fileSizeMb} MB · Dodano {doc.addedDate.split('-').reverse().join('.')}
            </div>
          </div>
          <a href={doc.downloadUrl} className={styles.dl} download>
            Pobierz
          </a>
        </div>
      ))}
    </Widget>
  )
}
