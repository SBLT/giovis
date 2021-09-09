import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  Children,
} from "react";
import Button from "./buttons";
import Icon from "./icons";

const init = {
  controllers: true,
  autoplay: true,
  speed: 500,
  interval: 5000,
  buttons: {},
};

function Slider({ children, options = init, className, ...rest }, ref) {
  const slider = ref || useRef(null);
  const slideInterval = useRef(null);

  const {
    controllers = init.controllers,
    autoplay = init.autoplay,
    speed = init.speed,
    interval = init.interval,
    buttons = init.buttons,
  } = options;

  const {
    references = {},
    prevContent = <Icon name="arrow-left-2@broken" />,
    nextContent = <Icon name="arrow-right-2@broken" />,
  } = buttons;

  const { ...remainingAttributes } = references;
  delete remainingAttributes.data_class;

  const next = useCallback(() => {
    // Comprobamos que el slider tenga elementos
    if (slider.current?.children.length > 1) {
      // Obtenemos el primer elemento del slider
      const firstSlide = slider.current?.children[0];
      // Establecemos la transición del eslider
      slider.current.style.transition = `${speed}ms ease-out all`;

      const slideSize = slider.current?.children[0].offsetWidth;

      // Movemos el slider
      slider.current.style.transform = `translateX(-${slideSize}px)`;

      const transition = () => {
        // Reiniciamos la posición del slider
        slider.current.style.transition = "none";
        slider.current.style.transform = "translateX(0)";
        // Enviamos el primer elemento al final del slider
        slider.current?.appendChild(firstSlide);

        // Eliminamos el eventlistener
        slider.current?.removeEventListener("transitionend", transition);
      };

      // Eventlistener para cuando termina la animación
      slider.current?.addEventListener("transitionend", transition);
    }
  }, [speed]);

  const prev = () => {
    if (slider.current?.children.length > 1) {
      // Obtenemos el primer elemento del slider
      const lastSlideIndex = slider.current?.children.length - 1;
      const lastSlide = slider.current?.children[lastSlideIndex];
      slider.current?.insertBefore(lastSlide, slider.current?.firstChild);

      slider.current.style.transition = "none";
      const slideSize = slider.current?.children[0].offsetWidth;
      slider.current.style.transform = `translateX(-${slideSize}px)`;

      setTimeout(() => {
        slider.current.style.transition = `${speed}ms ease-out all`;
        slider.current.style.transform = "translateX(0)";
      }, 30);
    }
  };

  useEffect(() => {
    if (autoplay) {
      slideInterval.current = setInterval(() => {
        next();
      }, interval);

      // Eliminamos los intervalos
      slider.current?.addEventListener("mouseenter", () => {
        clearInterval(slideInterval.current);
      });

      slider.current?.addEventListener("mouseleave", () => {
        slideInterval.current = setInterval(() => {
          next();
        }, interval);
      });
    }
  }, [autoplay, interval, next]);

  return (
    <div className="hero" {...rest}>
      <ul className="hero_slider" ref={slider}>
        {Children.map(children, (child, index) => (
          <li className="hero_slide" key={index}>
            {child}
          </li>
        ))}
      </ul>

      {controllers && children?.length >= 2 && (
        <div className="hero_controller" {...remainingAttributes}>
          <Button onClick={() => prev()}>{prevContent}</Button>
          <Button onClick={() => next()}>{nextContent}</Button>
        </div>
      )}
    </div>
  );
}

export default forwardRef(Slider);
