import type { GameCanvas } from './GameCanvas.ts'
import { Micro } from './Micro.ts'

/*
 * Touch controls overlay (mobile).
 * Left thumb — balance (lean back / lean forward), right thumb — gas / brake.
 * OK is only shown in menus; pause button is only shown during gameplay.
 * Buttons call GameCanvas key handlers directly with game key codes:
 * 1 = up/gas, 2 = lean back, 5 = lean forward, 6 = down/brake, 8 = select.
 */
export function initTouchControls(gameCanvas: GameCanvas, render: () => void): void {
  const layer = document.createElement('div')
  layer.className = 'touch-layer'
  layer.innerHTML = `
    <div class="tbtn t-lean-l" data-k="2">&#8630;<span>НАЗАД</span></div>
    <div class="tbtn t-lean-r" data-k="5">&#8631;<span>ВПЕРЁД</span></div>
    <div class="tbtn t-gas"    data-k="1">&#9650;<span>ГАЗ</span></div>
    <div class="tbtn t-brake"  data-k="6">&#9660;<span>ТОРМОЗ</span></div>
    <div class="tbtn t-ok"     data-k="8">OK</div>
    <div class="tbtn t-pause"  data-k="esc">&#10074;&#10074;</div>
  `
  document.body.appendChild(layer)

  const style = document.createElement('style')
  style.textContent = `
    .touch-layer{ position:fixed; inset:0; pointer-events:none; z-index:50;
      font-family:"Trebuchet MS","Segoe UI",sans-serif; user-select:none;
      -webkit-user-select:none; display:none; }
    @media (pointer:coarse){ .touch-layer{ display:block; } }
    .tbtn{ position:absolute; width:23vmin; height:23vmin; min-width:72px; min-height:72px;
      max-width:126px; max-height:126px; border-radius:50%;
      background:radial-gradient(circle at 34% 30%, rgba(80,84,96,.92), rgba(34,37,46,.92) 68%);
      border:2px solid rgba(255,255,255,.30);
      box-shadow:0 6px 18px rgba(0,0,0,.35), inset 0 2px 3px rgba(255,255,255,.28), inset 0 -3px 6px rgba(0,0,0,.35);
      color:#f4f6fa; display:flex; align-items:center; justify-content:center;
      font-size:clamp(26px,7.5vmin,42px); pointer-events:auto; touch-action:none;
      transition:transform .06s ease, background .06s; }
    .tbtn.pressed{ transform:scale(.92);
      background:radial-gradient(circle at 34% 30%, rgba(90,160,255,.95), rgba(28,80,170,.95) 70%);
      border-color:rgba(190,225,255,.7);
      box-shadow:0 3px 10px rgba(30,90,200,.5), inset 0 2px 3px rgba(255,255,255,.35); }
    .tbtn span{ position:absolute; bottom:-2.0em; left:50%; transform:translateX(-50%);
      font-size:clamp(10px,2.6vmin,13px); font-weight:bold; letter-spacing:1.5px;
      color:rgba(25,20,8,.78); text-shadow:0 1px 0 rgba(255,255,255,.5); }
    /* левая рука — баланс дугой (ВПЕРЁД чуть выше, под естественный ход большого пальца) */
    .t-lean-l{ left:4vmin;  bottom:5vmin; }
    .t-lean-r{ left:29vmin; bottom:9vmin; }
    /* правая рука — тормоз в углу, газ над ним дугой к центру */
    .t-brake{  right:4vmin; bottom:5vmin; }
    .t-gas{    right:6vmin; bottom:31vmin; }
    .t-ok{ left:50%; transform:translateX(-50%); bottom:7vmin;
      width:26vmin; height:26vmin; max-width:140px; max-height:140px;
      font-size:clamp(20px,5.5vmin,30px); font-weight:bold; letter-spacing:1px;
      background:radial-gradient(circle at 34% 30%, rgba(95,175,90,.95), rgba(35,105,45,.95) 70%);
      border-color:rgba(200,255,200,.45); }
    .t-ok.pressed{ transform:translateX(-50%) scale(.92); }
    .t-pause{ top:2.5vmin; right:2.5vmin; width:13vmin; height:13vmin;
      min-width:50px; min-height:50px; max-width:70px; max-height:70px;
      border-radius:26%; font-size:clamp(15px,3.8vmin,20px); }
    .touch-layer.in-game .t-ok{ display:none; }
    .touch-layer:not(.in-game) .t-pause{ display:none; }
    /* низкий горизонтальный экран — компактнее, чтобы не перекрывать трассу */
    @media (max-height:480px){
      .tbtn{ width:19vmin; height:19vmin; min-width:64px; min-height:64px; }
      .t-gas{ bottom:27vmin; }
      .t-ok{ width:22vmin; height:22vmin; }
    }
  `
  document.head.appendChild(style)

  const press = (el: Element, k: string): void => {
    el.classList.add('pressed')
    if (k === 'esc') {
      if (Micro.isInGameMenu) {
        gameCanvas.handleBackAction()
      } else if (gameCanvas.hasMenuButton()) {
        gameCanvas.openPauseMenu()
      }
      render()
      return
    }
    gameCanvas.keyPressed(Number(k))
    render()
  }
  const release = (el: Element, k: string): void => {
    el.classList.remove('pressed')
    if (k !== 'esc') {
      gameCanvas.keyReleased(Number(k))
    }
  }

  for (const el of layer.querySelectorAll('.tbtn')) {
    const k = (el as HTMLElement).dataset.k ?? ''
    const down = (e: Event): void => { e.preventDefault(); press(el, k) }
    const up = (e: Event): void => { e.preventDefault(); release(el, k) }
    el.addEventListener('touchstart', down, { passive: false })
    el.addEventListener('touchend', up, { passive: false })
    el.addEventListener('touchcancel', up, { passive: false })
    el.addEventListener('mousedown', down)
    el.addEventListener('mouseup', up)
    el.addEventListener('mouseleave', up)
  }

  // menu/game visibility sync (OK in menus, pause during gameplay)
  window.setInterval(() => {
    layer.classList.toggle('in-game', !Micro.isInGameMenu)
  }, 150)
}
