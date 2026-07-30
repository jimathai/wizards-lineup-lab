import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'district-gm-tour-complete'

const TOUR_STEPS = [
  {
    selector: '[data-tour="view-selector"]',
    eyebrow: 'Choose your view',
    title: 'Court, Cards, or List',
    body: 'Switch between three ways to build and review your lineup. On smaller screens, List view is usually the easiest place to start.',
    animation: 'views',
  },
  {
    selector: '[data-tour="lineup-editor"]',
    highlightSelectors: ['[data-tour="lineup-editor"]', '[data-tour="player-well"]'],
    bodyClass: 'guided-tour-build-step',
    eyebrow: 'Build your five',
    title: 'Create the lineup',
    body: 'Click an empty spot to choose a player, or drag players into position. Dropping onto an occupied spot swaps the two players.',
    animation: 'drag',
  },
  {
    selector: '[data-tour="saved-lineups"]',
    eyebrow: 'Keep your ideas',
    title: 'Save multiple lineups',
    body: 'Store different combinations, rename custom slots, restore previous versions, and move any saved group back into the editor.',
    animation: 'save',
  },
  {
    selector: '[data-tour="share-lineups"]',
    eyebrow: 'Show Wizards Nation',
    title: 'Share your lineups',
    body: 'Mark the lineups you want public, then create a shareable page you can post or send to other fans.',
    animation: 'share',
  },
]

function TourAnimation({ type }) {
  if (type === 'views') {
    return (
      <div className="tour-mini tour-mini-views" aria-hidden="true">
        <span className="active">Court</span><span>Cards</span><span>List</span>
        <i />
      </div>
    )
  }

  if (type === 'drag') {
    return (
      <div className="tour-mini tour-mini-drag" aria-hidden="true">
        <span className="tour-mini-player">23</span>
        <i>→</i>
        <span className="tour-mini-slot">+</span>
      </div>
    )
  }

  if (type === 'save') {
    return (
      <div className="tour-mini tour-mini-save" aria-hidden="true">
        <span /><span /><span />
      </div>
    )
  }

  return (
    <div className="tour-mini tour-mini-share" aria-hidden="true">
      <span>↗</span><i /><i /><i />
    </div>
  )
}

export default function GuidedTour({ open, onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const step = TOUR_STEPS[stepIndex]
  const highlightSelectors = useMemo(
    () => step.highlightSelectors ?? [step.selector],
    [step],
  )

  const target = useMemo(() => {
    if (!open || typeof document === 'undefined') return null
    return document.querySelector(step.selector)
  }, [open, step.selector])

  useEffect(() => {
    if (!open) return undefined

    setStepIndex(0)
    return undefined
  }, [open])

  useEffect(() => {
    if (!open || !target) return undefined

    document.querySelectorAll('.tour-highlight').forEach((element) => {
      element.classList.remove('tour-highlight')
    })

    document.body.classList.remove('guided-tour-build-step')
    if (step.bodyClass) document.body.classList.add(step.bodyClass)

    const highlightedElements = highlightSelectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean)

    highlightedElements.forEach((element) => element.classList.add('tour-highlight'))
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

    const updateRect = () => setTargetRect(target.getBoundingClientRect())
    const timer = window.setTimeout(updateRect, 280)
    updateRect()

    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
      highlightedElements.forEach((element) => element.classList.remove('tour-highlight'))
      document.body.classList.remove('guided-tour-build-step')
    }
  }, [open, target, step.bodyClass, highlightSelectors])

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')
    onClose()
  }

  const next = () => {
    if (stepIndex === TOUR_STEPS.length - 1) {
      finish()
      return
    }
    setStepIndex((current) => current + 1)
  }

  const back = () => setStepIndex((current) => Math.max(0, current - 1))

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName
      const isEditing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)

      if (isEditing && event.key !== 'Escape') return

      if (event.key === 'Escape') {
        event.preventDefault()
        finish()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        back()
      } else if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') {
        event.preventDefault()
        next()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (!open) return null

  const tooltipStyle = {}
  if (targetRect) {
    const width = Math.min(390, window.innerWidth - 24)
    const preferredLeft = targetRect.left + targetRect.width / 2 - width / 2
    tooltipStyle.width = `${width}px`
    tooltipStyle.left = `${Math.max(12, Math.min(preferredLeft, window.innerWidth - width - 12))}px`

    const below = targetRect.bottom + 16
    const estimatedHeight = 300
    tooltipStyle.top = `${below + estimatedHeight < window.innerHeight
      ? below
      : Math.max(12, targetRect.top - estimatedHeight - 16)}px`
  }

  return (
    <div className="guided-tour-layer" role="dialog" aria-modal="true" aria-label="District GM guided tour">
      <div className="guided-tour-shade" />

      <section className="guided-tour-card" style={tooltipStyle}>
        {stepIndex === 0 && (
          <div className="guided-tour-welcome">Welcome to District GM</div>
        )}

        <div className="guided-tour-card-top">
          <div>
            <span className="guided-tour-eyebrow">{step.eyebrow}</span>
            <h2>{step.title}</h2>
          </div>
          <span className="guided-tour-count">{stepIndex + 1} / {TOUR_STEPS.length}</span>
        </div>

        <TourAnimation type={step.animation} />
        <p>{step.body}</p>

        <div className="guided-tour-dots" aria-label={`Step ${stepIndex + 1} of ${TOUR_STEPS.length}`}>
          {TOUR_STEPS.map((item, index) => (
            <span key={item.selector} className={index === stepIndex ? 'active' : ''} />
          ))}
        </div>

        <div className="guided-tour-actions">
          <button type="button" className="guided-tour-skip" onClick={finish}>Skip Tour</button>
          <div>
            <button type="button" onClick={back} disabled={stepIndex === 0}>Back</button>
            <button type="button" className="guided-tour-next" onClick={next}>
              {stepIndex === TOUR_STEPS.length - 1 ? 'Start Building' : 'Next'}
            </button>
          </div>
        </div>

        <small className="guided-tour-keyboard">Space / Enter to continue · Esc to skip</small>
      </section>
    </div>
  )
}

export { STORAGE_KEY as GUIDED_TOUR_STORAGE_KEY }
