import PlayerCard from './PlayerCard'

const FORMATIONS = {
  '2-1-2': {
    PG: { x: 30, y: 17 },
    SG: { x: 70, y: 17 },
    SF: { x: 50, y: 49 },
    PF: { x: 27, y: 80 },
    C: { x: 73, y: 80 },
  },
  '2-2-1': {
    PG: { x: 30, y: 17 },
    SG: { x: 70, y: 17 },
    SF: { x: 25, y: 49 },
    PF: { x: 75, y: 49 },
    C: { x: 50, y: 80 },
  },
  '1-2-2': {
    PG: { x: 50, y: 15 },
    SG: { x: 23, y: 47 },
    SF: { x: 77, y: 47 },
    PF: { x: 28, y: 80 },
    C: { x: 72, y: 80 },
  },
  '1-3-1': {
    PG: { x: 50, y: 13 },
    SG: { x: 15, y: 49 },
    SF: { x: 50, y: 49 },
    PF: { x: 85, y: 49 },
    C: { x: 50, y: 84 },
  },
}

export default function Court({
  starters,
  formation,
  statMode,
  onFormationChange,
  onDropPlayer,
  onRemove,
  onOpenPicker,
  onSelectPlayer,
}) {
  const safeFormation = FORMATIONS[formation]
    ? formation
    : '2-1-2'

  const positions = FORMATIONS[safeFormation]

  return (
    <section className="mockup-court-panel">
      <div className="mockup-court-header">
        <h2>Starters</h2>

        <div className="mockup-formation-tabs">
          {Object.keys(FORMATIONS).map((value) => (
            <button
              key={value}
              className={
                safeFormation === value
                  ? 'active'
                  : ''
              }
              onClick={() =>
                onFormationChange(value)
              }
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`mockup-court-stage formation-${safeFormation}`}
        onDragOver={(event) =>
          event.preventDefault()
        }
        onDrop={(event) => {
          const id = Number(
            event.dataTransfer.getData(
              'player-id',
            ),
          )

          if (id) onDropPlayer(id)
        }}
      >
        {Object.entries(starters).map(
          ([slot, player]) => {
            const position = positions[slot]

            return (
              <div
                key={slot}
                className="mockup-court-slot"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={(event) => {
                  event.stopPropagation()

                  const id = Number(
                    event.dataTransfer.getData(
                      'player-id',
                    ),
                  )

                  if (id) {
                    onDropPlayer(id, slot)
                  }
                }}
              >
                {player ? (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    statMode={statMode}
                    onRemove={() =>
                      onRemove(slot)
                    }
                    onSelect={onSelectPlayer}
                  />
                ) : (
                  <button
                    className="mockup-plus"
                    onClick={(event) =>
                      onOpenPicker(
                        {
                          type: 'starter',
                          slot,
                        },
                        event.currentTarget
                          .getBoundingClientRect(),
                      )
                    }
                  >
                    +
                  </button>
                )}
              </div>
            )
          },
        )}
      </div>
    </section>
  )
}
