import { useRouter } from "next/router";
import Web from "layouts/web";
import { Fragment, useEffect, useRef, useState } from "react";
import { db } from "db/firebase";
import Product from "components/products";
import Spinner from "components/spinners";
import css from "@css/web/pages.module.css";
import { useAuth } from "provider/auth";
import { trampoline } from "utils/trampoline";
import Slider from "components/slider";
import { useDB } from "provider/db";
import { similarity } from "utils/strings";
import Button from "components/buttons";
import Icon from "components/icons";
import { getDateFromMilliseconds } from "utils/dates";
import { roundDown } from "utils/numbers";
import Portal from "components/portals";
import { toPng } from "html-to-image";
import Link from "components/links";
import useWindowSize from "hooks/useWindowSize";
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

export default function Path({ state, query }) {
  const { user } = useAuth();
  const { routes } = useDB();

  return (
    <>
      <Head>
        <title>
          {state == "is-home"
            ? "Home | Giovis"
            : state == "is-favoritos"
            ? "Mis favoritos |  Giovis"
            : state == "is-ofertas"
            ? "Ofertas |  Giovis"
            : state == "is-location"
            ? "Tienda |  Giovis"
            : state == "is-pedidos"
            ? "Mis pedidos |  Giovis"
            : state == "is-query"
            ? "Buscar |  Giovis"
            : routes.length > 0
            ? routes?.filter(
                (route) => route?.path == "/" + state?.split("/")?.[0]
              )?.[0]?.value + " |  Giovis"
            : "Giovis"}
        </title>
      </Head>

      <Web>
        {state == "is-home" ? (
          <Home />
        ) : state == "is-favoritos" ? (
          <Favorites user={user} />
        ) : state == "is-ofertas" ? (
          <Ofertas />
        ) : state == "is-location" ? (
          <Location />
        ) : state == "is-query" ? (
          <Search quest={query} />
        ) : state == "is-pedidos" ? (
          <Orders quest={query} />
        ) : (
          <Default category={state} />
        )}
      </Web>
    </>
  );
}

Path.getInitialProps = async (context) => {
  const { query } = context;
  const { path } = query;

  const x = path?.join("/");
  if (x == "favoritos") return { state: "is-favoritos" };
  if (x == "ofertas") return { state: "is-ofertas" };
  if (x == "home") return { state: "is-home" };
  if (x == "ubicacion") return { state: "is-location" };
  if (x == "mis-pedidos" || (path?.[0] == "mis-pedidos" && path.length == 2)) {
    return { state: "is-pedidos", query: path?.[1] };
  }

  if (path?.[0] == "search" && path?.length == 2) {
    return { state: "is-query", query: path?.[1] };
  }

  return { state: x };
};

const Default = ({ category }) => {
  const router = useRouter();
  const { products, routes } = useDB();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    let getpaths = trampoline(getPaths);
    let flatten = getpaths(routes);
    if (flatten.indexOf(`/${category}`) == -1) {
      return router.push("/home");
    }

    const filtered = products?.filter((item) => item?.path == `/${category}`);
    setMatches(filtered);

    setIsLoading(false);
  }, [category, products]);

  return (
    <>
      {isLoading ? (
        <div className={css.middle}>
          <Spinner />
        </div>
      ) : matches.length > 0 ? (
        <div className={css.products}>
          {matches.map((match, index) => (
            <Product key={index} data={match} />
          ))}
        </div>
      ) : (
        <div className={css.middle}>
          <div>
            <img
              className={css.empty}
              src="/heros/product_photography.svg"
              alt="Aún no se han agregado productos a esta categoría"
            />
            <p className={css.empty_title}>
              Aún no se han agregado productos a esta categoría
            </p>
          </div>
        </div>
      )}
    </>
  );
};

const Home = () => {
  const slider = useRef();
  const { products } = useDB();
  const { width } = useWindowSize();

  const [slides, setSlides] = useState([]);
  const [showSlides, setShowSlides] = useState(false);
  const [latest, setLatest] = useState();

  useEffect(() => {
    const onSnapshot = db.collection("slides").onSnapshot((snapshot) => {
      let docs = [];
      snapshot.forEach((doc) => docs.push({ ...doc.data(), doc: doc.id }));
      setSlides(docs);
    });

    return () => onSnapshot();
  }, []);

  useEffect(() => {
    setShowSlides(false);
    if (!slides.length || !slider) return;

    slider.current.querySelectorAll(".hero_slide img").forEach((img, index) => {
      img.onload = function () {
        img.src = img.src;
        setTimeout(() => setShowSlides(true), 500);
        img.onload = null;
      };

      img.src = slides[index] ? slides[index].url : "/";
    });
  }, [slides]);

  useEffect(() => {
    setLatest(products?.slice(0, 15));
  }, [products]);

  return (
    <>
      <Slider
        ref={slider}
        style={{ display: showSlides ? "" : "none" }}
        options={{ controllers: 810 < width }}
      >
        {slides.map((slide) => (
          <Fragment key={slide.id}>
            <img src="/images/ghost.png" alt="slide" />
          </Fragment>
        ))}
      </Slider>

      <div className={css.products}>
        <h3 className="title">
          <p>
            Productos Giovi's <span>más recientes y actualizados</span>
          </p>
        </h3>
        {latest?.map((item, index) => (
          <Product data={item} key={index} />
        ))}
      </div>
    </>
  );
};

const Favorites = ({ user }) => {
  const { products } = useDB();
  const [matches, setMatches] = useState([]);

  const [state, setState] = useState({
    isUser: false,
    isLoading: true,
    isEmpty: false,
  });

  useEffect(() => {
    setState({ ...state, isLoading: true });

    if (!user) {
      return setState({
        ...state,
        isLoading: false,
        isUser: false,
        isEmpty: true,
      });
    }

    let filtered = products?.filter(
      (item) => user?.favorites?.indexOf(item.pin) >= 0
    );

    setMatches(filtered);
    if (filtered.length) {
      setState({
        ...state,
        isLoading: false,
        isEmpty: false,
        isUser: true,
      });
    } else {
      setState({
        ...state,
        isLoading: false,
        isEmpty: true,
        isUser: true,
      });
    }
  }, [user, products]);

  return (
    <>
      {state.isLoading && (
        <div className={css.middle}>
          <Spinner />
        </div>
      )}

      {state.isUser && state.isEmpty === false && (
        <div className={css.products}>
          {matches.map((match, index) => (
            <Product key={index} data={match} />
          ))}
        </div>
      )}

      {state.isUser && state.isEmpty && (
        <div className={css.middle}>
          <div>
            <img
              className={css.empty}
              src="/heros/counting_stars.svg"
              alt="Aún no has agregado un producto a tu lista de favoritos"
            />
            <p className={css.empty_title}>
              Aún no has agregado un producto a tu lista de favoritos
            </p>
          </div>
        </div>
      )}
    </>
  );
};

const Ofertas = () => {
  const { products } = useDB();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    let offers = products?.filter((item) => item?.fraction);
    setMatches(offers);

    setIsLoading(false);
  }, [products]);

  return (
    <>
      {isLoading ? (
        <div className={css.middle}>
          <Spinner />
        </div>
      ) : matches?.length > 0 ? (
        <div className={css.products}>
          {matches.map((match, index) => (
            <Product key={index} data={match} />
          ))}
        </div>
      ) : (
        <div className={css.middle}>
          <div>
            <img
              className={css.empty}
              src="/heros/counting_stars.svg"
              alt="No hay ofertas disponibles"
            />
            <p className={css.empty_title}>No hay ofertas disponibles</p>
          </div>
        </div>
      )}
    </>
  );
};

const Location = () => {
  const [coords, setCoords] = useState({
    lon: 0,
    lat: 0,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        setCoords({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
        });
      },
      function (error) {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
      }
    );
  });

  return (
    <div className={css.middle}>
      <iframe
        className={css.map}
        src={`https://www.google.com/maps/embed?pb=!1m20!1m8!1m3!1d1164.692552040695!2d-77.28112142771784!3d-5.985929848268163!3m2!1i1024!2i768!4f13.1!4m9!3e0!4m3!3m2!1d${coords.lat}!2d${coords.lon}!4m3!3m2!1d-5.9857607!2d-77.2805577!5e0!3m2!1ses-419!2spe!4v1628063213525!5m2!1ses-419!2spe`}
      ></iframe>
    </div>
  );
};

const Search = ({ quest }) => {
  const { products } = useDB();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    let filtered = products?.filter((item) => {
      let name = item?.name.toLowerCase();
      let query = String(quest?.split("-").join(" ")).toLocaleLowerCase();

      if (similarity(name, query) >= 0.5) return item;
      else if (name?.includes(query)) return item;
    });

    setMatches(filtered);
    setIsLoading(false);
  }, [quest, products]);

  return (
    <>
      {isLoading ? (
        <div className={css.middle}>
          <Spinner />
        </div>
      ) : matches.length > 0 ? (
        <div className={css.products}>
          {matches.map((match, index) => (
            <Product key={index} data={match} />
          ))}
        </div>
      ) : (
        <div className={css.middle}>
          <div>
            <img
              className={css.empty_search}
              src="/heros/taken_re.svg"
              alt="No se ha encontrado coincidencias"
            />
            <p className={css.empty_title}>No se ha encontrado coincidencias</p>
          </div>
        </div>
      )}
    </>
  );
};

const Orders = ({ quest }) => {
  const { user } = useAuth();
  const { width, before } = useWindowSize();
  const router = useRouter();
  const order_list = useRef(null);

  const { orders } = useDB();
  const [order, setOrder] = useState({});
  const [isOrderHidden, setIsOrderHidden] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPng = (date) => {
    setIsDownloading(true);

    let node = document.getElementById("data");
    if (node) node.style.width = `64rem`;

    toPng(node)
      .then(function (dataUrl) {
        console.clear();

        // Check wheter all images are loaded
        let images = node.querySelectorAll("img");
        let len = images.length;
        let counter = 0;

        images.forEach((img) => {
          if (img.complete) incrementCounter();
          else img.addEventListener("load", incrementCounter, false);
        });

        function incrementCounter() {
          counter++;
          if (counter === len) {
            // All images loaded!
            let a = document.createElement("a"); //Create <a>
            a.href = dataUrl; //Image Base64 Goes here
            a.download = `${user?.username || ""} ${date?.year?.int}/${
              date?.month?.id
            }/${date?.day?.id}.png`; //File name Here
            a.click(); //Downloaded file

            setTimeout(() => {
              setIsDownloading(false);
              setOrder({});
            }, 1000);
          }
        }
      })
      .catch((error) => {
        setTimeout(() => {
          setIsDownloading(false);
          setOrder({});
        }, 1000);
        console.log("oop! algo anda mal: ", error);
      });
  };

  useEffect(() => {
    if (!quest) return setOrder();

    setIsOrderHidden(true);
    let filtered = orders?.filter((order) => order.id === quest)?.[0];
    let total = filtered?.cart.reduce((total, item) => {
      let item_total = item?.cuantity * item?.amount;
      return total + item_total;
    }, 0);

    if (!filtered) return router.push("/mis-pedidos");
    setOrder({
      data: filtered,
      time: getDateFromMilliseconds(filtered?.timestamp),
      total: roundDown(total, 2),
    });

    setTimeout(() => setIsOrderHidden(false), 100);
  }, [quest]);

  useEffect(() => {
    if (!user?.uid) return router.push("/home");
  }, [user]);

  useEffect(() => {
    if (
      (width <= 970 && before.width > 970) ||
      (width > 970 && before.width <= 970)
    ) {
      return router.push("/mis-pedidos");
    }
  }, [width]);

  return (
    <div className={css.orders}>
      {order?.data?.cart && quest && width > 970 ? (
        <Portal>
          <div
            style={isOrderHidden ? { display: "none" } : null}
            className="alert"
            onClick={(e) => {
              if (!order_list.current?.contains(e.target) && !isDownloading) {
                router.push("/mis-pedidos");
              }
            }}
          >
            <div ref={order_list} className={css.order_list}>
              <div>
                <div>
                  <p>
                    Pedido <span>#{order?.data?.id}</span>
                    {order?.data?.delivered
                      ? " [Entregado]"
                      : order?.data?.displayed
                      ? " [En proceso...]"
                      : ""}
                  </p>
                  <p>
                    {`${order?.time?.day?.id} de ${order?.time?.month?.name} del ${order?.time?.year?.int} a las ${order?.time?.hour}:${order?.time?.minutes}`}
                  </p>
                </div>

                <button
                  disabled={isDownloading}
                  onClick={(e) => {
                    e.preventDefault();
                    return downloadPng(order?.time);
                  }}
                >
                  Descargar pedido
                </button>
              </div>

              <div className={css.order_list_board}>
                <article role="header">
                  <span>Vista previa</span>
                  <span>Producto</span>
                  <span>Talla</span>
                  <span>Precio</span>
                  <span>Descuento</span>
                  <span>Precio final</span>
                  <span>Cantidad</span>
                  <span>Total</span>
                </article>

                {order?.data?.cart?.map((item, index) => (
                  <article key={index}>
                    <div>
                      <img
                        src={item?.src || "/images/ghost.png"}
                        alt={item?.name}
                      />
                    </div>

                    <span>{item?.name}</span>
                    <span>{item?.size}</span>
                    <span>S/ {roundDown(item?.amount, 2)}</span>
                    <span>
                      {item?.fraction
                        ? `-${roundDown(
                            (100 * (item?.amount - item?.fraction)) /
                              item?.amount,
                            1
                          )}%`
                        : "-----"}
                    </span>
                    <span>
                      S/ {roundDown(item?.fraction || item?.amount, 2)}
                    </span>
                    <span>{item?.cuantity}</span>
                    <span>
                      {`S/ ${roundDown(
                        (item?.fraction || item?.amount) * item?.cuantity,
                        2
                      )}`}
                    </span>
                  </article>
                ))}
              </div>

              <div>
                <div>
                  <p>Datos del cliente</p>

                  <p>
                    <Icon name="profile@bold" />
                    {user?.username || ""}
                  </p>
                  <p>
                    <Icon name="call@bold" />
                    {order?.data?.user?.celular}
                  </p>
                  <p>
                    <Icon name="wallet@bold" />
                    {order?.data?.user?.dni}
                  </p>
                </div>

                <p>
                  Total: <span>S/ {order?.total}</span>
                </p>

                <div>
                  <Button
                    disabled={isDownloading}
                    variant="ghost"
                    color="silver@9"
                    to="/mis-pedidos"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      {order?.data?.cart ? (
        <Portal>
          <div style={{ transform: "translateX(-110%)" }}>
            <div
              id="data"
              className={css.order_list}
              style={{
                maxWidth: "64rem",
                maxHeight: "none",
                backgroundColor: "#FDFEFE",
              }}
            >
              <div>
                <div>
                  <p>
                    Pedido <span>#{order?.data?.id}</span>
                  </p>
                  <p>
                    {`${order?.time?.day?.id} de ${order?.time?.month?.name} del ${order?.time?.year?.int} a las ${order?.time?.hour}:${order?.time?.minutes}`}
                  </p>
                </div>
              </div>

              <div className={css.order_list_board}>
                <article role="header">
                  <span>Vista previa</span>
                  <span>Producto</span>
                  <span>Talla</span>
                  <span>Precio</span>
                  <span>Descuento</span>
                  <span>Precio final</span>
                  <span>Cantidad</span>
                  <span>Total</span>
                </article>

                {order?.data?.cart?.map((item, index) => (
                  <article key={index}>
                    <div>
                      <img
                        src={item?.src || "/images/ghost.png"}
                        alt={item?.name}
                      />
                    </div>

                    <span>{item?.name}</span>
                    <span>{item?.size}</span>
                    <span>S/ {roundDown(item?.amount, 2)}</span>
                    <span>
                      {item?.fraction
                        ? `-${roundDown(
                            (100 * (item?.amount - item?.fraction)) /
                              item?.amount,
                            1
                          )}%`
                        : "-----"}
                    </span>
                    <span>
                      S/ {roundDown(item?.fraction || item?.amount, 2)}
                    </span>
                    <span>{item?.cuantity}</span>
                    <span>
                      {`S/ ${roundDown(
                        (item?.fraction || item?.amount) * item?.cuantity,
                        2
                      )}`}
                    </span>
                  </article>
                ))}
              </div>

              <div>
                <div
                  style={{
                    gridArea: "1 / 1",
                    justifyContent: "left",
                    width: "100%",
                  }}
                >
                  <p style={{ marginBottom: "0" }}>Datos del cliente</p>

                  <p>
                    <Icon name="profile@bold" />
                    {user?.username || ""}
                  </p>
                  <p>
                    <Icon name="call@bold" />
                    {order?.data?.user?.celular}
                  </p>
                  <p>
                    <Icon name="wallet@bold" />
                    {order?.data?.user?.dni}
                  </p>
                </div>

                <p>
                  Total: <span>S/ {roundDown(order?.total, 2)}</span>
                </p>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      {orders?.map((order, index) => {
        if (order?.user?.uid == user?.uid) {
          let time = getDateFromMilliseconds(order?.timestamp);
          let deliverydate = getDateFromMilliseconds(order?.deliverydate);
          let displaydate = getDateFromMilliseconds(order?.displaydate);

          let total = order?.cart.reduce((total, item) => {
            let item_total = item?.cuantity * item?.amount;
            return total + item_total;
          }, 0);

          let fractioned = order?.cart.reduce((total, item) => {
            let item_total = item?.cuantity * (item?.fraction || item?.amount);
            return total + item_total;
          }, 0);

          return (
            <article
              key={index}
              state={
                order?.delivered
                  ? "is-delivered"
                  : order?.displayed
                  ? "is-displayed"
                  : null
              }
            >
              <button
                disabled={isDownloading}
                onClick={(e) => {
                  e.preventDefault();

                  setIsDownloading(true);
                  setOrder({
                    data: order,
                    time: getDateFromMilliseconds(order?.timestamp),
                    total: roundDown(fractioned, 2),
                  });

                  setTimeout(() => {
                    return downloadPng(
                      getDateFromMilliseconds(order?.timestamp)
                    );
                  }, 1000);
                }}
              >
                Descargar
              </button>

              <p>
                <span>{`${time?.day?.id}/${time?.month?.id}/${time?.year?.int}`}</span>
                <Link href={`/mis-pedidos/${order?.id}`}>#{order?.id}</Link>
              </p>

              <span>S/ {roundDown(total, 2)}</span>

              {width > 724 ? (
                <span>-S/ {roundDown(total - fractioned, 2)}</span>
              ) : null}

              <div>
                <span>
                  {order?.delivered ? (
                    <>
                      <Icon name="shield-done@broken" /> Entregado
                      {width > 630
                        ? `: ${deliverydate?.day?.id}/${deliverydate?.month?.id}/${deliverydate?.year?.int}`
                        : null}
                    </>
                  ) : order?.displayed ? (
                    <>
                      <Icon name="time-circle@broken" /> En proceso
                      {width > 630
                        ? `: ${displaydate?.day?.id}/${displaydate?.month?.id}/${displaydate?.year?.int}`
                        : null}
                    </>
                  ) : (
                    <>
                      <Icon name="send@broken" />
                      {width > 630 ? " Enviado" : null}
                    </>
                  )}
                </span>
              </div>

              {width > 960 ? (
                <Button
                  variant="ghost"
                  color="silver@7"
                  to={`/mis-pedidos/${order?.id}`}
                >
                  <Icon name="hide@outlined" />
                </Button>
              ) : null}
            </article>
          );
        }
      })}
    </div>
  );
};
