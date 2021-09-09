import { useRouter } from "next/router";
import { forwardRef, useRef } from "react";
import Icon from "components/icons";
import { useDB } from "provider/db";
import layoutcss from "@css/web/layout.module.css";
import Link from "components/links";

const Sidebar = (props, ref) => {
  const nav = ref || useRef(null);
  const router = useRouter();
  const current_route = router.asPath;
  const { routes } = useDB();

  return (
    <nav ref={nav} {...props} className={layoutcss.sidebar_nav}>
      {routes?.map((route, key) => (
        <article key={key} className={layoutcss.category}>
          <div>
            {route?.routes && (
              <>
                <span>{route?.value.toLowerCase()}</span>
                <Icon name="category@bold" />
              </>
            )}

            {!route?.routes && (
              <Link href={route?.path}>{route?.value.toLowerCase()}</Link>
            )}
          </div>

          {route?.routes && (
            <div className={layoutcss.subcategory}>
              {route.routes.map((subroute, index) => {
                const href = route?.path + subroute.path;
                const state = current_route == href ? "is-active" : "";

                return (
                  <Link state={state} href={href} key={index}>
                    {subroute?.value?.toLowerCase()}
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      ))}

      <div className={layoutcss.shortcuts}>
        <a href="https://www.facebook.com/" target="_blank">
          Facebook
        </a>

        <a href="https://ec.grupohinode.com/" target="_blank">
          HND
        </a>

        <a href="https://wa.me/961547245" target="_blank">
          Whatsapp
        </a>

        <Link role="number">
          <Icon name="call@bold" />
          961547245
        </Link>

        <Link href="/ubicacion">
          <Icon name="location@bold" />
          Ubicación
        </Link>
      </div>
    </nav>
  );
};

export default forwardRef(Sidebar);
