import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

function useEventListener<EventName extends keyof MediaQueryListEventMap>(
  eventName: EventName,
  callback: (event: MediaQueryListEventMap[EventName]) => void,
  element: RefObject<MediaQueryList | null> | undefined,
  options?: boolean | AddEventListenerOptions,
): void;

function useEventListener<EventName extends keyof WindowEventMap>(
  eventName: EventName,
  callback: (event: WindowEventMap[EventName]) => void,
  element?: undefined,
  options?: boolean | AddEventListenerOptions,
): void;

function useEventListener<EventName extends keyof HTMLElementEventMap, ElementRef extends HTMLElement = HTMLDivElement>(
  eventName: EventName,
  callback: (event: HTMLElementEventMap[EventName]) => void,
  element: RefObject<ElementRef | null> | undefined,
  options?: boolean | AddEventListenerOptions,
): void;

function useEventListener<EventName extends keyof DocumentEventMap>(
  eventName: EventName,
  callback: (event: DocumentEventMap[EventName]) => void,
  element: RefObject<Document | null> | undefined,
  options?: boolean | AddEventListenerOptions,
): void;

function useEventListener<
  MediaQueryEventName extends keyof MediaQueryListEventMap,
  WindowEventName extends keyof WindowEventMap,
  ElementEventName extends keyof HTMLElementEventMap,
  DocumentEventName extends keyof DocumentEventMap,
  ElementRef extends HTMLElement | MediaQueryList | Document | Window | void = void,
>(
  eventName: WindowEventName | DocumentEventName | ElementEventName | MediaQueryEventName,
  callback: (
    event:
      | MediaQueryListEventMap[MediaQueryEventName]
      | WindowEventMap[WindowEventName]
      | HTMLElementEventMap[ElementEventName]
      | DocumentEventMap[DocumentEventName]
      | Event,
  ) => void,
  element?: RefObject<ElementRef | null> | undefined,
  options?: boolean | AddEventListenerOptions,
) {
  const callbackRef = useRef<EventListener>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useLayoutEffect(() => {
    const targetElement = element?.current ?? window;

    if (!(targetElement && targetElement.addEventListener)) return;

    const listener: typeof callback = event => callbackRef.current(event);

    targetElement.addEventListener(eventName, listener, options);

    return () => {
      targetElement.removeEventListener(eventName, listener, options);
    };
  }, [eventName, element, options]);
}

export { useEventListener };
