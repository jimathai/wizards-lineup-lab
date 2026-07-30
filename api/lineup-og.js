import React from 'react'
import { ImageResponse } from '@vercel/og'
import { getSharedLineupMeta } from './_sharedLineupMeta.js'

const h = React.createElement

const playerCard = (player, index) =>
  h(
    'div',
    {
      key: player.id || index,
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '196px',
        height: '390px',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'rgba(8, 20, 38, 0.94)',
        border: '2px solid rgba(255,255,255,0.16)',
        boxShadow: '0 18px 45px rgba(0,0,0,0.34)',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          width: '196px',
          height: '260px',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #27476e 0%, #0c1b30 100%)',
        },
      },
      player.image
        ? h('img', {
            src: player.image,
            width: 196,
            height: 260,
            style: {
              width: '196px',
              height: '260px',
              objectFit: 'cover',
              objectPosition: 'center top',
            },
          })
        : null,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 16px',
          gap: '8px',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '13px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#ff5168',
          },
        },
        `${player.position || 'Player'}${player.number ? `  #${player.number}` : ''}`,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '23px',
            lineHeight: 1.05,
            fontWeight: 800,
            color: '#ffffff',
          },
        },
        player.name,
      ),
    ),
  )

export default async function handler(request) {
  try {
    const url = new URL(request.url)
    const meta = await getSharedLineupMeta({
      lineupId: url.searchParams.get('lineupId'),
      ownerId: url.searchParams.get('ownerId'),
      teamId: url.searchParams.get('teamId'),
    })

    if (!meta) {
      return new Response('Lineup not found', { status: 404 })
    }

    const primary = meta.team?.primary_color || '#002B5C'
    const secondary = meta.team?.secondary_color || '#E31837'
    const heading = meta.isCollection ? 'SHARED LINEUPS' : 'SHARED LINEUP'
    const title = meta.isCollection ? `${meta.teamName} Lineups` : meta.name

    return new ImageResponse(
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
            padding: '50px 56px 42px',
            background: `linear-gradient(135deg, ${primary} 0%, #07111f 56%, ${secondary} 145%)`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
          },
        },
        h(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '28px',
            },
          },
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  color: '#ff5168',
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '4px',
                },
              },
              heading,
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  maxWidth: '850px',
                  fontSize: '42px',
                  fontWeight: 900,
                  lineHeight: 1,
                },
              },
              title,
            ),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                fontWeight: 900,
                fontSize: '28px',
                letterSpacing: '-1px',
              },
            },
            'DISTRICT GM',
            h(
              'span',
              {
                style: {
                  display: 'flex',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: 'rgba(255,255,255,0.65)',
                },
              },
              'FAN-BUILT LINEUPS',
            ),
          ),
        ),
        h(
          'div',
          {
            style: {
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
            },
          },
          ...meta.players.slice(0, 5).map(playerCard),
        ),
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
    return new Response(
      `Unable to create lineup preview: ${error?.message || 'Unknown error'}`,
      { status: 500 },
    )
  }
}
