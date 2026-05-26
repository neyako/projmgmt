"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DependencyList,
  type HTMLAttributes,
  type MutableRefObject,
  type Ref,
  type RefObject,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

type EntrancePreset = "boot" | "panel" | "page" | "toast";
export type TerminalMotionPreset = EntrancePreset | "crt";

gsap.registerPlugin(useGSAP);

const CLEAR_TRANSFORM_PROPS = "transform,opacity,visibility,willChange";
const MOTION_QUERY = {
  all: "all",
  reduceMotion: "(prefers-reduced-motion: reduce)",
};

const ENTRANCE_PRESETS: Record<
  EntrancePreset,
  {
    from: gsap.TweenVars;
    to: gsap.TweenVars;
    settle: gsap.TweenVars;
    origin: string;
  }
> = {
  boot: {
    from: { autoAlpha: 0, y: 18, scale: 0.985, skewX: -0.5 },
    to: { autoAlpha: 1, y: 0, scale: 1, skewX: 0, duration: 0.42, ease: "power3.out" },
    settle: { y: -2, duration: 0.07, ease: "steps(2)" },
    origin: "50% 0%",
  },
  panel: {
    from: { autoAlpha: 0, y: 18, scale: 0.965 },
    to: { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "power3.out" },
    settle: { y: -1, duration: 0.06, ease: "steps(2)" },
    origin: "50% 0%",
  },
  page: {
    from: { autoAlpha: 0, y: 14, scale: 0.99 },
    to: { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "power3.out" },
    settle: { y: -1, duration: 0.05, ease: "steps(2)" },
    origin: "50% 0%",
  },
  toast: {
    from: { autoAlpha: 0, x: 22, y: -4, scale: 0.97 },
    to: { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.32, ease: "power3.out" },
    settle: { x: -2, duration: 0.06, ease: "steps(2)" },
    origin: "100% 0%",
  },
};

type MotionBlockProps = HTMLAttributes<HTMLDivElement> & {
  preset?: TerminalMotionPreset;
  delayMs?: number;
  disabled?: boolean;
};

type TerminalExitOptions = {
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
  ease?: string;
};

function assignRef(ref: Ref<HTMLDivElement> | undefined, node: HTMLDivElement | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(node);
    return;
  }
  (ref as MutableRefObject<HTMLDivElement | null>).current = node;
}

export const MotionBlock = forwardRef<HTMLDivElement, MotionBlockProps>(
  (
    {
      preset = "boot",
      delayMs = 0,
      disabled = false,
      className,
      style,
      ...props
    },
    forwardedRef
  ) => {
    const localRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState(preset === "crt" || disabled);

    useGSAP(() => {
      const el = localRef.current;
      if (!el || disabled) {
        setIsReady(true);
        if (el) {
          gsap.set(el, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            skewX: 0,
            clearProps: CLEAR_TRANSFORM_PROPS,
          });
        }
        return;
      }

      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, (context) => {
        const reduceMotion = Boolean(context.conditions?.reduceMotion);
        setIsReady(true);
        gsap.killTweensOf(el);

        if (reduceMotion) {
          gsap.set(el, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            skewX: 0,
            clearProps: CLEAR_TRANSFORM_PROPS,
          });
          return;
        }

        if (preset === "crt") {
          gsap.timeline({ repeat: -1, yoyo: true })
            .set(el, { autoAlpha: 1, willChange: "opacity" })
            .to(el, {
              autoAlpha: 0.965,
              duration: 7,
              ease: "steps(2)",
              overwrite: "auto",
            });
          return;
        }

        const config = ENTRANCE_PRESETS[preset];
        gsap.timeline({
          delay: delayMs / 1000,
          defaults: { overwrite: "auto" },
        })
          .addLabel("boot", 0)
          .set(
            el,
            {
              transformOrigin: config.origin,
              willChange: "transform, opacity",
            },
            "boot"
          )
          .fromTo(
            el,
            config.from,
            {
              ...config.to,
              clearProps: "visibility",
            },
            "boot"
          )
          .to(el, config.settle, ">-0.03")
          .to(
            el,
            {
              x: 0,
              y: 0,
              scale: 1,
              skewX: 0,
              duration: 0.1,
              ease: "power2.out",
              clearProps: CLEAR_TRANSFORM_PROPS,
            },
            ">"
          );
      });

      return () => mm.revert();
    }, {
      scope: localRef,
      dependencies: [preset, delayMs, disabled],
      revertOnUpdate: true,
    });

    const hiddenStyle: CSSProperties =
      !isReady && !disabled && preset !== "crt" ? { visibility: "hidden" } : {};

    return (
      <div
        ref={(node) => {
          localRef.current = node;
          assignRef(forwardedRef, node);
        }}
        className={cn(className)}
        style={{ ...hiddenStyle, ...style }}
        {...props}
      />
    );
  }
);

MotionBlock.displayName = "MotionBlock";

type TerminalStaggerOptions = {
  selector?: string;
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  disabled?: boolean;
  maxAnimated?: number;
};

export function useTerminalStagger<T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: DependencyList,
  {
    selector = "[data-motion-item]",
    x = 0,
    y = 14,
    scale = 0.985,
    duration = 0.34,
    stagger = 0.035,
    delay = 0,
    disabled = false,
    maxAnimated = 80,
  }: TerminalStaggerOptions = {}
) {
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (items.length === 0) return;

    const animatedItems = items.slice(0, maxAnimated);
    const skippedItems = items.slice(maxAnimated);
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, (context) => {
      const reduceMotion = Boolean(context.conditions?.reduceMotion);
      gsap.killTweensOf(items);

      if (reduceMotion || disabled) {
        gsap.set(items, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          clearProps: CLEAR_TRANSFORM_PROPS,
        });
        return;
      }

      if (skippedItems.length > 0) {
        gsap.set(skippedItems, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          clearProps: CLEAR_TRANSFORM_PROPS,
        });
      }

      const settleStagger = Math.max(stagger * 0.35, 0.008);
      const tl = gsap.timeline({
        delay,
        defaults: { overwrite: "auto" },
      });

      tl.addLabel("enter", 0)
        .set(animatedItems, { willChange: "transform, opacity" }, "enter")
        .fromTo(
          animatedItems,
          { autoAlpha: 0, x, y, scale },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration,
            ease: "power3.out",
            stagger: { each: stagger, from: "start" },
            clearProps: "visibility",
          },
          "enter"
        );

      if (animatedItems.length <= 60) {
        tl.to(
          animatedItems,
          {
            y: -1,
            duration: 0.06,
            ease: "steps(2)",
            stagger: { each: settleStagger, from: "start" },
          },
          `>-${Math.min(duration * 0.35, 0.12)}`
        ).to(
          animatedItems,
          {
            y: 0,
            duration: 0.08,
            ease: "power2.out",
            stagger: { each: settleStagger, from: "start" },
            clearProps: CLEAR_TRANSFORM_PROPS,
          },
          "<0.04"
        );
      } else {
        tl.set(animatedItems, { clearProps: CLEAR_TRANSFORM_PROPS }, ">");
      }
    });

    return () => mm.revert();
  }, {
    scope: ref,
    dependencies: [
      ...deps,
      selector,
      x,
      y,
      scale,
      duration,
      stagger,
      delay,
      disabled,
      maxAnimated,
    ],
    revertOnUpdate: true,
  });
}

type TerminalPathDrawOptions = {
  selector?: string;
  duration?: number;
  stagger?: number;
  disabled?: boolean;
};

export function useTerminalPathDraw<T extends SVGElement>(
  ref: RefObject<T | null>,
  deps: DependencyList,
  {
    selector = "[data-motion-path]",
    duration = 0.34,
    stagger = 0.04,
    disabled = false,
  }: TerminalPathDrawOptions = {}
) {
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;

    const paths = Array.from(root.querySelectorAll<SVGPathElement>(selector));
    if (paths.length === 0) return;

    const pathLengths = paths.map((path) => ({
      path,
      length: Math.max(path.getTotalLength(), 1),
    }));
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, (context) => {
      const reduceMotion = Boolean(context.conditions?.reduceMotion);
      gsap.killTweensOf(paths);

      if (reduceMotion || disabled) {
        gsap.set(paths, {
          opacity: 1,
          strokeDasharray: "none",
          strokeDashoffset: 0,
          clearProps: "opacity,willChange",
        });
        return;
      }

      pathLengths.forEach(({ path, length }) => {
        gsap.set(path, {
          opacity: 0.28,
          strokeDasharray: length,
          strokeDashoffset: length,
          willChange: "opacity",
        });
      });

      gsap.timeline({ defaults: { overwrite: "auto" } })
        .addLabel("draw", 0)
        .to(
          paths,
          {
            strokeDashoffset: 0,
            duration,
            ease: "power2.out",
            stagger: { each: stagger, from: "start" },
          },
          "draw"
        )
        .to(
          paths,
          {
            opacity: 1,
            duration: 0.2,
            ease: "power1.out",
            stagger: { each: stagger * 0.5, from: "start" },
          },
          "<0.12"
        )
        .set(paths, {
          strokeDasharray: "none",
          strokeDashoffset: 0,
          clearProps: "opacity,willChange",
        });
    });

    return () => mm.revert();
  }, {
    scope: ref,
    dependencies: [selector, duration, stagger, disabled, ...deps],
    revertOnUpdate: true,
  });
}

export function useTerminalExit<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onComplete: () => void,
  {
    x = 16,
    y = 6,
    scale = 0.98,
    duration = 0.2,
    ease = "power2.in",
  }: TerminalExitOptions = {}
) {
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      completedRef.current = false;
    }
  }, [active]);

  useGSAP(() => {
    const el = ref.current;
    if (!active || !el) return;

    completedRef.current = false;
    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };

    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, (context) => {
      const reduceMotion = Boolean(context.conditions?.reduceMotion);
      gsap.killTweensOf(el);

      if (reduceMotion) {
        gsap.set(el, { autoAlpha: 0, x: 0, y: 0, scale: 1 });
        finish();
        return;
      }

      gsap.timeline({ defaults: { overwrite: true } })
        .addLabel("exit", 0)
        .set(el, { willChange: "transform, opacity" }, "exit")
        .to(
          el,
          {
            autoAlpha: 0,
            x,
            y,
            scale,
            duration,
            ease,
            onComplete: finish,
          },
          "exit"
        );
    });

    return () => mm.revert();
  }, {
    scope: ref,
    dependencies: [active, x, y, scale, duration, ease],
    revertOnUpdate: true,
  });
}

type MotionPresenceProps = Omit<MotionBlockProps, "disabled"> & {
  show: boolean;
  children: ReactNode;
  exit?: TerminalExitOptions;
  onExitComplete?: () => void;
};

export function MotionPresence({
  show,
  children,
  preset = "panel",
  exit,
  onExitComplete,
  ...props
}: MotionPresenceProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setIsExiting(false);
      return;
    }

    if (shouldRender) {
      setIsExiting(true);
    }
  }, [show, shouldRender]);

  const handleExited = useCallback(() => {
    setShouldRender(false);
    setIsExiting(false);
    onExitComplete?.();
  }, [onExitComplete]);

  useTerminalExit(ref, isExiting, handleExited, exit);

  if (!shouldRender) return null;

  return (
    <MotionBlock
      ref={ref}
      preset={preset}
      aria-hidden={!show}
      data-motion-state={isExiting ? "exiting" : "entered"}
      {...props}
    >
      {children}
    </MotionBlock>
  );
}

type TerminalDismissOptions = {
  disabled?: boolean;
  exit?: TerminalExitOptions;
};

export function useTerminalDismiss<T extends HTMLElement>(
  onDismiss: () => void,
  { disabled = false, exit }: TerminalDismissOptions = {}
) {
  const ref = useRef<T | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  const finishDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useTerminalExit(ref, isDismissing, finishDismiss, {
    x: 0,
    y: 18,
    scale: 0.97,
    duration: 0.18,
    ease: "power2.in",
    ...exit,
  });

  const requestDismiss = useCallback(() => {
    if (disabled || isDismissing) return;
    setIsDismissing(true);
  }, [disabled, isDismissing]);

  const forceDismiss = useCallback(() => {
    if (isDismissing) return;
    setIsDismissing(true);
  }, [isDismissing]);

  return { ref, isDismissing, requestDismiss, forceDismiss };
}
