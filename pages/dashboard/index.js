import Board from "layouts/dashboard";
import homecss from "@css/dashboard/home.module.css";
import Link from "components/links";
import Chart from "chart.js/auto";
import { useEffect, useRef, useState } from "react";
import { capitalize } from "utils/strings";
import { roundDown } from "utils/numbers";
import { getDateFromMilliseconds } from "utils/dates";
import { db } from "db/firebase";
import useTimeago from "hooks/useTimeago";
import Button from "components/buttons";
import Portal from "components/portals";
import { useDB } from "provider/db";
import Icon from "../../components/icons";
import { toPng } from "html-to-image";
import firebase from "firebase/app";
import Head from "next/head";

const Timeago = ({ time }) => {
  const timeago = useTimeago(time);
  return <span>{timeago}</span>;
};

const Graph = (props) => {
  const chart = useRef(null);
  const { routes } = useDB();

  useEffect(() => {
    const publics = routes.filter((route) => route?.private !== true);
    const labels = publics.reduce(
      (acc, route) => [...acc, capitalize(route.value)],
      []
    );

    const categories = publics.reduce(
      (acc, route) => [...acc, route?.path?.split("/")[1]],
      []
    );
    const data = categories.map((path) => props?.data[path] || 0);

    const initChart = () => {
      // Remove existing chart
      chart.current?.querySelector("canvas")?.remove();

      // Create new chart
      const canvas = document.createElement("canvas");
      canvas.setAttribute("id", "chart");
      chart.current?.appendChild(canvas);

      // Create context
      const ctx = document.getElementById("chart")?.getContext("2d");
      if (!ctx) return;

      const graph = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: [
                "#91c9fb",
                "#b5c5fc",
                "#d5c1f5",
                "#eebfe8",
                "#febfd9",
                "#ffc3c9",
                "#ffcabc",
                "#fed2b5",
              ],
              hoverBorderColor: ["#fff"],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 12,
                font: {
                  size: 12,
                },
              },
            },
          },
          layout: {
            padding: {
              // left: 100,
            },
          },
        },
      });
    };

    initChart();
    return () => initChart();
  }, [routes, props?.data]);

  return <div ref={chart}></div>;
};

const Notifications = ({ orders }) => {
  const order_list = useRef(null);
  const [users, setUsers] = useState({});
  const [order, setOrder] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);

  const seeMore = (order, total) => {
    setOrder({
      data: order,
      time: getDateFromMilliseconds(order?.timestamp),
      total: roundDown(total, 2),
    });

    if (order.displayed) return;
    db.collection("orders")
      .doc(order?.id)
      .update({
        displaydate: firebase.firestore.FieldValue.serverTimestamp(),
        displaynotified: false,
        displayed: true,
      })
      .catch((error) => {
        console.error("Error updating document: ", error);
      });
  };

  const deliver = (id) => {
    db.collection("orders")
      .doc(id)
      .update({
        deliverydate: firebase.firestore.FieldValue.serverTimestamp(),
        deliverynotified: false,
        delivered: true,
      })
      .catch((error) => {
        console.error("Error updating document: ", error);
      });

    setOrder();
  };

  const downloadPng = () => {
    setIsDownloading(true);
    let node = document.getElementById("data");

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
            a.download = `${
              users[order?.data?.user?.uid]?.["username"] || ""
            } ${order?.time?.year?.int}/${order?.time?.month?.id}/${
              order?.time?.day?.id
            }.png`; //File name Here
            a.click(); //Downloaded file

            setTimeout(() => setIsDownloading(false), 1000);
          }
        }
      })
      .catch((error) => {
        setTimeout(() => setIsDownloading(false), 1000);
        console.log("oop! algo anda mal: ", error);
      });
  };

  useEffect(() => {
    const unsubscribe = db.collection("users").onSnapshot((querySnapshot) => {
      let hits = [];

      querySnapshot.forEach((doc) => {
        hits.push({ ...doc.data(), uid: doc.id });
      });

      hits = hits.reduce(
        (acc, user) => ({
          ...acc,
          [user.uid]: user,
        }),
        {}
      );

      setUsers(hits);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {order?.data?.cart ? (
        <Portal>
          <div
            className="alert"
            onClick={(e) => {
              if (!order_list.current?.contains(e.target) && !isDownloading) {
                setOrder();
              }
            }}
          >
            <div ref={order_list} className={homecss.order_list}>
              <div>
                <div>
                  <p>
                    Pedido <span>#{order?.data?.id}</span>
                    {!users[order?.data?.user?.uid] ? " [Eliminado...]" : ""}
                  </p>
                  <p>
                    {`${order?.time?.day?.id} de ${order?.time?.month?.name} del ${order?.time?.year?.int} a las ${order?.time?.hour}:${order?.time?.minutes}`}
                  </p>
                </div>

                <button
                  disabled={isDownloading}
                  onClick={(e) => {
                    e.preventDefault();
                    return downloadPng();
                  }}
                >
                  Descargar pedido
                </button>
              </div>

              <div className={homecss.order_list_board}>
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
                    {users[order?.data?.user?.uid]?.["username"] || ""}
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
                    onClick={() => setOrder()}
                  >
                    Cancelar
                  </Button>

                  {!users[order?.data?.user?.uid] ? null : order?.data
                      ?.delivered ? null : (
                    <Button onClick={() => deliver(order?.data?.id)}>
                      Pedido entregado
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      {/* Cart to download */}
      {order?.data?.cart ? (
        <Portal>
          <div style={{ transform: "translateX(-100%)" }}>
            <div
              id="data"
              className={homecss.order_list}
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

              <div className={homecss.order_list_board}>
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
                <div style={{ gridArea: "1 / 1", justifyContent: "left" }}>
                  <p style={{ marginBottom: "0" }}>Datos del cliente</p>

                  <p>
                    <Icon name="profile@bold" />
                    {users[order?.data?.user?.uid]?.["username"] || ""}
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
        let user = users[order?.user?.uid];
        let total = order?.cart.reduce((total, item) => {
          let item_total = item?.cuantity * (item?.fraction || item?.amount);
          return total + item_total;
        }, 0);

        return (
          <article
            state={
              order?.displayed
                ? order?.delivered
                  ? "was-delivered"
                  : null
                : "is-new"
            }
            key={index}
            onClick={() => seeMore(order, total)}
          >
            <div>
              <img
                src={user?.avatar || "/images/ghost.png"}
                alt={capitalize(user?.username, -1) || "usuario"}
              />
            </div>

            <div>
              <p>
                <b>{capitalize(user?.username, -1)}</b> relizó un nuevo pedido
                valorizado en S/ {roundDown(total, 2)}
              </p>

              <Timeago time={order?.timestamp} />
            </div>
          </article>
        );
      })}
    </>
  );
};

export default function Dashboard() {
  const { products, orders } = useDB();
  const [topPopulars, setTopPopulars] = useState([]);
  const [topLatest, setTopLatest] = useState([]);
  const [indexedProducts, setIndexedProducts] = useState([]);
  const [productsInCategory, setProductsInCategory] = useState([]);

  useEffect(() => {
    let indexed = products?.reduce(
      (acc, hit) => ({
        ...acc,
        [hit?.pin]: hit,
      }),
      {}
    );

    let productsInCategory = products?.reduce((acc, item) => {
      let category = item?.path?.split("/")[1];
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    setProductsInCategory(productsInCategory);
    setTopLatest(products?.slice(0, 5));
    setIndexedProducts(indexed);
  }, [products]);

  useEffect(() => {
    let data = [];
    let delivered = orders?.filter((order) => order?.delivered);

    delivered.forEach((order) => {
      order?.cart?.forEach((item) => {
        data?.push({ pin: item?.pin, cuantity: item?.cuantity });
      });
    });

    let populars = data?.reduce((acc, item) => {
      acc[item?.pin] = (acc[item?.pin] || 0) + item?.cuantity;
      return acc;
    }, {});
    populars = Object.entries(populars);
    populars.sort((a, b) => b[1] - a[1]);

    setTopPopulars(populars?.slice(0, 5));
  }, [orders]);

  return (
    <>
      <Head>
        <title>Dashboard | Giovis</title>
      </Head>

      <Board>
        <div className={homecss.grid}>
          <div className={homecss.main}>
            <Link className={homecss.shortcut_1} href="/productos/nuevo">
              <img src="/heros/add_files.svg" alt="Agregar un nuevo producto" />
              <p>
                Crear un nuevo producto
                <span>Agregar un nuevo producto a la tienda</span>
              </p>
            </Link>

            <Link className={homecss.shortcut_2} href="/sliders">
              <img src="/heros/images.svg" alt="Configurar el slider" />

              <p>
                Configuración del slider
                <span>
                  Actualiza las imágenes que se presentan en el slider
                </span>
              </p>
            </Link>

            <Link className={homecss.shortcut_3} href="/categorias">
              <img
                src="/heros/app_data.svg"
                alt="Configurar el menú del sitio"
              />

              <p>
                Menú de la web
                <span>Actualiza las categorias y subcategorías</span>
              </p>
            </Link>

            <div className={homecss.chart}>
              <p>Todos los productos</p>

              <Graph data={productsInCategory} />
            </div>

            <div className={homecss.board_1}>
              <p>TOP 5: Más pedidos</p>

              <div>
                <article role="header">
                  <span>Top</span>
                  <span>Nombre</span>
                  <span>Cantidad</span>
                </article>

                {topPopulars?.map((item, index) => (
                  <article key={index}>
                    <span>{index + 1}</span>
                    <span>
                      {indexedProducts[item[0]]?.name || "Producto eliminado"}
                    </span>
                    <span>{item[1]}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className={homecss.board_2}>
              <p>TOP 5: Más recientes</p>

              <div>
                <article role="header">
                  <span>Top</span>
                  <span>Nombre</span>
                  <span>Fecha de publicación</span>
                </article>

                {topLatest?.map((item, index) => (
                  <article key={index}>
                    <span>{index + 1}</span>
                    <span>{item["name"] || "Nombre no encontrado"}</span>
                    <Timeago time={item.timestamp} />
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className={homecss.notifications}>
            <Notifications orders={orders} />
          </div>
        </div>
      </Board>
    </>
  );
}
