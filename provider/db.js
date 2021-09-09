import { createContext, useContext, useEffect, useState } from "react";
import { db } from "db/firebase";

const DBContext = createContext();
export function useDB() {
  return useContext(DBContext);
}

export function DBProvider({ children }) {
  const [productsOnDB, setProductsOnDB] = useState([]);
  const [ordersOnDB, setOrdersOnDB] = useState([]);
  const [cartsOnDB, setCartsOnDB] = useState([]);
  const [imagesOnDB, setImagesOnDB] = useState([]);
  const [faq, setFaq] = useState([]);
  const [routes, setRoutes] = useState([]);

  // Correctly formatted images
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [carts, setCarts] = useState([]);

  useEffect(() => {
    const unsubscribe = db.collection("previews").onSnapshot(
      (querySnapshot) => {
        let imgs = [];

        querySnapshot.forEach((doc) => {
          imgs.push({
            ...doc.data(),
            id: doc.id,
          });
        });

        imgs = imgs.reduce(
          (acc, img) => ({
            ...acc,
            [img.id]: img,
          }),
          {}
        );

        setImagesOnDB(imgs);
      },
      (err) => {
        setImagesOnDB([]);
        console.log("Error al cargar los productos: " + err);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = db
      .collection("productos")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (querySnapshot) => {
          let hits = [];

          querySnapshot.forEach((doc) => {
            hits.push({
              ...doc.data(),
              pin: doc.id,
              timestamp: +doc.data()?.timestamp?.toDate(),
            });
          });

          setProductsOnDB(hits);
        },
        (err) => {
          setProductsOnDB([]);
          console.log("Error al cargar los productos: " + err);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = db
      .collection("orders")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (querySnapshot) => {
          let hits = [];

          querySnapshot.forEach((doc) => {
            let data = {
              ...doc.data(),
              id: doc.id,
              timestamp: +doc.data()?.timestamp?.toDate(),
            };

            if (doc.data()?.deliverydate) {
              data.deliverydate = +doc.data()?.deliverydate?.toDate();
            }

            if (doc.data()?.displaydate) {
              data.displaydate = +doc.data()?.displaydate?.toDate();
            }

            hits.push({ ...data });
          });

          setOrdersOnDB(hits);
        },
        (err) => {
          setOrdersOnDB([]);
          console.log("Error al cargar los productos: " + err);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = db.collection("carts").onSnapshot(
      (querySnapshot) => {
        let hits = [];

        querySnapshot.forEach((doc) => {
          hits.push({
            ...doc.data(),
            id: doc.id,
            // timestamp: +doc.data()?.timestamp?.toDate(),
          });
        });

        setCartsOnDB(hits);
      },
      (err) => {
        setCartsOnDB([]);
        console.log("Error al cargar los productos: " + err);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = db
      .collection("categories")
      .orderBy("value")
      .onSnapshot(
        (querySnapshot) => {
          let hits = [];

          querySnapshot.forEach((doc) => {
            hits.push({
              ...doc.data(),
              id: doc.id,
              timestamp: +doc.data()?.timestamp?.toDate(),
            });
          });

          let privates = [];
          let subpages = [];
          let pages = [];

          hits.forEach((item) => {
            if (item?.private) return privates.push(item);
            if (item?.routes?.length > 0) return subpages.push(item);
            if (!item?.routes?.length) return pages.push(item);
          });

          let latest = [...privates, ...subpages, ...pages];
          setRoutes(latest);
        },
        (err) => {
          setRoutes([]);
          console.log("Error al cargar los productos: " + err);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = db
      .collection("faq")
      .orderBy("timestamp")
      .onSnapshot(
        (querySnapshot) => {
          let hits = [];

          querySnapshot.forEach((doc) => {
            hits.push({
              ...doc.data(),
              id: doc.id,
              time: +doc.data()?.timestamp?.toDate(),
            });
          });

          setFaq(hits);
        },
        (err) => {
          setFaq([]);
          console.log("Error al cargar los productos: " + err);
        }
      );

    return () => unsubscribe();
  }, []);

  // Format
  useEffect(() => {
    let formatted = ordersOnDB.map((order) => {
      let formattedorder = order?.cart?.map((item) => {
        return { ...item, src: imagesOnDB?.[item.src]?.src };
      });

      return { ...order, cart: formattedorder };
    });

    setOrders(formatted);
  }, [imagesOnDB, ordersOnDB]);

  useEffect(() => {
    let formatted = cartsOnDB?.map((list) => {
      let formattedcart = [];

      list?.cart?.forEach((item) => {
        let product = products?.filter(
          (product) => product.pin == item.pin
        )?.[0];

        if (product) {
          let doc = {
            ...item,
            ...product,
          };

          formattedcart?.push(doc);
        }
      });

      return { cart: formattedcart, uid: list?.uid, id: list?.id };
    });

    setCarts(formatted);
  }, [imagesOnDB, products, cartsOnDB]);

  useEffect(() => {
    let formatted = productsOnDB.reduce(
      (acc, product) => [
        ...acc,
        {
          ...product,
          src: imagesOnDB?.[product.src]?.src,
          srcid: product?.src,
        },
      ],
      []
    );

    setProducts(formatted);
  }, [imagesOnDB, productsOnDB]);

  const values = {
    products,
    orders,
    carts,
    previews: imagesOnDB,
    faqs: faq,
    routes,
  };

  return <DBContext.Provider value={values}>{children}</DBContext.Provider>;
}
