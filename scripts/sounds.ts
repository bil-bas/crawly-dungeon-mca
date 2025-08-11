namespace sounds {
    export const error =  music.melodyPlayable(music.buzzer)
    export const teleport = music.melodyPlayable(music.beamUp)
    export const destroyCrate = music.melodyPlayable(music.bigCrash)
    export const unlock = music.melodyPlayable(music.knock)
    export const melee = music.melodyPlayable(music.knock)
    export const stairs = music.melodyPlayable(music.jumpDown)
    export const enemyDeath = music.melodyPlayable(music.bigCrash)
    export const useItemSound = music.melodyPlayable(music.knock)
    export const spellFail = music.melodyPlayable(music.knock)
    export const spellCast = music.melodyPlayable(music.pewPew)

    export function play(sound: music.Playable) {
        music.play(sound, music.PlaybackMode.InBackground)
    }
}