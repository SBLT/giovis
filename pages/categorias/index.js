import Board from "layouts/dashboard";
import css from "@css/dashboard/categories.module.css";
import { useEffect, useRef, useState } from "react";
import { capitalize, toURL } from "utils/strings";
import { db } from "db/firebase";
import { useDB } from "provider/db";
import { useAuth } from "provider/auth";
import firebase from "firebase/app";
import Head from "next/head";

export default function Categorias() {
  const list_ref = useRef(null);
  const { routes } = useDB();
  const { isLoading } = useAuth();

  const [list, setList] = useState([]);
  const [prevRoutes, setPrevRoutes] = useState([]);

  const selectRoute = (position) => {
    list
      ?.querySelectorAll(":scope > li")
      ?.[position]?.setAttribute("state", "is-selected");
  };

  const addPage = (e) => {
    e.preventDefault();
    let latest = routes?.filter((route) => route.isNew);
    let doc = {};

    if (latest?.length == 0) {
      doc = { path: "/nuevo", value: "Nuevo", isNew: true };
    } else {
      doc = {
        path: `/nuevo-${latest?.length}`,
        value: `Nuevo ${latest?.length}`,
        isNew: true,
      };
    }

    db.collection("categories")
      .add({
        ...doc,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((error) => {
        console.error("Error updating document: ", error);
      });
  };

  useEffect(() => {
    if (!list_ref.current) return;
    setList(list_ref.current);
  }, [list_ref.current, isLoading]);

  useEffect(() => {
    if (!list.nodeName) return;

    list
      ?.querySelectorAll("li")
      ?.forEach((item) => item.removeAttribute("state"));

    let a = routes;
    let b = prevRoutes;

    if (b?.length > a?.length || b?.length === 0) {
      selectRoute(0);
    } else if (a?.length > b?.length) {
      let indexed = b?.reduce(
        (acc, route) => ({
          ...acc,
          [route?.timestamp]: route,
        }),
        {}
      );

      let i = 0;
      a.forEach((route, index) => {
        if (!indexed?.[route?.timestamp]) i = index;
      });

      selectRoute(i);
    } else {
      let i = 0;

      for (let n = 0; n < routes.length; n++) {
        let route_a = routes?.[n];
        let route_b = prevRoutes?.[n];

        if (route_a?.timestamp !== route_b?.timestamp) {
          i = n;
        }
      }

      selectRoute(i);
    }

    setPrevRoutes(routes);
  }, [routes, list, isLoading]);

  return (
    <>
      <Head>
        <title>Categorías | Giovis</title>
      </Head>

      <Board>
        <div className={css.middle}>
          <div>
            <header className={css.header}>
              <div>
                <span>Menú del sitio</span>
                <button onClick={(e) => addPage(e)}>Agregar categoría</button>
              </div>
              <hr />
            </header>

            <ul className={css.list} ref={list_ref}>
              {routes?.map((route, index) => (
                <Item
                  state={index == 0 ? "is-selected" : null}
                  route={route}
                  routes={routes}
                  parent={routes}
                  list={list}
                  key={index}
                />
              ))}
            </ul>

            <footer className={css.footer}>
              <button onClick={(e) => addPage(e)}>Agregar categoría</button>
            </footer>
          </div>
        </div>
      </Board>
    </>
  );
}

const Item = ({ route, routes, type, list, parent, ...rest }) => {
  const options_ref = useRef(null);
  const icon_ref = useRef(null);
  const item_ref = useRef(null);
  const [needsToBeUpdated, setNeedsToUpdated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [data, setData] = useState({
    error: false,
    value: capitalize(route?.value),
  });

  const handleSelectItem = () => {
    list
      ?.querySelectorAll("li")
      ?.forEach((item) => item.removeAttribute("state"));
    item_ref.current?.parentNode.setAttribute("state", "is-selected");
  };

  const showOptions = () => {
    const boxCoords = icon_ref.current.getBoundingClientRect();

    let x = boxCoords.left;
    let y = boxCoords.top;

    options_ref.current.style.left = x + "px";
    options_ref.current.style.top = y + "px";
  };

  const showEditionForm = (e) => {
    const isHeader = e.target === item_ref.current;
    const isADiv = e.target.nodeName === "DIV";
    const isHeaderParent = e.target?.parentNode === item_ref.current;

    if (isHeader || (isHeaderParent && !isADiv)) setNeedsToUpdated(true);
  };

  const removeItem = (e) => {
    e.preventDefault();

    if (type == "subpage") {
      let filtered = parent?.routes?.filter(
        (item) => item?.path !== route?.path
      );

      db.collection("categories")
        .doc(parent?.id)
        .update({
          routes: filtered,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    } else {
      db.collection("categories")
        .doc(route?.id)
        .delete()
        .catch((error) => {
          console.error("Error removing document: ", error);
        });
    }
  };

  const addSubpage = (e) => {
    e.preventDefault();
    let routes = route?.routes || [];
    let latest = route?.routes?.filter((route) => route.isNew);

    if (latest?.length == 0 || !route?.routes?.length) {
      routes.push({ path: "/nuevo", value: "Nuevo", isNew: true });
    } else {
      routes.push({
        path: `/nuevo-${latest?.length}`,
        value: `Nuevo ${latest?.length}`,
        isNew: true,
      });
    }

    db.collection("categories")
      .doc(route?.id)
      .update({
        routes: routes,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((error) => {
        console.error("Error updating document: ", error);
      });
  };

  const updateSizesless = (e) => {
    e.preventDefault();

    db.collection("categories")
      .doc(route?.id)
      .update({
        sizesless: Boolean(!route?.sizesless),
      })
      .catch((error) => {
        console.error("Error updating document: ", error);
      });
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    if (value[0] == " " || value.length > 40) return;
    setData({
      value: capitalize(value?.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")),
      error: value?.length === 0,
    });
  };

  const updateItem = (e) => {
    e.preventDefault();
    const url = toURL(data.value?.trim());

    if (
      url == "/" ||
      url == route?.path ||
      route?.routes?.filter((route) => route.path == url)?.length > 0
    ) {
      setData({ value: route?.value, error: false });
      setNeedsToUpdated(false);

      return;
    }

    let doc = {
      value: data?.value,
      path: url,
    };

    if (type == "subpage") {
      let updated = parent?.routes?.map((item) =>
        item.path === route.path ? doc : item
      );

      setIsUpdating(true);
      db.collection("categories")
        .doc(parent?.id)
        .update({
          routes: updated,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          setData({ value: doc?.value, error: false });
          setNeedsToUpdated(false);
          setIsUpdating(false);
        })
        .catch((error) => {
          setIsUpdating(false);
          console.error("Error updating document: ", error);
        });
    } else {
      setIsUpdating(true);
      db.collection("categories")
        .doc(route?.id)
        .update({
          ...doc,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          setData({ value: doc?.value, error: false });
          setNeedsToUpdated(false);
          setIsUpdating(false);
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!item_ref.current?.contains(e.target)) {
        setNeedsToUpdated(false);
        setData({ value: route?.value, error: false });
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <li {...rest}>
      {type == "subpage" && <span role="branch" />}
      {type != "subpage" && route?.sizesless && (
        <span role="sizesless" data-tooltip="Productos sin tallas" />
      )}

      <header
        ref={item_ref}
        onDoubleClick={(e) => showEditionForm(e)}
        onClick={() => handleSelectItem()}
      >
        {needsToBeUpdated && !route?.private ? (
          <input
            type="text"
            state={data?.error ? "is-error" : null}
            value={capitalize(data?.value)}
            onChange={(e) => handleNameChange(e)}
            disabled={isUpdating}
          />
        ) : (
          <span>{capitalize(route?.value)}</span>
        )}

        {route?.private === true ? null : needsToBeUpdated ? (
          <div role="update">
            <button onClick={(e) => updateItem(e)} disabled={isUpdating}>
              Guardar
            </button>
          </div>
        ) : (
          <div>
            <span
              role="icon"
              onMouseEnter={() => showOptions()}
              ref={icon_ref}
            />
            <div role="dropdown" ref={options_ref}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setNeedsToUpdated(true);
                }}
              >
                Renombrar
              </button>

              {type == "subpage" ? null : (
                <>
                  <button onClick={(e) => addSubpage(e)}>Subpágina</button>
                  <button onClick={(e) => updateSizesless(e)}>
                    {route?.sizesless ? "Con tallas" : "Sin tallas"}
                  </button>
                </>
              )}

              <button onClick={(e) => removeItem(e)}>Eliminar</button>
            </div>
          </div>
        )}
      </header>

      {route?.routes?.length ? (
        <ul>
          {route?.routes?.map((subroute, index) => (
            <Item
              route={subroute}
              key={index}
              routes={routes}
              parent={route}
              list={list}
              type="subpage"
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};
