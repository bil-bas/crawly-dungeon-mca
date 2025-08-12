function repeat(str: string, count: number): string {
    let array = []
    for (let i = 0; i < count; )
        array[i++] = str
    return array.join('')
}

function padStart(text: string, length: number): string {
    text = repeat(" ", length - text.length) + text
    return text
}

function after(time: number, thenDo: () => void) {
    setTimeout(thenDo, time)
}
