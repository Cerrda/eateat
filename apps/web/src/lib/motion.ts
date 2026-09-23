import { nextTick, onMounted, onUnmounted, type ShallowRef } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

export function registerGsap() {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger)
  registered = true
}

export function useEnter(root: Readonly<ShallowRef<HTMLElement | null>>) {
  let media: gsap.MatchMedia | undefined

  onMounted(() => {
    const scope = root.value
    if (!scope) return
    media = gsap.matchMedia()
    media.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        ok: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        if (context.conditions?.reduce) return
        const timeline = gsap.timeline({ defaults: { duration: 0.55, ease: 'power2.out' } })
        const titles = scope.querySelectorAll('.enter-title')
        const scribbles = scope.querySelectorAll('.scribble')
        const items = scope.querySelectorAll('.enter-item')
        if (titles.length) timeline.from(titles, { autoAlpha: 0, y: 16, stagger: 0.05 })
        if (scribbles.length) {
          timeline.from(
            scribbles,
            { scaleX: 0, rotation: -8, transformOrigin: 'left center', duration: 0.4 },
            '<0.12',
          )
        }
        if (items.length) timeline.from(items, { autoAlpha: 0, y: 20, stagger: 0.06 }, '-=0.28')
      },
      scope,
    )
  })

  onUnmounted(() => media?.revert())
}

export function useListReveal(root: Readonly<ShallowRef<HTMLElement | null>>, selector: string) {
  let media: gsap.MatchMedia | undefined

  onMounted(async () => {
    await nextTick()
    const scope = root.value
    if (!scope) return
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const seen = new WeakSet<Element>()
      const triggers: ScrollTrigger[] = []
      const scan = () => {
        const fresh = Array.from(scope.querySelectorAll(selector)).filter((element) => !seen.has(element))
        if (fresh.length === 0) return
        fresh.forEach((element) => seen.add(element))
        gsap.set(fresh, { autoAlpha: 0, y: 22 })
        triggers.push(
          ...ScrollTrigger.batch(fresh, {
            start: 'top 90%',
            once: true,
            onEnter: (batch) => {
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.06,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: 'auto',
              })
            },
          }),
        )
        ScrollTrigger.refresh()
      }
      scan()
      const observer = new MutationObserver(() => scan())
      observer.observe(scope, { childList: true, subtree: true })
      return () => {
        observer.disconnect()
        triggers.forEach((trigger) => trigger.kill())
      }
    })
  })

  onUnmounted(() => media?.revert())
}

export function usePress(root: Readonly<ShallowRef<HTMLElement | null>>) {
  let media: gsap.MatchMedia | undefined

  onMounted(() => {
    const scope = root.value
    if (!scope) return
    media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const press = (event: Event) => {
        const target = (event.target as HTMLElement | null)?.closest('[data-press]')
        if (!target || !scope.contains(target)) return
        gsap.to(target, {
          scale: 0.97,
          duration: 0.12,
          ease: 'power1.out',
          overwrite: 'auto',
          transformOrigin: 'center center',
        })
      }
      const release = () => {
        gsap.to(scope.querySelectorAll('[data-press]'), {
          scale: 1,
          duration: 0.18,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
      scope.addEventListener('pointerdown', press)
      window.addEventListener('pointerup', release)
      return () => {
        scope.removeEventListener('pointerdown', press)
        window.removeEventListener('pointerup', release)
      }
    })
  })

  onUnmounted(() => media?.revert())
}
