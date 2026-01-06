export enum PowerUpType {
    NONE,
    BIG_BLAST,
    RAIL_GUN
}

export const Config = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    FPS: 60,
    GRAVITY: 0.05,
    MISSILE_SPEED: 1,
    PLAYER_MISSILE_SPEED: 10,
    EXPLOSION_RADIUS: 50,
    EXPLOSION_GROWTH_RATE: 1,
    COLORS: {
        BACKGROUND: '#111',
        CITY: '#00f',
        SILO: '#0f0',
        MISSILE_ENEMY: '#f00',
        MISSILE_PLAYER: '#0f0',
        EXPLOSION: '#ffa500',
        TEXT: '#fff'
    }
}
