import Dropdown from "components/dropdown";
import Button from "components/buttons";
import Input from "components/inputs";
import Icon from "components/icons";
import authcss from "@css/web/layout.module.css";
import { useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "db/firebase";
import useWindowSize from "hooks/useWindowSize";
import Portal from "components/portals";

export default function HeaderAuth() {
  const { width } = useWindowSize();
  const setup_ref = useRef(null);
  const [authAction, setAuthAction] = useState("signin");
  const [isSetupPopupOpen, setIsSetupPopupOpen] = useState(false);
  const [inputState, setInputState] = useState({
    email: {
      value: "",
      error: false,
    },
    password: {
      value: "",
      error: false,
    },
  });

  const regex = {
    email:
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
    password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])\w{8,}$/,
  };

  const handleInputChange = (e) => {
    const { value, name } = e.target;
    if (value?.[0] == " ") return;

    if (regex?.[name]?.test(value)) {
      setInputState({
        ...inputState,
        [name]: {
          value: value,
          error: false,
        },
      });
    } else {
      setInputState({
        ...inputState,
        [name]: {
          value: value,
          error: true,
        },
      });
    }
  };

  const signInWithGoogle = () => {
    auth
      .signInWithPopup(googleProvider)
      .then((userCredential) => {
        const isNewUser = userCredential.additionalUserInfo.isNewUser;
        const userSettings = {
          email: userCredential.user.email,
          username: userCredential.user.displayName,
          avatar: userCredential.user.photoURL,
        };

        if (isNewUser) {
          db.collection("users")
            .doc(userCredential.user.uid)
            .set(userSettings)
            .catch((error) => console.error(error));
        }
      })
      .catch((err) => console.error(err));
  };

  const signInOrSignUp = () => {
    if (inputState?.email?.value == "" && inputState?.password?.value == "") {
      return console.log("!Ups! Debe completar todos los campos");
    }

    if (inputState?.email?.value == "") {
      return console.log("!Ups! Olvidó el email");
    }

    if (inputState?.password?.value == "") {
      return console.log("!Ups! Ya pe' mano. Y la contra?");
    }

    if (!regex?.email?.test(inputState?.email?.value)) {
      return console.log("Chanfle! Cómo es que no recuerdas tu email");
    }

    if (!regex?.password?.test(inputState?.password?.value)) {
      return console.log(
        "🎵 Ese compa ya está muerto! No se acuerda la contra dice!"
      );
    }

    if (authAction === "signin") {
      auth
        .signInWithEmailAndPassword(
          inputState?.email?.value,
          inputState?.password?.value
        )
        .catch((error) => {
          switch (error.code) {
            case "auth/user-not-found":
              createAccount(
                inputState?.email?.value,
                inputState?.password?.value
              );
              break;

            default:
              console.log(error);
          }
        });
    }

    if (authAction === "signup") {
      createAccount(inputState?.email?.value, inputState?.password?.value);
    }
  };

  const createAccount = (email, password) => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const userSettings = {
          email: userCredential.user.email,
        };

        db.collection("users")
          .doc(userCredential.user.uid)
          .set(userSettings)
          .catch((error) => console.error(error));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    setIsSetupPopupOpen(false);
    setAuthAction("signin");
    setInputState({
      email: {
        value: "",
        error: false,
      },
      password: {
        value: "",
        error: false,
      },
    });
  }, [width]);

  return (
    <>
      {width > 720 ? (
        <Dropdown origin="bottom-end">
          <Button variant="outlined">Comienza gratis</Button>

          <div className={authcss.auth}>
            <p>Usa una de tus redes</p>

            <div className={authcss.social}>
              <Button
                variant="outlined"
                color="nephritis"
                onClick={signInWithGoogle}
              >
                <Icon name="google" />
                Google
              </Button>
            </div>

            <p>O usa tu correo electrónico</p>

            <form className={authcss.form}>
              <label>Correo electrónico</label>
              <Input
                placeholder="Correo electrónico"
                name="email"
                state={inputState?.email?.error ? "is-error" : null}
                onChange={(e) => handleInputChange(e)}
                value={inputState?.email?.value}
              />

              <label>Contraseña</label>
              <Input
                type="password"
                placeholder="Contraseña"
                name="password"
                state={inputState?.password?.error ? "is-error" : null}
                onChange={(e) => handleInputChange(e)}
                value={inputState?.password?.value}
              />

              <Button size="large" onClick={() => signInOrSignUp()}>
                {authAction == "signin" && "Iniciar sesión"}
                {authAction == "signup" && "Registrarse"}
              </Button>
            </form>

            <footer className={authcss.footer}>
              {authAction == "signin" && (
                <>
                  <p>
                    ¿No tienes una cuenta?
                    <button onClick={() => setAuthAction("signup")}>
                      Registrarse gratis
                    </button>
                  </p>

                  <a href="">¿Olvidaste tu contraseña?</a>
                </>
              )}

              {authAction == "signup" && (
                <p>
                  ¿Ya tienes cuenta?
                  <button onClick={() => setAuthAction("signin")}>
                    Iniciar sesión
                  </button>
                </p>
              )}
            </footer>
          </div>
        </Dropdown>
      ) : (
        <>
          {isSetupPopupOpen ? (
            <Portal>
              <div
                className="alert"
                onClick={(e) => {
                  if (!setup_ref.current?.contains(e.target)) {
                    setIsSetupPopupOpen(false);
                  }
                }}
              >
                <div
                  className={authcss.auth}
                  ref={setup_ref}
                  style={{
                    width: "calc(100vw - 2rem)",
                    maxWidth: "25rem",
                  }}
                >
                  <p>Usa una de tus redes</p>

                  <div className={authcss.social}>
                    <Button
                      variant="outlined"
                      color="nephritis"
                      onClick={signInWithGoogle}
                    >
                      <Icon name="google" />
                      Google
                    </Button>
                  </div>

                  <p>O usa tu correo electrónico</p>

                  <form className={authcss.form}>
                    <label>Correo electrónico</label>
                    <Input
                      placeholder="Correo electrónico"
                      name="email"
                      state={inputState?.email?.error ? "is-error" : null}
                      onChange={(e) => handleInputChange(e)}
                      value={inputState?.email?.value}
                    />

                    <label>Contraseña</label>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      name="password"
                      state={inputState?.password?.error ? "is-error" : null}
                      onChange={(e) => handleInputChange(e)}
                      value={inputState?.password?.value}
                    />

                    <Button size="large" onClick={() => signInOrSignUp()}>
                      {authAction == "signin" && "Iniciar sesión"}
                      {authAction == "signup" && "Registrarse"}
                    </Button>
                  </form>

                  <footer className={authcss.footer}>
                    {authAction == "signin" && (
                      <>
                        <p>
                          ¿No tienes una cuenta?
                          <button onClick={() => setAuthAction("signup")}>
                            Registrarse gratis
                          </button>
                        </p>

                        <a href="">¿Olvidaste tu contraseña?</a>
                      </>
                    )}

                    {authAction == "signup" && (
                      <p>
                        ¿Ya tienes cuenta?
                        <button onClick={() => setAuthAction("signin")}>
                          Iniciar sesión
                        </button>
                      </p>
                    )}
                  </footer>
                </div>
              </div>
            </Portal>
          ) : null}

          <button onClick={() => setIsSetupPopupOpen(true)}>
            <Icon name="profile@broken" />
          </button>
        </>
      )}
    </>
  );
}
