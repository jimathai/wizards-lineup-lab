import { useState } from 'react'
import FeedbackModal from './FeedbackModal'

const moves = [
  {
    year: '2023',
    title: 'Reset the direction',
    text: 'The new front office moved Bradley Beal and Kristaps Porziņģis, creating flexibility, adding draft capital, and committing to a true rebuild instead of another short-term patch.',
    link: 'https://www.nba.com/wizards/news/wizards-agree-to-trade-beal-to-phoenix-acquire-paul-shamet-and-draft-picks',
    linkLabel: 'Bradley Beal trade details',
  },
  {
    year: '2023',
    title: 'Moved up for Bilal Coulibaly',
    text: 'Washington traded up on draft night for a long, athletic two-way prospect whose timeline matched the rebuild.',
    link: 'https://www.nba.com/wizards/news/wizards-agree-in-principal-to-acquire-draft-rights-to-coulibaly',
    linkLabel: 'Coulibaly acquisition',
  },
  {
    year: '2024',
    title: 'Added three first-round building blocks',
    text: 'Alex Sarr, Bub Carrington, and Kyshawn George gave the roster size, skill, versatility, and multiple development bets in one draft cycle.',
    link: 'https://www.nba.com/draft/2024/team-profiles/2024-washington-wizards',
    linkLabel: '2024 draft recap',
  },
  {
    year: '2024',
    title: 'Turned Deni Avdija into a larger asset package',
    text: 'The Portland deal brought back Bub Carrington, a future first-round pick, two second-round picks, and a veteran contract that preserved future options.',
    link: 'https://www.nba.com/wizards/news/wizards-complete-trade-with-trail-blazers',
    linkLabel: 'Trail Blazers trade details',
  },
  {
    year: '2025',
    title: 'Expanded the young core again',
    text: 'Tre Johnson, Will Riley, and Jamir Watkins added shooting, creation, size, and another round of upside to the development pipeline.',
    link: 'https://www.nba.com/wizards/news/wizards-select-tre-johnson-with-sixth-overall-pick-in-2025-nba-draft',
    linkLabel: '2025 draft recap',
  },
]

const videos = [
  {
    title: '2025 NBA Draft Media Availability',
    duration: '16:54',
    url: 'https://www.nba.com/wizards/videos/2025-nba-draft-media-availability-will-dawkins-06-25-25',
  },
  {
    title: '2024–25 Exit Interview',
    duration: '42:04',
    url: 'https://www.nba.com/wizards/videos/2024-25-washington-wizards-exit-interviews-will-dawkins',
  },
  {
    title: '2024 Draft Class Introduction',
    duration: '18:47',
    url: 'https://www.nba.com/wizards/videos/introductory-press-conference-will-dawkins-alex-sarr-bub-carrington-and-kyshawn-george',
  },
]

export default function WillDawkinsPage() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <div className="dawkins-page dawkins-page--editorial">
      <header className="dawkins-topbar">
        <a className="dawkins-home-link" href="/">← Back to the Lab</a>
        <button type="button" className="dawkins-feedback-button" onClick={() => setFeedbackOpen(true)}>
          Leave a Comment
        </button>
      </header>

      <main>
        <section className="dawkins-hero dawkins-hero--simple">
          <div className="dawkins-hero-copy">
            <p className="dawkins-kicker">DISTRICT BASKETBALL LAB</p>
            <h1>Will Dawkins Appreciation</h1>
            <p className="dawkins-lead">
              A fan-made look at the decisions, patience, and long-term vision behind Washington’s rebuild.
            </p>
            <a href="#moves" className="dawkins-primary-action">Review the Moves</a>
          </div>
          <div className="dawkins-photo-panel dawkins-photo-panel--portrait" role="img" aria-label="Basketball executive press conference illustration">
            <span>VISION</span>
            <strong>BUILD<br />FOR THE<br />LONG TERM</strong>
          </div>
        </section>

        <section className="dawkins-section dawkins-vision-section">
          <div className="dawkins-section-heading">
            <span>THE VISION</span>
            <h2>Build a sustainable contender—not a temporary fix.</h2>
          </div>
          <div className="dawkins-editorial-grid">
            <div>
              <p>
                The plan has been clear: prioritize player development, maintain financial flexibility, collect draft assets, and take multiple swings on young talent. The results are still being written, but the direction is finally easy to understand.
              </p>
              <p>
                This page is less about declaring every move perfect and more about documenting the logic connecting them: patience, optionality, development, and a roster built on a shared timeline.
              </p>
            </div>
            <div className="dawkins-photo-panel dawkins-photo-panel--wide" role="img" aria-label="Washington basketball rebuild illustration">
              <span>THE BLUEPRINT</span>
              <strong>DRAFT · DEVELOP · DECIDE</strong>
            </div>
          </div>
        </section>

        <section id="moves" className="dawkins-section dawkins-moves-section">
          <div className="dawkins-section-heading">
            <span>THE MOVES</span>
            <h2>A rebuild timeline.</h2>
          </div>
          <div className="dawkins-timeline">
            {moves.map((move, index) => (
              <article className="dawkins-move" key={`${move.year}-${move.title}`}>
                <div className="dawkins-move-marker"><span>{index + 1}</span></div>
                <div className="dawkins-move-year">{move.year}</div>
                <div className="dawkins-move-copy">
                  <h3>{move.title}</h3>
                  <p>{move.text}</p>
                  <a href={move.link} target="_blank" rel="noreferrer">{move.linkLabel} ↗</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dawkins-section dawkins-video-section">
          <div className="dawkins-section-heading">
            <span>HEAR IT DIRECTLY</span>
            <h2>Press conferences and media availability.</h2>
          </div>
          <div className="dawkins-video-grid">
            {videos.map((video) => (
              <article className="dawkins-video-card" key={video.url}>
                <div className="dawkins-video-preview">
                  <span className="dawkins-play-button">▶</span>
                  <span>{video.duration}</span>
                </div>
                <div>
                  <h3>{video.title}</h3>
                  <p>Official Washington Wizards video</p>
                  <a href={video.url} target="_blank" rel="noreferrer">Watch video ↗</a>
                </div>
              </article>
            ))}
          </div>
          <p className="dawkins-video-note">
            These official NBA video pages are linked instead of copied or re-hosted. Some NBA video players block third-party embedding.
          </p>
        </section>

        <section className="dawkins-comment-section">
          <div>
            <p className="dawkins-kicker">YOUR TAKE</p>
            <h2>What move or part of the vision stands out to you?</h2>
            <p>Leave a comment, suggest a missing transaction, or share what you think the next step should be.</p>
          </div>
          <button type="button" onClick={() => setFeedbackOpen(true)}>Add a Comment</button>
        </section>
      </main>

      <footer className="dawkins-footer">
        <p><strong>Unofficial fan project.</strong> Not affiliated with, endorsed by, or sponsored by Will Dawkins, the NBA, or the Washington Wizards.</p>
        <a href="/">District Basketball Lab</a>
      </footer>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} defaultCategory="Will Dawkins Appreciation" />
    </div>
  )
}
