import { Trace } from './trace'
import { Explosion } from './explosion'
import { randomFloat, randomInteger } from './utils'

type HTMLContainer = Element | HTMLElement

interface FireworksOptions {
  hue?: MinMaxOptions
  speed?: number
  acceleration?: number
  friction?: number
  gravity?: number
  particles?: number
  trace?: number
  explosion?: number
  autoresize?: boolean
  mouse?: MouseOptions
  boundaries?: BoundariesOptions
  sound?: SoundOptions
  delay?: MinMaxOptions
}

interface MouseOptions {
  click: boolean
  move: boolean
  max: number
}

interface BoundariesOptions {
  top: number
  bottom: number
  left: number
  right: number
}

interface SoundOptions {
  enable: boolean
  files: string[]
  min: number
  max: number
}

interface MinMaxOptions {
  min: number
  max: number
}

interface Sizes {
  width?: number
  height?: number
}

declare const version: string

export class Fireworks {
  private _container: HTMLContainer
  private _canvas: HTMLCanvasElement
  private _ctx: CanvasRenderingContext2D
  private _width: number
  private _height: number

  private _hue: MinMaxOptions
  private _speed: number
  private _acceleration: number
  private _friction: number
  private _gravity: number
  private _particleCount: number
  private _traceLength: number
  private _explosionLength: number
  private _autoresize: boolean
  private _boundaries: BoundariesOptions

  private _mouse: MouseOptions = {
    click: false,
    move: false,
    max: 5
  }

  private _sound: SoundOptions = {
    enable: false,
    files: [
      'explosion0.mp3',
      'explosion1.mp3',
      'explosion2.mp3'
    ],
    min: 1,
    max: 2
  }

  private _delay: MinMaxOptions = {
    min: 15,
    max: 30
  }

  private _tick = 0
  private _version = version
  private _running = false
  private _m = false
  private _mx: number
  private _my: number
  private _ds: number

  private _traces: Trace[] = []
  private _explosions: Explosion[] = []

  constructor(container: HTMLContainer, {
    hue,
    speed,
    acceleration,
    friction,
    gravity,
    particles,
    trace,
    explosion,
    autoresize,
    mouse,
    boundaries,
    sound,
    delay
  }: FireworksOptions) {
    this._container = container
    this._canvas = document.createElement('canvas')
    this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D
    this._container.appendChild(this._canvas)

    this.updateSize()
    this.updateBoundaries(boundaries || {
      top: 50,
      bottom: 0,
      left: 50,
      right: 0
    })

    this._hue = hue || { min: 0, max: 360 }
    this._speed = speed || 2
    this._acceleration = acceleration || 1.05
    this._friction = friction || 0.95
    this._gravity = gravity || 1.5
    this._particleCount = particles || 50
    this._traceLength = trace || 3
    this._explosionLength = explosion || 5
    this._autoresize = autoresize ?? true

    this._mouse = { ...this._mouse, ...mouse }
    this._sound = { ...this._sound, ...sound }
    this._delay = { ...this._delay, ...delay }

    if (this._autoresize) {
      window.addEventListener('resize', () => {
        this.updateSize()
      })
    }

    this._canvas.addEventListener('mousedown', (e) => this.useMouse(e, this._mouse.click))
    this._canvas.addEventListener('mouseup', (e) => this.useMouse(e, false))
    this._canvas.addEventListener('mousemove', (e) => this.useMouse(e, this._m))
  }

  get isRunning(): boolean {
    return this._running
  }

  get version(): string {
    return this._version
  }

  start(): void {
    if (this._running) return

    this._running = true
    this.clear()
    this.render()
  }

  stop(): void {
    this._running = false
    this.clear()
  }

  pause(): void {
    this._running = !this._running

    if (this._running) {
      this.render()
    }
  }

  clear(): void {
    if (!this._ctx) return

    this._traces = []
    this._explosions = []
    this._ctx.clearRect(0, 0, this._width, this._height)
  }

  updateSize({
    width = this._container.clientWidth,
    height = this._container.clientHeight
  }: Sizes = {}): void {
    this._width = width
    this._height = height

    this._canvas.width = width
    this._canvas.height = height

    this.updateBoundaries({
      right: width,
      bottom: height
    })
  }

  updateBoundaries(boundaries: Partial<BoundariesOptions>): void {
    this._boundaries = { ...this._boundaries, ...boundaries }
  }

  private useMouse(event: MouseEvent, is: boolean): void {
    if (this._mouse.click || this._mouse.move) {
      this._mx = event.pageX - this._canvas.offsetLeft
      this._my = event.pageY - this._canvas.offsetTop
      this._m = is
    }
  }

  private playSound(): void {
    if (this._sound.enable && this._sound.files.length > 0) {
      const index = randomInteger(0, this._sound.files.length - 1)
      const volume = randomFloat(this._sound.min / 10, this._sound.max / 10)
      const audio = new Audio(this._sound.files[index])

      audio.volume = volume
      audio.play()
    }
  }

  private render(): void {
    if (!this._ctx || !this._running) return

    requestAnimationFrame(() => this.render())

    this._ctx.globalCompositeOperation = 'destination-out'
    this._ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this._ctx.fillRect(0, 0, this._width, this._height)
    this._ctx.globalCompositeOperation = 'lighter'

    this.initTrace()
    this.drawTrace()
    this.drawExplosion()

    this._tick++
  }

  private initTrace() {
    this._ds = randomInteger(this._delay.min, this._delay.max)

    if (
      this._ds * 2 < this._tick ||
      this._m && this._mouse.max > this._traces.length
    ) {
      this._traces.push(new Trace(
        this._width * 0.5,
        this._height,
        this._m || this._mouse.move ? this._mx : randomInteger(this._boundaries.left, this._boundaries.right - 50),
        this._m || this._mouse.move ? this._my : randomInteger(this._boundaries.top, this._boundaries.bottom * 0.5),
        this._ctx,
        randomInteger(this._hue.min, this._hue.max),
        this._speed,
        this._acceleration,
        this._traceLength
      ))

      this._tick = 0
    }
  }

  private drawTrace() {
    let length = this._traces.length

    while (length--) {
      this._traces[length].draw()
      this._traces[length].update((x: number, y: number, hue: number) => {
        this.playSound()
        this.initExplosion(x, y, hue)
        this._traces.splice(length, 1)
      })
    }
  }

  private initExplosion(x: number, y: number, hue: number) {
    let count = this._particleCount

    while (count--) {
      this._explosions.push(new Explosion(
        x,
        y,
        this._ctx,
        hue,
        this._friction,
        this._gravity,
        this._explosionLength
      ))
    }
  }

  private drawExplosion() {
    let length = this._explosions.length

    while (length--) {
      this._explosions[length].draw()
      this._explosions[length].update(() => {
        this._explosions.splice(length, 1)
      })
    }
  }
}