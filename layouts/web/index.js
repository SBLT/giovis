import Logo from "components/logo";
import Input from "components/inputs";
import { useAuth } from "provider/auth";
import HeaderNav from "./header-nav";
import Sidebar from "./sidebar-nav";
import layoutcss from "@css/web/layout.module.css";
import { useEffect, useRef, useState } from "react";
import Link from "components/links";
import { useRouter } from "next/router";
import useWindowSize from "hooks/useWindowSize";
import Icon from "components/icons";
import { useDB } from "provider/db";
import Preloader from "components/preloaders";

export default function Web({ children }) {
  const router = useRouter();
  const { width } = useWindowSize();
  const { routes } = useDB();

  const [showData, setShowData] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [name, setName] = useState("");

  const { isLoading } = useAuth();
  const header = useRef(null);
  const nav = useRef(null);

  const handleSearch = (e) => {
    if (e.key == "Enter" && name.trim() != "") {
      router.push(
        `/search/${name.trim()?.toLocaleLowerCase().split(" ").join("-")}`
      );
      setName("");
    }
  };

  // Update sidebar top style ==> For sticky position
  useEffect(() => {
    const updateCSS = (e) => {
      const header_height = header.current?.offsetHeight;
      const window_height = window.innerHeight;

      if (!nav.current) return;
      nav.current.style.top = `${header_height}px`;
      nav.current.style.height = `${window_height - header_height}px`;

      if (width <= 1014) {
        setIsSidebarOpen(false);
      }
    };

    // Updating css
    updateCSS();
    window.addEventListener("resize", updateCSS);
    return () => window.removeEventListener("resize", updateCSS);
  }, [isLoading, width, showData]);

  useEffect(() => {
    const handler = (e) => {
      if (!nav.current?.contains(e.target)) {
        nav.current?.parentNode.removeAttribute("state");
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (routes.length > 0) setTimeout(() => setShowData(true), 200);
    else setShowData(false);
  }, [routes]);

  if (isLoading) return <Preloader />;
  else {
    return (
      <>
        {showData ? (
          <div id={layoutcss.app}>
            <header ref={header} className={layoutcss.header}>
              <div>
                <div>
                  {width <= 1014 ? (
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      role="closebtn"
                    >
                      <Icon name="menu@outlined" />
                    </button>
                  ) : null}

                  <Link href="/home">
                    <Logo />
                  </Link>

                  {width > 850 ? (
                    <Input
                      icon="search@border"
                      placeholder="Buscar en Giovi's"
                      onChange={(e) => setName(e.target.value)}
                      onKeyUp={(e) => handleSearch(e)}
                      value={name}
                    />
                  ) : null}
                </div>

                <HeaderNav value={name} />
              </div>
            </header>

            <div className={layoutcss.content}>
              <div
                className={layoutcss.sidebar}
                state={isSidebarOpen ? "is-open" : null}
              >
                <Sidebar ref={nav} />
              </div>

              <div>{children}</div>
            </div>
          </div>
        ) : (
          <Preloader />
        )}
      </>
    );
  }

  return <></>;
}
