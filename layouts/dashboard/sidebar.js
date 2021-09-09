import Icon from "components/icons";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { auth } from "db/firebase";
import Dropdown from "components/dropdown";

const routes = [
  { path: "/dashboard", icon: "home@bold" },
  { path: "/productos", icon: "document@bold" },
  { path: "/sliders", icon: "image@bold" },
  { path: "/categorias", icon: "category@bold" },
];

export default function Sidebar() {
  const nav = useRef(null);
  const router = useRouter();
  const path = router.asPath.split("/")[1];

  const signout = () => {
    auth.signOut().catch((error) => console.log(error));
  };

  useEffect(() => {
    nav.current?.addEventListener("click", (e) => {
      const clicked = e.target;
      if (!clicked?.tagName.toLowerCase() == "a") return;

      e.preventDefault();
      const href = clicked.getAttribute("href");
      href && router.push(href);
    });
  }, []);

  return (
    <>
      <nav ref={nav}>
        {routes?.map((route, index) => {
          const state = path == route?.path?.split("/")[1] ? "is-active" : "";

          return (
            <a href={route?.path || ""} key={index} state={state}>
              <Icon name={route?.icon || ""} />
            </a>
          );
        })}
      </nav>

      <button onClick={() => signout()}>
        <Icon name="logout@bold" />
      </button>
    </>
  );
}
