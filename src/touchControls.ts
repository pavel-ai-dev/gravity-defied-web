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
    .tbtn{ position:absolute; width:22vmin; height:22vmin; min-width:70px; min-height:70px;
      max-width:120px; max-height:120px; border-radius:50%;
      background:radial-gradient(circle at 34% 30%, rgba(80,84,96,.92), rgba(34,37,46,.92) 68%);
      border:2px solid rgba(255,255,255,.30);
      box-shadow:0 6px 18px rgba(0,0,0,.35), inset 0 2px 3px rgba(255,255,255,.28), inset 0 -3px 6px rgba(0,0,0,.35);
      color:#f4f6fa; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.1em;
      font-size:clamp(22px,6vmin,34px); line-height:1; pointer-events:auto; touch-action:none;
      transition:transform .06s ease, background .06s; }
    .tbtn.pressed{ transform:scale(.92);
      background:radial-gradient(circle at 34% 30%, rgba(90,160,255,.95), rgba(28,80,170,.95) 70%);
      border-color:rgba(190,225,255,.7);
      box-shadow:0 3px 10px rgba(30,90,200,.5), inset 0 2px 3px rgba(255,255,255,.35); }
    .tbtn span{ font-size:clamp(9px,2.2vmin,12px); font-weight:bold; letter-spacing:1px;
      color:rgba(244,246,250,.92); text-shadow:0 1px 2px rgba(0,0,0,.5); }
    /* РОВНАЯ раскладка: слева пара баланса в один ряд, справа газ над тормозом по одной вертикали */
    .t-lean-l{ left:5vmin;  bottom:7vmin; }
    .t-lean-r{ left:30vmin; bottom:7vmin; }
    .t-brake{  right:5vmin; bottom:7vmin; }
    .t-gas{    right:5vmin; bottom:34vmin; }
    .t-ok{ left:50%; transform:translateX(-50%); bottom:7vmin;
      width:24vmin; height:24vmin; max-width:132px; max-height:132px;
      font-size:clamp(20px,5.5vmin,30px); font-weight:bold; letter-spacing:1px;
      background:radial-gradient(circle at 34% 30%, rgba(95,175,90,.95), rgba(35,105,45,.95) 70%);
      border-color:rgba(200,255,200,.45); }
    .t-ok.pressed{ transform:translateX(-50%) scale(.92); }
    .t-pause{ top:2.5vmin; right:2.5vmin; width:13vmin; height:13vmin;
      min-width:50px; min-height:50px; max-width:70px; max-height:70px;
      border-radius:26%; font-size:clamp(15px,3.8vmin,20px); }
    .touch-layer.in-game .t-ok{ display:none; }
    .touch-layer:not(.in-game) .t-pause{ display:none; }
    /* в меню баланс не нужен (навигация газом/тормозом), освобождаем центр под OK */
    .touch-layer:not(.in-game) .t-lean-l,
    .touch-layer:not(.in-game) .t-lean-r{ display:none; }
    /* низкий горизонтальный экран — компактнее, чтобы не перекрывать трассу */
    @media (max-height:480px){
      .tbtn{ width:17vmin; height:17vmin; min-width:60px; min-height:60px; }
      .t-lean-r{ left:26vmin; }
      .t-gas{ bottom:29vmin; }
      .t-ok{ width:19vmin; height:19vmin; }
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
