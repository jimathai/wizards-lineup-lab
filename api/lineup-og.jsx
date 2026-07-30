import { ImageResponse } from '@vercel/og'
import { getSharedLineupMeta } from './_sharedLineupMeta.js'

const PlayerCard = ({ player }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      width: 196,
      height: 390,
      borderRadius: 24,
      overflow: 'hidden',
      background: 'rgba(8, 20, 38, 0.94)',
      border: '2px solid rgba(255,255,255,0.16)',
      boxShadow: '0 18px 45px rgba(0,0,0,0.34)',
    }}
  >
    <div
      style={{
        display: 'flex',
        width: 196,
        height: 260,
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #27476e 0%, #0c1b30 100%)',
      }}
    >
      {player.image ? (
        <img
          src={player.image}
          width="196"
          height="260"
          style={{
            width: 196,
            height: 260,
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      ) : null}
    </div>

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 16px',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 13,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#ff5168',
        }}
      >
        {`${player.position || 'Player'}${player.number ? `  #${player.number}` : ''}`}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 23,
          lineHeight: 1.05,
          fontWeight: 800,
          color: '#ffffff',
        }}
      >
        {player.name}
      </div>
    </div>
  </div>
)

export default async function handler(request) {
  try {
    const url = new URL(request.url)
    const meta = await getSharedLineupMeta({
      lineupId: url.searchParams.get('lineupId'),
      ownerId: url.searchParams.get('ownerId'),
      teamId: url.searchParams.get('teamId'),
    })

    if (!meta) return new Response('Lineup not found', { status: 404 })

    const primary = meta.team?.primary_color || '#002B5C'
    const secondary = meta.team?.secondary_color || '#E31837'
    const kicker = meta.isCollection ? 'SHARED LINEUPS' : 'SHARED LINEUP'
    const title = meta.isCollection ? `${meta.teamName} Lineups` : meta.name

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: '50px 56px 42px',
            background: `linear-gradient(135deg, ${primary} 0%, #07111f 56%, ${secondary} 145%)`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 28,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  color: '#ff5168',
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 4,
                }}
              >
                {kicker}
              </div>
              <div
                style={{
                  display: 'flex',
                  maxWidth: 850,
                  fontSize: 42,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {title}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: -1,
              }}
            >
              DISTRICT GM
              <span
                style={{
                  display: 'flex',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                FAN-BUILT LINEUPS
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {meta.players.slice(0, 5).map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      },
    )
  } catch (error) {
    console.error('Lineup OG image failed:', error)
    return new Response('Unable to create lineup preview', { status: 500 })
  }
}
