import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Dropdown from "components/dropdown";
import Icon from "components/icons";
import { useAuth } from "provider/auth";
import { useDB } from "provider/db";
import useTimeago from "hooks/useTimeago";
import { db } from "db/firebase";
import css from "@css/web/layout.module.css";
import useWindowSize from "hooks/useWindowSize";
import Portal from "components/portals";

const Timeago = ({ time }) => {
  const timeago = useTimeago(time);
  return <span>{timeago}</span>;
};

export default function Notifications() {
  const router = useRouter();
  const dropdown = useRef(null);
  const notification_popup = useRef(null);
  const { user } = useAuth();
  const { orders } = useDB();
  const { width } = useWindowSize();

  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const [notifications, setNotifications] = useState();
  const [showBadge, setShowBadge] = useState(false);
  const [unnotified, setUnnotified] = useState();
  const [counter, setCounter] = useState(0);

  const openOrder = (id) => {
    let doc = unnotified?.[id];

    if (doc) {
      db.collection("orders")
        .doc(id)
        .update(doc)
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
    }

    dropdown.current?.setAttribute("state", null);
    router.push(`/mis-pedidos/${id}`);
  };

  useEffect(() => {
    let unnotified = {};
    let filtered = [];
    let counter = 0;

    orders?.forEach((item) => {
      if (item?.user?.uid === user?.uid) {
        if (item?.delivered) {
          filtered.push({
            ...item,
            time: item?.deliverydate,
            cause: "delivered",
          });
        }

        if (item?.displayed) {
          filtered.push({
            ...item,
            time: item?.displaydate,
            cause: "displayed",
          });
        }

        let data = {};
        if (!item?.deliverynotified && item?.delivered) {
          counter++;
          data.deliverynotified = true;
        }

        if (!item?.displaynotified && item?.displayed) {
          counter++;
          data.displaynotified = true;
        }

        if (Object.keys(data).length > 0) unnotified[item?.id] = data;
      }
    });

    filtered?.sort((a, b) => b?.time - a?.time);
    setUnnotified(unnotified);
    setNotifications(filtered);

    setCounter(counter);
    if (counter >= 1) setShowBadge(true);
    else setShowBadge(false);
  }, [user, orders]);

  useEffect(() => {
    setIsNotificationPopupOpen(false);
  }, [width]);

  return (
    <>
      {width >= 560 ? (
        <Dropdown ref={dropdown}>
          <Icon
            name="notification@broken"
            badge-variant={showBadge ? "dot" : null}
          />

          <div className={css.notifications_ddl}>
            <header>
              <p>
                Notificaciones
                <span>
                  {counter == 0
                    ? "No tienes notificaciones nuevas"
                    : counter == 1
                    ? "Tienes 1 nueva notificación"
                    : `Tienes ${counter} notificaciones nuevas`}
                </span>
              </p>

              <Icon name="notification@broken" />
            </header>

            <div>
              {notifications?.map((notif, index) => {
                let isUnnotified = unnotified?.[notif?.id];
                let isCurrentNotification = false;

                if (
                  notif?.cause == "displayed" &&
                  isUnnotified?.displaynotified
                ) {
                  isCurrentNotification = true;
                }

                if (
                  notif?.cause == "delivered" &&
                  isUnnotified?.deliverynotified
                ) {
                  isCurrentNotification = true;
                }

                return (
                  <article
                    key={index}
                    state={
                      isUnnotified && isCurrentNotification
                        ? "is-unnotified"
                        : null
                    }
                    onClick={() => openOrder(notif?.id)}
                  >
                    <div>
                      <img src="/logo_avatar.svg" alt="" />
                    </div>

                    <p>
                      <span>Giovi's</span>
                      <span>Equipo de logística</span>
                      <span>
                        Su pedido <span>#{notif?.id} </span>
                        {notif?.cause == "displayed"
                          ? `está siendo procesado...`
                          : `ha sido entregado`}
                      </span>
                    </p>

                    <span>
                      <Timeago time={notif?.time} />
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        </Dropdown>
      ) : (
        <>
          {isNotificationPopupOpen ? (
            <Portal>
              <div
                className="alert"
                onClick={(e) => {
                  if (!notification_popup.current?.contains(e.target)) {
                    setIsNotificationPopupOpen(false);
                  }
                }}
              >
                <div
                  style={{
                    maxHeight: "40rem",
                    width: "calc(100% - 2rem)",
                    maxWidth: "24rem",
                  }}
                >
                  <div
                    className={css.notifications_ddl}
                    ref={notification_popup}
                    style={{ width: "100%" }}
                  >
                    <header>
                      <p>
                        Notificaciones
                        <span>
                          {counter == 0
                            ? "No tienes notificaciones nuevas"
                            : counter == 1
                            ? "Tienes 1 nueva notificación"
                            : `Tienes ${counter} notificaciones nuevas`}
                        </span>
                      </p>

                      <Icon name="notification@broken" />
                    </header>

                    <div>
                      {notifications?.map((notif, index) => {
                        let isUnnotified = unnotified?.[notif?.id];
                        let isCurrentNotification = false;

                        if (
                          notif?.cause == "displayed" &&
                          isUnnotified?.displaynotified
                        ) {
                          isCurrentNotification = true;
                        }

                        if (
                          notif?.cause == "delivered" &&
                          isUnnotified?.deliverynotified
                        ) {
                          isCurrentNotification = true;
                        }

                        return (
                          <article
                            key={index}
                            state={
                              isUnnotified && isCurrentNotification
                                ? "is-unnotified"
                                : null
                            }
                            onClick={() => openOrder(notif?.id)}
                          >
                            <div>
                              <img src="/logo_avatar.svg" alt="" />
                            </div>

                            <p>
                              <span>Giovi's</span>
                              <span>Equipo de logística</span>
                              <span>
                                Su pedido <span>#{notif?.id} </span>
                                {notif?.cause == "displayed"
                                  ? `está siendo procesado...`
                                  : `ha sido entregado`}
                              </span>
                            </p>

                            <span>
                              <Timeago time={notif?.time} />
                            </span>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Portal>
          ) : null}

          <button onClick={() => setIsNotificationPopupOpen(true)}>
            <Icon
              name="notification@broken"
              badge-variant={showBadge ? "dot" : null}
            />
          </button>
        </>
      )}
    </>
  );
}
