import { useAuth } from "provider/auth";
import Dropdown from "components/dropdown";
import Icon from "components/icons";
import avatarcss from "@css/web/layout.module.css";
import Link from "components/links";
import { auth, db } from "db/firebase";
import Portal from "components/portals";
import Button from "components/buttons";
import { useEffect, useRef, useState } from "react";
import { toast } from "components/toasts";
import useWindowSize from "hooks/useWindowSize";

export default function HeaderSetup() {
  const [alertState, setAlertState] = useState("");
  const [isSetupPopupOpen, setIsSetupPopupOpen] = useState(false);

  const dropdown = useRef(null);
  const setup_popup = useRef(null);
  const { user } = useAuth();
  const { width } = useWindowSize();

  const signout = () => {
    auth.signOut().catch((error) => console.log(error));
  };

  const showAlert = () => {
    dropdown.current?.removeAttribute("state");
    setAlertState("is-open");
  };

  const deleteAccount = () => {
    // Delet user settings
    db.collection("users")
      .doc(user.uid)
      .delete()
      .then(() => {
        // Delete user
        auth.currentUser
          .delete()
          .then(() => {
            toast({
              value: "Tu cuenta a sido eleminada satisfatoriamente",
            });
          })
          .catch((error) => {
            switch (error.code) {
              case "auth/requires-recent-login":
                toast({
                  value: "Oh! A ocurrido un error inesperado",
                  type: "error",
                });

                setTimeout(() => {
                  toast({
                    type: "info",
                    value: "Vuelve a iniciar sesión e intenta de nuevo",
                  });
                }, 2000);
                break;
              default:
                console.log(error);
                break;
            }
          });
      })
      .catch((error) => {
        console.error(error);
        return toast({
          value: "Oh! A ocurrido un error inesperador. Inténtalo de nuevo",
        });
      });
  };

  useEffect(() => {
    setIsSetupPopupOpen(false);
  }, [width]);

  return (
    <>
      {alertState == "is-open" ? (
        <Portal>
          <div className="alert">
            <div
              className={avatarcss.remove}
              style={{ padding: "1rem", boxSizing: "border-box" }}
            >
              <header>
                <h3>Borrar cuenta</h3>
                <button onClick={() => setAlertState("")}>
                  <Icon name="close-square@broken" />
                </button>
              </header>

              <article>
                <Icon name="danger@broken" />
                <p>
                  Después de borrar una cuenta, esta se borra de manera
                  permanente. Esta acción no se puede deshacer. Se elimirá toda
                  tu información excepto las compras que realizaste
                </p>
              </article>

              <div>
                <span>Cuenta de usuario</span>
                <p>{user?.email}</p>
              </div>

              <footer>
                <Button
                  color="silver@8"
                  variant="ghost"
                  onClick={() => setAlertState("")}
                >
                  Cancelar
                </Button>

                <Button
                  color="alizarin"
                  variant="outlined"
                  onClick={() => deleteAccount()}
                >
                  Aceptar
                </Button>
              </footer>
            </div>
          </div>
        </Portal>
      ) : null}

      {width >= 700 ? (
        <Dropdown origin="bottom-end" ref={dropdown}>
          <>
            {!user?.avatar && <Icon name="profile@broken" />}

            {user?.avatar && (
              <img
                className={avatarcss.avatar}
                src={user?.avatar}
                alt={user?.username}
              />
            )}

            <span className={avatarcss.username}>
              {user?.username?.split(" ")[0] || "Usuario"}
            </span>
          </>

          <div className={avatarcss.setup}>
            <div className={avatarcss.setup_avatar}>
              {user?.avatar && (
                <img src={user?.avatar} alt={user?.username || "Usuario"} />
              )}

              {!user?.avatar && <Icon name="profile@bold" />}

              <div>
                <p>{user?.username || "Usuario"}</p>
                <span>{user?.email}</span>
              </div>
            </div>

            <hr />

            {user?.role == "administrador" && (
              <Link href="/dashboard">
                <Icon name="activity@bold" />
                Dashboard
              </Link>
            )}

            <Link href="/mis-pedidos">
              <Icon name="bookmark@bold" />
              Pedidos realizados
            </Link>

            <button onClick={signout}>
              <Icon name="logout@bold" />
              Cerrar sesión
            </button>

            {user?.role == undefined && (
              <>
                <hr />

                <button onClick={showAlert} className={avatarcss.delete}>
                  <Icon name="delete@bold" />
                  Eliminar cuenta
                </button>
              </>
            )}
          </div>
        </Dropdown>
      ) : (
        <>
          {isSetupPopupOpen ? (
            <Portal>
              <div
                className="alert"
                onClick={(e) => {
                  if (!setup_popup.current?.contains(e.target)) {
                    setIsSetupPopupOpen(false);
                  }
                }}
              >
                <div
                  style={{
                    width: "calc(100% - 2rem)",
                    maxWidth: "21rem",
                  }}
                >
                  <div
                    className={avatarcss.setup}
                    ref={setup_popup}
                    style={{ width: "100%" }}
                  >
                    <div
                      className={avatarcss.setup_avatar}
                      style={{ width: "auto" }}
                    >
                      {user?.avatar && (
                        <img
                          src={user?.avatar}
                          alt={user?.username || "Usuario"}
                        />
                      )}

                      {!user?.avatar && <Icon name="profile@bold" />}

                      <div>
                        <p>{user?.username || "Usuario"}</p>
                        <span>{user?.email}</span>
                      </div>
                    </div>

                    <hr />

                    {user?.role == "administrador" && (
                      <Link href="/dashboard" style={{ width: "100%" }}>
                        <Icon name="activity@bold" />
                        Dashboard
                      </Link>
                    )}

                    <Link href="/mis-pedidos" style={{ width: "100%" }}>
                      <Icon name="bookmark@bold" />
                      Pedidos realizados
                    </Link>

                    <Link
                      href="/preguntas-frecuentes"
                      style={{ width: "100%" }}
                    >
                      <Icon name="info-circle@bold" />
                      Centro de ayuda
                    </Link>

                    <hr />

                    <button onClick={signout} style={{ width: "100%" }}>
                      <Icon name="logout@bold" />
                      Cerrar sesión
                    </button>

                    {user?.role == undefined && (
                      <>
                        <hr />

                        <button
                          onClick={showAlert}
                          className={avatarcss.delete}
                          style={{ width: "100%" }}
                        >
                          <Icon name="delete@bold" />
                          Eliminar cuenta
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Portal>
          ) : null}

          <button onClick={() => setIsSetupPopupOpen(true)}>
            {!user?.avatar && <Icon name="profile@broken" />}
            {user?.avatar && (
              <img
                className={avatarcss.avatar}
                src={user?.avatar}
                alt={user?.username}
              />
            )}
            <span className={avatarcss.username}>
              {user?.username?.split(" ")[0] || "Usuario"}
            </span>
          </button>
        </>
      )}
    </>
  );
}
