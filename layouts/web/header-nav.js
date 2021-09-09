import { useAuth } from "provider/auth";
import HeaderSetup from "./header-setup";
import HeaderAuth from "./header-auth";
import headercss from "@css/web/layout.module.css";
import Notifications from "./notifications";
import Cart from "./cart";
import Icon from "components/icons";
import useWindowSize from "hooks/useWindowSize";
import Input from "components/inputs";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function HeaderNav({ value }) {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowSize();
  const search_ref = useRef(null);
  const [name, setName] = useState(value);
  const [isSearchInputOpen, setIsSearchInputOpen] = useState(false);

  const handleSearch = (e) => {
    if (e.key == "Enter" && name.trim() != "") {
      router.push(
        `/search/${name.trim()?.toLocaleLowerCase().split(" ").join("-")}`
      );
      setName("");
    }
  };

  useEffect(() => {
    if (!search_ref.current) return setIsSearchInputOpen(false);

    setIsSearchInputOpen(true);
    if (isSearchInputOpen) {
      search_ref.current.style.maxWidth = `${window.innerWidth}px`;
    }
  }, [width, isSearchInputOpen]);

  return (
    <div className={headercss.header_nav}>
      <Notifications />
      {width >= 1320 ? <Cart /> : null}

      {user && <HeaderSetup />}
      {!user && <HeaderAuth />}

      {width > 850 ? null : (
        <>
          {isSearchInputOpen ? (
            <div role="search" ref={search_ref}>
              <button
                onClick={() => {
                  search_ref.current.style.maxWidth = 0;

                  setTimeout(() => {
                    setIsSearchInputOpen(false);
                  }, 250);
                }}
              >
                <Icon name="arrow-left@bold" />
              </button>

              <Input
                icon="search@border"
                placeholder="Buscar en Giovi's"
                onChange={(e) => setName(e.target.value)}
                onKeyUp={(e) => handleSearch(e)}
                onIconClick={(e) => handleSearch({ key: "Enter" })}
                value={name}
              />
            </div>
          ) : null}

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSearchInputOpen(true);
              setTimeout(() => {
                search_ref.current.style.maxWidth = `${window.innerWidth}px`;
                search_ref.current.querySelector("input")?.focus();
              }, 100);
            }}
          >
            <Icon name="search@border" />
          </button>
        </>
      )}

      {width < 1320 ? <Cart /> : null}
    </div>
  );
}
