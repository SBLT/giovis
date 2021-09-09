import Board from "layouts/dashboard";
import Button from "components/buttons";
import Icon from "components/icons";
import Input from "components/inputs";
import prodcss from "@css/dashboard/products.module.css";
import { useEffect, useRef, useState } from "react";
import { useDB } from "provider/db";
import { roundDown } from "utils/numbers";
import { getDateFromMilliseconds } from "utils/dates";
import { toast } from "components/toasts";
import Select from "components/selects";
import Portal from "components/portals";
import { db } from "db/firebase";
import { useAuth } from "provider/auth";
import { trampoline } from "utils/trampoline";
import useLocalStorage from "hooks/useLocalStorage";
import Head from "next/head";

const getPaths = (x) => {
  try {
    let arr = [];

    const paths = (x, key = "") => {
      if (Array.isArray(x)) {
        return x?.map((path) => paths(path, key));
      } else if (typeof x === "object") {
        if (x?.routes?.length > 0) {
          return x?.routes?.map((path) => paths(path, `${key}${x?.path}`));
        } else {
          return arr.push(`${key}${x?.path}`);
        }
      } else return;
    };
    paths(x);

    return arr;
  } catch (e) {
    return [];
  }
};

export default function Productos() {
  const filtersForm = useRef(null);

  const { isLoading } = useAuth();
  const { products, routes } = useDB();
  const [data, setData] = useState();
  const [categories, setCategories] = useState(routes);
  const [selectedRoute, setSelectedRoute] = useState();

  const [query, setQuery] = useState("");
  const [state, setState] = useLocalStorage("filters", {
    timeframe: "always",
    sort: {
      time: "down",
      discount: "down",
      price: "down",
    },
    path: "all",
  });

  const [isRemoving, setIsRemoving] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pinToRemove, setPinToRemove] = useState();

  const openFilters = () => {
    const content = filtersForm.current;

    if (content.style.height) {
      content.style.overflow = "hidden";
      content.style.height = "";
      return;
    }

    const transition = () => {
      content.style.overflow = "visible";
      content?.removeEventListener("transitionend", transition);
    };

    const height = content?.scrollHeight;
    content.style.height = `${height}px`;
    content?.addEventListener("transitionend", transition);
  };

  const selectRoute = (data) => {
    const { value } = data;
    let selected = categories?.filter((route) => route?.path === value)?.[0];

    if (selected) {
      setState({ ...state, path: value });
      setSelectedRoute(selected);
    } else {
      setState({ ...state, path: value });
      return setSelectedRoute({ path: value });
    }
  };

  const removeProduct = () => {
    let srcid = products.filter((product) => product.pin === pinToRemove)?.[0]
      ?.srcid;

    setIsRemoving(true);
    db.collection("productos")
      .doc(pinToRemove)
      .delete()
      .then(() => {
        db.collection("previews")
          .doc(srcid)
          .delete()
          .catch((error) => {
            console.error("Error removing document: ", error);
          });

        toast({ value: "¡El producto ha sido eliminado satisfatoriamente!" });
        setIsRemoving(false);
        setIsAlertOpen(false);
      })
      .catch((error) => {
        toast({
          value:
            "¡Ups! Ah ocurrido un error en el sistema. Por favor, inténtelo de nuevo",
          type: "error",
        });

        setIsRemoving(false);
        setIsAlertOpen(false);
        console.error("Error removing document: ", error);
      });
  };

  useEffect(() => {
    selectRoute({ value: state.path });
  }, [isLoading]);

  useEffect(() => {
    setCategories(routes?.filter((route) => !route?.private));
  }, [routes]);

  useEffect(() => {
    let getpaths = trampoline(getPaths);
    let flatten = getpaths(routes);

    let withinTimeframe = [];
    products.forEach((item) => {
      if (state.timeframe === "always") {
        withinTimeframe.push(item);
      }

      let timestamp = getDateFromMilliseconds(item?.timestamp);
      let now = getDateFromMilliseconds(Date.now());

      if (state.timeframe === "today") {
        if (
          timestamp?.year?.int === now?.year?.int &&
          timestamp?.month?.int === now?.month?.int &&
          timestamp?.day?.int === now?.day?.int
        ) {
          withinTimeframe.push(item);
        }
      }

      if (state.timeframe === "last_week") {
        if (
          timestamp?.date?.getDate() >= now?.week?.firstday.getDate() &&
          timestamp?.date?.getDate() <= now?.week?.lastday.getDate()
        ) {
          withinTimeframe.push(item);
        }
      }

      if (state.timeframe === "last_month") {
        if (
          timestamp?.date?.getDate() >= now?.month?.firstday.getDate() &&
          timestamp?.date?.getDate() <= now?.month?.lastday.getDate()
        ) {
          withinTimeframe.push(item);
        }
      }

      if (state.timeframe === "last_year") {
        if (
          timestamp?.date?.getDate() >= now?.year?.firstday.getDate() &&
          timestamp?.date?.getDate() <= now?.year?.lastday.getDate()
        ) {
          withinTimeframe.push(item);
        }
      }
    });

    // Let's sort the products
    withinTimeframe.sort((a, b) => {
      // Let's sort the products within time sort order
      let a_timestamp = getDateFromMilliseconds(a?.timestamp);
      let b_timestamp = getDateFromMilliseconds(b?.timestamp);

      if (
        a_timestamp?.year?.int === b_timestamp?.year?.int &&
        a_timestamp?.month?.int === b_timestamp?.month?.int &&
        a_timestamp?.day?.int === b_timestamp?.day?.int
      ) {
        // Let's sort the products within price sort order
        let a_price = a?.amount;
        let b_price = b?.amount;

        if (a_price === b_price) {
          // Let's sort the products within discount sort order
          let a_fraction = a?.fraction || a_price;
          let b_fraction = b?.fraction || b_price;

          let a_discount = roundDown(
            ((a_price - a_fraction) / a_price) * 100,
            2
          );
          let b_discount = roundDown(
            ((b_price - b_fraction) / b_price) * 100,
            2
          );

          if (state.sort.discount === "down") {
            return b_discount - a_discount;
          }

          if (state.sort.discount === "up") {
            return a_discount - b_discount;
          }
        }

        if (state.sort.price === "down") return b_price - a_price;
        if (state.sort.price === "up") return a_price - b_price;
      }

      if (state.sort.time === "down") {
        return b?.timestamp > a?.timestamp ? 1 : -1;
      }
      if (state.sort.time === "up") return a?.timestamp > b?.timestamp ? 1 : -1;
    });

    let filtered = withinTimeframe?.filter((item) => {
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        if (state.path === "all") return item;
        if (state.path === "removed" && flatten.indexOf(item?.path) == -1) {
          return item;
        }

        if (
          item?.path?.toLowerCase().includes(state.path?.toLocaleLowerCase())
        ) {
          return item;
        }
      }
    });

    setData(filtered);
  }, [products, state, query]);

  return (
    <>
      <Head>
        <title>Productos | Giovis</title>
      </Head>

      <Board>
        {isAlertOpen ? (
          <Portal>
            <div className="alert">
              <div className={prodcss.delete}>
                <header>
                  <h3>Eliminar producto</h3>
                  <button
                    disabled={isRemoving}
                    onClick={() => setIsAlertOpen(false)}
                  >
                    <Icon name="close-square@broken" />
                  </button>
                </header>

                <article>
                  <Icon name="info-square@broken" />
                  <p>
                    Al realizar esta acción,
                    <span>
                      la información del producto será quitada de toda la web.
                    </span>
                    Este cambio será notificado a todos los usuarios que quieran
                    adquirir el producto.
                    <span>
                      Esta actualización no afectará a los pedidos ya realizados
                    </span>
                  </p>
                </article>

                <span>¿Desea continuar con esta acción?</span>

                <footer>
                  <button
                    disabled={isRemoving}
                    onClick={(e) => {
                      e?.preventDefault();
                      setIsAlertOpen(false);
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    disabled={isRemoving}
                    onClick={(e) => {
                      e?.preventDefault();
                      removeProduct();
                    }}
                  >
                    Aceptar
                  </button>
                </footer>
              </div>
            </div>
          </Portal>
        ) : null}

        <section className={prodcss.section}>
          <div>
            <header className={prodcss.header}>
              <Input
                placeholder="Ingrese el nombre del producto"
                onChange={(e) => setQuery(e.target.value)}
              />

              <div>
                <Button
                  color="silver@10"
                  variant="ghost"
                  onClick={() => openFilters()}
                >
                  <Icon name="filter-2@broken" />
                  Filtros
                </Button>

                <Button variant="outlined" to="/productos/nuevo">
                  Agregar un nuevo producto
                </Button>
              </div>
            </header>

            <div className={prodcss.filters} ref={filtersForm}>
              <div>
                <div>
                  <label>Lapso de tiempo</label>
                  <Select
                    resizable={false}
                    value={state.timeframe}
                    onChange={(data) => {
                      setState({ ...state, timeframe: data?.value });
                    }}
                  >
                    <option value="today">Hoy</option>
                    <option value="last_week">Última semana</option>
                    <option value="last_month">Último mes</option>
                    <option value="last_year">Último año</option>
                    <option value="always">Desde siempre</option>
                  </Select>
                </div>

                <div>
                  <label>Tiempo</label>
                  <Select
                    resizable={false}
                    value={state.sort.time}
                    onChange={(data) => {
                      setState({
                        ...state,
                        sort: { ...state.sort, time: data?.value },
                      });
                    }}
                  >
                    <option value="down">Descendente</option>
                    <option value="up">Ascendente</option>
                  </Select>
                </div>

                <div>
                  <label>Precio</label>
                  <Select
                    resizable={false}
                    value={state.sort.price}
                    onChange={(data) => {
                      setState({
                        ...state,
                        price: { ...state.sort, time: data?.value },
                      });
                    }}
                  >
                    <option value="down">Descendente</option>
                    <option value="up">Ascendente</option>
                  </Select>
                </div>

                <div>
                  <label>Descuento</label>
                  <Select
                    resizable={false}
                    value={state.sort.discount}
                    onChange={(data) => {
                      setState({
                        ...state,
                        discount: { ...state.sort, time: data?.value },
                      });
                    }}
                  >
                    <option value="down">Descendente</option>
                    <option value="up">Ascendente</option>
                  </Select>
                </div>

                <div>
                  <label>Categoría</label>
                  <Select
                    resizable={false}
                    value={state.path}
                    onChange={(data) => selectRoute(data)}
                  >
                    <option value="all">todas las categorías</option>
                    <option value="removed">Eliminados</option>

                    {categories?.map((route, index) => (
                      <option key={index} value={route?.path}>
                        {route.value}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  {selectedRoute?.routes?.length > 0 ? (
                    <>
                      <label>Sub categoría</label>
                      <Select
                        value={state.path}
                        resizable={false}
                        onChange={(data) => {
                          setState({ ...state, path: data?.value });
                        }}
                      >
                        <option value={selectedRoute?.path}>
                          Todas la subcategorías
                        </option>

                        {selectedRoute?.routes?.map((route, index) => (
                          <option
                            key={index}
                            value={selectedRoute?.path + route?.path}
                          >
                            {route.value}
                          </option>
                        ))}
                      </Select>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className={prodcss.table}>
            <div>
              <article role="header">
                <span>Imagen</span>
                <span>Nombre</span>
                <span>Path</span>
                <span>Precio</span>
                <span>Descuento</span>
                <span>Fecha de registro</span>
                <span>Acciones</span>
              </article>

              {data?.map((item, index) => {
                let amount = item.amount;
                let fraction = item?.fraction || amount;
                let date = getDateFromMilliseconds(item?.timestamp);

                return (
                  <article key={index}>
                    <div>
                      <img
                        src={item?.src || "/images/ghost.png"}
                        alt={item?.name || "Producto"}
                      />
                    </div>

                    <span>{item?.name}</span>
                    <span>{item?.path}</span>
                    <span>S/ {roundDown(item?.amount, 2)}</span>

                    <span>
                      {fraction < amount
                        ? `${roundDown(
                            ((amount - fraction) / amount) * 100,
                            2
                          )} %`
                        : "-----"}
                    </span>

                    <span>{`${date?.day?.int} de ${date?.month?.name} del ${date?.year?.int}`}</span>

                    <div>
                      <Button
                        variant="outlined"
                        size="small"
                        color="peter-river@5"
                        to={`/productos/editar/${item?.pin}`}
                      >
                        <Icon name="edit@bold" />
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        color="alizarin@5"
                        onClick={() => {
                          setPinToRemove(item?.pin);
                          setIsAlertOpen(true);
                        }}
                      >
                        <Icon name="delete@bold" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </Board>
    </>
  );
}
