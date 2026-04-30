import styles from './Widget.module.css'

interface WidgetProps {
  title: string
  moreLabel?: string
  moreHref?: string
  children: React.ReactNode
}

export default function Widget({ title, moreLabel, moreHref, children }: WidgetProps) {
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {moreLabel && moreHref && (
          <a href={moreHref} className={styles.more}>{moreLabel}</a>
        )}
      </div>
      {children}
    </div>
  )
}
