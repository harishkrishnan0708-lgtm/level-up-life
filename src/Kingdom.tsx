import { useState } from 'react'
import './Kingdom.css'
import ItemSprite from './ItemSprite'
import type { Hero } from './hero'
import { FOOD_STORE_LIMIT, KINGDOM_SIZE, KINGDOM_TILE_COUNT, buildingBonuses, foodReady, placedBuildings, type PlacedBuilding } from './wares'

/** The road from the gate to the keep; never built on. */
const ROAD_TILES = new Set(['3,6', '3,4', '3,2'])

interface KingdomProps {
  hero: Hero
  today: string
  onVisitMerchant: () => void
  onCollectFood: () => void
}

function Kingdom({ hero, today, onVisitMerchant, onCollectFood }: KingdomProps) {
  const [selected, setSelected] = useState<PlacedBuilding | null>(null)
  const buildings = placedBuildings(hero.holdings)
  const byTile = new Map(buildings.map((building) => [building.tile.join(','), building]))
  const kingdomValue = buildings.reduce((total, building) => total + building.item.price, 0)
  const food = foodReady(hero.holdings, hero.streak.history, today)

  return (
    <div className="kingdom">
      <header className="kingdom-header">
        <h2>{hero.name}'s Kingdom</h2>
        <p className="kingdom-stats">
          {buildings.length} / {KINGDOM_TILE_COUNT} built · worth {kingdomValue} coins · food {hero.holdings.food} / {FOOD_STORE_LIMIT}
        </p>
      </header>

      {food > 0 && (
        <div className="food-ready">
          <span>Your kingdom made {food} food. Your next siege takes up to 5.</span>
          <button type="button" className="button-primary" data-sfx onClick={onCollectFood}>
            Collect
          </button>
        </div>
      )}

      <div className="kingdom-map" role="grid" aria-label="Kingdom map">
        {Array.from({ length: KINGDOM_SIZE }, (_, row) => (
          <div key={row} className="kingdom-row" role="row">
            {Array.from({ length: KINGDOM_SIZE }, (_, column) => {
              const key = `${column},${row}`
              const building = byTile.get(key)
              const isEdge = row === 0 || column === 0 || row === KINGDOM_SIZE - 1 || column === KINGDOM_SIZE - 1
              const tileClass = [
                'tile',
                isEdge ? 'tile-edge' : '',
                ROAD_TILES.has(key) ? 'tile-road' : '',
                building ? `tile-built icon-${building.item.id}` : '',
                building && building === selected ? 'tile-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return building ? (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={tileClass}
                  aria-label={building.item.name}
                  onClick={() => setSelected(building)}
                >
                  <ItemSprite itemId={building.item.id} className="tile-sprite" />
                </button>
              ) : (
                <div key={key} role="gridcell" className={tileClass} aria-label={key === '3,6' ? 'Gate' : 'Empty land'}>
                  {key === '3,6' && <span className="gate" aria-hidden="true" />}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {buildings.length === 0 ? (
        <div className="kingdom-empty">
          <p>Your land is bare. Every quest you finish earns coins; spend them with the merchant to raise your kingdom.</p>
          <button type="button" className="button-primary" onClick={onVisitMerchant}>
            Visit the merchant
          </button>
        </div>
      ) : (
        <p className="kingdom-caption" aria-live="polite">
          {selected ? (
            <>
              <strong>{selected.item.name}</strong>: {selected.item.description}
              <span className="kingdom-bonus">Bonus: {buildingBonuses(selected.item).join('. ') || 'none, this one is just for show'}.</span>
            </>
          ) : (
            'Tap a building to inspect it.'
          )}
        </p>
      )}
    </div>
  )
}

export default Kingdom
