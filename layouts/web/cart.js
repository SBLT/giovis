import Dropdown from "components/dropdown";
import Icon from "components/icons";
import Button from "components/buttons";
import Input from "components/inputs";
import { useAuth } from "provider/auth";
import headercss from "@css/web/layout.module.css";
import { useEffect, useRef, useState } from "react";
import { db } from "db/firebase";
import firebase from "firebase/app";
import { roundDown } from "utils/numbers";
import Portal from "components/portals";
import { toast } from "components/toasts";
import { useDB } from "provider/db";
import useWindowSize from "hooks/useWindowSize";

export default function Cart() {
  const { carts } = useDB();
  const { width } = useWindowSize();

  const [cart, setCart] = useState([]);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState();
  const [showBadge, setShowBadge] = useState(false);
  const [isCartClicked, setIsCartClicked] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [notifyAmountChange, setNotifyAmountChange] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [isCartPopupOpen, setIsCartPopupOpen] = useState(false);
  const [orderState, setOrderState] = useState({
    dni: {
      value: "",
      error: false,
    },
    celular: {
      value: "",
      error: false,
    },
  });

  const { user } = useAuth();
  const ddl_cart = useRef(null);
  const cart_alert = useRef(null);
  const cart_popup = useRef(null);

  const handleKeepShopping = () => {
    setIsAlertOpen(false);
    setNotifyAmountChange(false);
    setOrderState({
      dni: {
        value: "",
        error: false,
      },
      celular: {
        value: "",
        error: false,
      },
    });
  };

  const handlePlaceOrder = () => {
    if (!list || list.length == 0) return;
    ddl_cart.current?.removeAttribute("state");
    setIsAlertOpen(true);
  };

  const handleSaveOrder = () => {
    if (!list || list.length == 0) return;
    let errors = {};

    if (orderState.dni?.value?.length != 8) errors.dni = true;
    if (orderState.celular?.value?.length != 9) errors.celular = true;

    if (errors?.celular || errors?.dni) {
      return setOrderState({
        ...orderState,
        celular: {
          value: orderState.celular?.value,
          error: errors?.celular,
        },
        dni: {
          value: orderState.dni?.value,
          error: errors?.dni,
        },
      });
    }

    let newCart = list?.map((item) => {
      delete item?.sizes;
      delete item?.path;
      delete item?.src;

      let srcid = item.srcid;
      delete item?.srcid;
      // delete item?.pin;

      return { ...item, src: srcid };
    });

    let order = {
      cart: newCart,
      user: {
        celular: orderState.celular.value,
        dni: orderState.dni.value,
        uid: cart?.uid,
      },
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      displayed: false,
      delivered: false,
    };

    setSavingOrder(true);
    db.collection("carts")
      .doc(cart?.id)
      .delete()
      .then(() => {
        delete order.id;
        db.collection("orders")
          .add(order)
          .then(() => {
            cart_alert.current?.childNodes.forEach((step) => {
              step.setAttribute("style", "transform: translateX(-100%);");
            });
            setSavingOrder(false);
          })
          .catch((error) => {
            toast({
              value: "Ups! Ah ocurrido un error el sistema",
              type: "error",
            });
            console.error("Error adding order: ", error);
            setSavingOrder(false);
          });
      })
      .catch((error) => {
        toast({
          value:
            "Ups! Ah ocurrido un error el sistema. Por favor, vuelve a intentarlo",
          type: "error",
        });
        console.error("Error removing document: ", error);
        setSavingOrder(false);
      });
  };

  const handleDniChange = (e) => {
    e?.preventDefault();

    if (e.target.value != "" && isNaN(e.target.value)) return;
    if (90000000 > parseInt(e.target.value) || e.target.value == "") {
      if (e.target.value.length <= 8) {
        setOrderState({
          ...orderState,
          dni: { value: e.target.value, error: true },
        });
      }

      if (e.target.value.length == 8) {
        setOrderState({
          ...orderState,
          dni: { value: e.target.value, error: false },
        });
      }
    }
  };

  const handleCelularChange = (e) => {
    e?.preventDefault();

    if (
      e.target.value != "" &&
      (isNaN(e.target.value) || e.target.value[0] != 9)
    ) {
      return;
    }

    if (1000000000 > parseInt(e.target.value) || e.target.value == "") {
      if (e.target.value.length <= 9) {
        setOrderState({
          ...orderState,
          celular: { value: e.target.value, error: true },
        });
      }

      if (e.target.value.length == 9) {
        setOrderState({
          ...orderState,
          celular: { value: e.target.value, error: false },
        });
      }
    }
  };

  const handleClearCart = () => {
    if (!list || list.length == 0) return;

    setIsCartClicked(true);
    db.collection("carts").doc(cart.id).update({
      cart: [],
    });
  };

  useEffect(() => {
    let filtered = carts?.filter((cart) => cart?.uid == user?.uid)?.[0] || [];
    let cart = filtered?.cart || [];
    let x = 0;

    cart.forEach((item) => {
      let c = item?.cuantity;
      let p = item?.fraction || item?.amount;

      x += p * c;
    });

    if (!isCartClicked) {
      if (cart.length > 0) {
        setShowBadge(true);
      }
    }

    if (isAlertOpen) {
      setNotifyAmountChange(true);
    }

    setCart(filtered);
    setList(cart);
    setTotal(roundDown(x, 2));
  }, [user?.uid, carts]);

  useEffect(() => {
    setIsCartPopupOpen(false);
  }, [width]);

  return (
    <>
      {isAlertOpen ? (
        <Portal>
          <div
            className="alert"
            onClick={(e) => {
              if (!cart_alert.current?.contains(e.target) && !savingOrder) {
                handleKeepShopping();
              }
            }}
          >
            <div>
              <div className={headercss.slide_cart} ref={cart_alert}>
                <div className={headercss.checkout}>
                  <div>
                    <img src="/logo_gradient_a.svg" alt="Logo gradient" />

                    <p>
                      Gracias por confiar en nosotros.
                      <span>Ya casi está todo listo</span>. Por favor, ayúdanos
                      brindandonos las siguiente información
                    </p>

                    <label>Documento de identidad</label>
                    <Input
                      onChange={(e) => handleDniChange(e)}
                      value={orderState.dni.value || ""}
                      state={orderState.dni.error ? "is-error" : null}
                    />

                    <label>Número de teléfono</label>
                    <Input
                      onChange={(e) => handleCelularChange(e)}
                      value={orderState.celular?.value || ""}
                      state={orderState.celular?.error ? "is-error" : null}
                    />

                    {notifyAmountChange && list.length > 0 ? (
                      <span>
                        Uno de los productos ha sido actualizado. El monto total
                        de tu pedido ahora es de S/ {roundDown(total, 2)}{" "}
                        <button
                          onClick={() => {
                            handleKeepShopping();
                            ddl_cart.current?.setAttribute("state", "is-open");
                          }}
                        >
                          Ir al carrito
                        </button>
                      </span>
                    ) : null}

                    <Button
                      disabled={savingOrder}
                      onClick={() => handleSaveOrder()}
                    >
                      Finalizar pedido
                    </Button>

                    <Button
                      disabled={savingOrder}
                      variant="ghost"
                      color="alizarin"
                      onClick={() => handleKeepShopping()}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>

                <div className={headercss.success}>
                  <div>
                    <img src="/heros/on_the_way.svg" alt="En camino" />
                    <p>
                      En las próximas horas, nuestro equipo se comunicará con
                      ud.
                    </p>
                    <Button
                      variant="ghost"
                      onClick={() => handleKeepShopping()}
                    >
                      Seguir comprando
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      {width >= 1320 ? (
        <Dropdown
          ref={ddl_cart}
          className={headercss.dropdown}
          onOpen={() => setShowBadge(false)}
          onClose={() => {
            setIsCartClicked(false);
          }}
        >
          <>
            <Icon name="buy@broken" badge-variant={showBadge ? "dot" : ""} />
            Mi carrito
          </>

          {user ? (
            <>
              <div className={headercss.cart}>
                <header>
                  <span>resumen de compra</span>
                  <p>
                    {list.length === 0
                      ? "0 productos"
                      : list.length === 1
                      ? "1 producto"
                      : `${list.length} productos`}
                  </p>
                </header>

                <div>
                  {list.length === 0 ? <p>No hay productos</p> : ""}

                  {list?.map((item, index) => (
                    <Item
                      key={index}
                      data={{
                        ...item,
                        cart: cart,
                        onChange: () => setIsCartClicked(true),
                      }}
                    />
                  ))}
                </div>

                <footer>
                  Total: <span>S/ {total}</span>
                  <Button onClick={() => handlePlaceOrder()}>
                    Realizar pedido
                  </Button>
                  <Button variant="outlined" onClick={() => handleClearCart()}>
                    Vaciar carrito
                  </Button>
                </footer>
              </div>
            </>
          ) : (
            <div className={headercss.cart}>
              <img
                src="/heros/personal_information.svg"
                alt="Registrate para acceder al carrito de compras"
              />

              <p>Registrate para acceder al carrito de compras</p>
            </div>
          )}
        </Dropdown>
      ) : (
        <>
          {isCartPopupOpen ? (
            <Portal>
              <div
                className="alert"
                onClick={(e) => {
                  if (!cart_popup.current?.contains(e.target) && !savingOrder) {
                    setIsCartPopupOpen(false);
                  }
                }}
              >
                <div
                  style={{
                    maxHeight: "40rem",
                    maxWidth: "24rem",
                    width: "calc(100% - 2rem)",
                  }}
                >
                  {user ? (
                    <>
                      <div
                        className={headercss.cart}
                        ref={cart_popup}
                        style={{ width: "100%" }}
                      >
                        <header>
                          <span>resumen de compra</span>
                          <p>
                            {list.length === 0
                              ? "0 productos"
                              : list.length === 1
                              ? "1 producto"
                              : `${list.length} productos`}
                          </p>
                        </header>

                        <div>
                          {list.length === 0 ? <p>No hay productos</p> : ""}

                          {list?.map((item, index) => (
                            <Item
                              key={index}
                              data={{
                                ...item,
                                cart: cart,
                                onChange: () => setIsCartClicked(true),
                              }}
                            />
                          ))}
                        </div>

                        <footer>
                          Total: <span>S/ {total}</span>
                          <Button
                            onClick={() => {
                              setIsCartPopupOpen(false);
                              handlePlaceOrder();
                            }}
                          >
                            Realizar pedido
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleClearCart()}
                          >
                            Vaciar carrito
                          </Button>
                        </footer>
                      </div>
                    </>
                  ) : (
                    <div
                      className={headercss.cart}
                      ref={cart_popup}
                      style={{ width: "100%" }}
                    >
                      <img
                        src="/heros/personal_information.svg"
                        alt="Registrate para acceder al carrito de compras"
                      />

                      <p>Registrate para acceder al carrito de compras</p>
                    </div>
                  )}
                </div>
              </div>
            </Portal>
          ) : null}

          <button onClick={() => setIsCartPopupOpen(true)}>
            <Icon name="buy@broken" badge-variant={showBadge ? "dot" : ""} />
            <span>Mi carrito</span>
          </button>
        </>
      )}
    </>
  );
}

const Item = (props) => {
  const { src, name, size, cuantity, fraction, amount, cart, pin, onChange } =
    props.data;
  let price = roundDown(fraction || amount, 2);
  let total = roundDown(price * cuantity, 2);

  const handleChange = (action) => {
    let new_cart = cart?.cart.map((item) => {
      if (action === -1 && item.cuantity <= 1) return item;

      if (item.pin == pin && item.size == size) {
        return {
          ...item,
          cuantity: item.cuantity + action,
        };
      } else return item;
    });

    if (JSON.stringify(cart?.cart) !== JSON.stringify(new_cart)) {
      if (typeof onChange === "function") onChange();
      db.collection("carts").doc(cart.id).update({ cart: new_cart });
    }
  };

  const handleRemoveItem = (obj) => {
    if (typeof onChange === "function") onChange();
    db.collection("carts")
      .doc(cart.id)
      .update({
        cart: firebase.firestore.FieldValue.arrayRemove(obj),
      });
  };

  return (
    <article>
      <Icon
        name="close@bold"
        onClick={() => handleRemoveItem({ cuantity, size, pin })}
      />

      <div>
        <img src={src} alt={name} />
      </div>

      <div>
        <h1>{name}</h1>
        <span>Talla: {size}</span>
        <span>Precio unit: S/ {price}</span>
        <span>Total: S/ {total}</span>

        <div style={{ justifyContent: "start" }}>
          <Button variant="ghost" onClick={() => handleChange(-1)}>
            -
          </Button>
          <span>{cuantity}</span>
          <Button variant="ghost" onClick={() => handleChange(1)}>
            +
          </Button>
        </div>
      </div>
    </article>
  );
};
